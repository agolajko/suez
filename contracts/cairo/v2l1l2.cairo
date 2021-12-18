%lang starknet
%builtins pedersen range_check

from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.math import assert_nn
from starkware.starknet.common.messages import send_message_to_l1
from starkware.cairo.common.uint256 import (
    Uint256, uint256_add, uint256_sub, uint256_le, uint256_lt, uint256_check)
from starkware.starknet.common.syscalls import get_caller_address
from starkware.cairo.common.math import assert_not_zero


const MESSAGE_WITHDRAW = 0

@contract_interface ###Rewrite this to ERC20
namespace IBridgedERC721:
    func create_token(owner : felt, token_id : felt):
    end

    func delete_token(token_id : felt):
    end

    func owner_of(token_id : felt) -> (owner : felt):
    end

    func get_l1_address() -> (address : felt):
    end
end



# keep track of the minted ERC20
@storage_var
func custody(l1_token_address : felt, amount : felt) -> (res : felt):
end

@storage_var
func l1GatewayAddress() -> (res:felt):
end

@constructor
func constructor{
        syscall_ptr : felt*, 
        pedersen_ptr : HashBuiltin*,
        range_check_ptr
    }(_l1GatewayAddress: felt):
    l1GatewayAddress.write(_l1GatewayAddress)
    return()
end

@view
func getBalance{
	syscall_ptr : felt*,
	pedersen_ptr : HashBuiltin*,
	range_check_ptr
    }(account : felt) -> (balance : Uint256):
    let (balance: Uint256) = balances.read(account=account)
    return (balance)
end








@external
func withdraw{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
         withdrawAddress:felt ,amount : Uint256):
    # Make sure 'amount' is positive.
    alloc_locals
    
    uint256_check(amount)

    #read old balance
    let (user:felt)=get_caller_address()
    let (local senderBalance) = balances.read(account=user)

    #check that there is enough balance, and subtract it     
    let (local enoughBalance) = uint256_le(amount, senderBalance)
    assert_not_zero(enoughBalance)
    let (newBalance:Uint256) = uint256_sub(senderBalance, amount)

    # Update the new balance.
    balances.write(user, newBalance)

    # Send the withdrawal message.
    let (message_payload : felt*) = alloc()
    assert message_payload[0] = MESSAGE_WITHDRAW
    assert message_payload[1] = user
    assert message_payload[2] = withdrawAddress
    assert message_payload[3] = amount.low
    assert message_payload[4] = amount.high ##TODO change this, amoun.low and high in sol contract as well
    let (_l1GatewayAddress:felt)=l1GatewayAddress.read()
    send_message_to_l1(to_address=_l1GatewayAddress, payload_size=5, payload=message_payload)

    return ()
end

@l1_handler
func deposit{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        from_address : felt, user : felt, amountLow : felt, amountHigh:felt):
    
    # Make sure the message was sent by the intended L1 contract.
    let (_l1GatewayAddress:felt)=l1GatewayAddress.read()
    assert from_address = _l1GatewayAddress

    # Read the current balance.
    let (currentAmount) = balances.read(account=user)
     
    # Compute and update the new balance.
    let (newBalance:Uint256, carry:felt) = uint256_add(currentAmount, Uint256(amountLow, amountHigh))
    #TODO, do something with carry.
     
    balances.write(user, newBalance)

    return ()
end



#########################################################################################################





const BRIDGE_MODE_WITHDRAW = 1


# construction guard
@storage_var
func initialized() -> (res : felt):
end

# l1 gateway address
@storage_var
func l1_gateway() -> (res : felt):
end

@view
func get_l1_gateway{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (res : felt):
    let (l1_gateway_address) = l1_gateway.read()
    return (l1_gateway_address)
end



# keep track of deposit messages, before minting
@storage_var
func mint_credits(l1_token_address : felt, token_id : felt, owner : felt) -> (res : felt):
end

@view
func get_mint_credit{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        _l1_token_address : felt, _token_id : felt, _owner : felt) -> (res : felt):
    let (res) = mint_credits.read(
        l1_token_address=_l1_token_address, token_id=_token_id, owner=_owner)
    return (res)
end

# constructor
@external
func initialize{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        _l1_gateway : felt):
    let (is_initialized) = initialized.read()
    assert is_initialized = 0

    l1_gateway.write(_l1_gateway)

    initialized.write(1)
    return ()
end

# receive and handle deposit messages
@l1_handler
func bridge_from_mainnet{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        from_address : felt, _owner : felt, _l1_token_address : felt, _l2_token_address : felt,
        _token_id : felt):
    let (res) = l1_gateway.read()
    assert from_address = res

    let (currentCustody) = custody.read(l1_token_address=_l1_token_address, token_id=_token_id)
    assert currentCustody = 0

    mint_credits.write(
        l1_token_address=_l1_token_address,
        token_id=_token_id,
        owner=_owner,
        value=_l2_token_address)

    return ()
end

# tries to consume mint credit
@external
func consume_mint_credit{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        _l1_token_address : felt, _l2_token_address : felt, _token_id : felt, _l2_owner):
    let (l2_token_address) = mint_credits.read(
        l1_token_address=_l1_token_address, token_id=_token_id, owner=_l2_owner)

    assert_not_zero(l2_token_address)

    let (l1_token_address) = IBridgedERC721.get_l1_address(contract_address=_l2_token_address)

    assert l1_token_address = _l1_token_address

    IBridgedERC721.create_token(
        contract_address=_l2_token_address, owner=_l2_owner, token_id=_token_id)
    custody.write(l1_token_address=_l1_token_address, token_id=_token_id, value=_l2_token_address)
    mint_credits.write(
        l1_token_address=_l1_token_address, token_id=_token_id, owner=_l2_owner, value=0)

    return ()
end

# revoke mint credit if consuming is failing
@external
func revoke_mint_credit{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        _l1_token_address : felt, _l2_token_address : felt, _token_id : felt):
    let (caller_address) = get_caller_address()
    let (l2_token_address) = mint_credits.read(
        l1_token_address=_l1_token_address, token_id=_token_id, owner=caller_address)

    assert_not_zero(l2_token_address)

    let (l1_gateway_address) = l1_gateway.read()

    let (message_payload : felt*) = alloc()
    assert message_payload[0] = BRIDGE_MODE_WITHDRAW
    assert message_payload[1] = caller_address
    assert message_payload[2] = _l1_token_address
    assert message_payload[3] = l2_token_address
    assert message_payload[4] = _token_id

    send_message_to_l1(to_address=l1_gateway_address, payload_size=5, payload=message_payload)

    mint_credits.write(
        l1_token_address=_l1_token_address, token_id=_token_id, owner=caller_address, value=0)

    return ()
end

@storage_var
func bridge_back_events(l1_token_address : felt, l2_token_address : felt, owner : felt, index : felt) -> (token_id : felt):
end

@storage_var
func bridge_back_event_count(l1_token_address : felt, l2_token_address : felt, owner : felt) -> (count : felt):
end

@view
func get_bridge_back_event_count{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        l1_token_address : felt, l2_token_address : felt, owner : felt) -> (count : felt):
    let (count) = bridge_back_event_count.read(l1_token_address=l1_token_address, l2_token_address=l2_token_address, owner=owner)
    return (count)
end

@view
func get_bridge_back_event{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        l1_token_address : felt, l2_token_address : felt, owner : felt, index : felt) -> (token_id : felt):
    let (token_id) = bridge_back_events.read(l1_token_address=l1_token_address, l2_token_address=l2_token_address, owner=owner, index=index)
    return (token_id)
end

# burns the L2 ERC721 and sends withdrawal message
@external
func bridge_to_mainnet{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        _l1_token_address : felt, _token_id : felt, _l1_owner : felt):
    let (caller_address) = get_caller_address()
    let (l2_token_address) = custody.read(l1_token_address=_l1_token_address, token_id=_token_id)
    let (owner) = IBridgedERC721.owner_of(contract_address=l2_token_address, token_id=_token_id)
    assert caller_address = owner

    let (l1_gateway_address) = l1_gateway.read()

    IBridgedERC721.delete_token(contract_address=l2_token_address, token_id=_token_id)

    let (message_payload : felt*) = alloc()
    assert message_payload[0] = BRIDGE_MODE_WITHDRAW
    assert message_payload[1] = _l1_owner
    assert message_payload[2] = _l1_token_address
    assert message_payload[3] = l2_token_address
    assert message_payload[4] = _token_id

    let (user_bridge_back_event_count) = bridge_back_event_count.read(l1_token_address=_l1_token_address, l2_token_address=l2_token_address, owner=_l1_owner)

    bridge_back_events.write(l1_token_address=_l1_token_address, l2_token_address=l2_token_address, owner=_l1_owner, index=user_bridge_back_event_count, value=_token_id)

    bridge_back_event_count.write(l1_token_address=_l1_token_address, l2_token_address=l2_token_address, owner=_l1_owner, value=user_bridge_back_event_count + 1)

    send_message_to_l1(to_address=l1_gateway_address, payload_size=5, payload=message_payload)

    custody.write(l1_token_address=_l1_token_address, token_id=_token_id, value=0)

    return ()
end
