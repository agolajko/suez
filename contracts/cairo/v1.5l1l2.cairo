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

# A mapping from a user (L1 Ethereum address) to their balance.
@storage_var
func balances(account : felt) -> (res : Uint256):
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
func transfer{
        syscall_ptr : felt*, 
        pedersen_ptr : HashBuiltin*,
        range_check_ptr
    }(recipient: felt, amount: Uint256) -> (success: felt):
    let (sender) = get_caller_address()
    _transfer(sender, recipient, amount)

    # Cairo equivalent to 'return (true)'
    return (1)
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

func _transfer{
        syscall_ptr : felt*, 
        pedersen_ptr : HashBuiltin*,
        range_check_ptr
    }(sender: felt, recipient: felt, amount: Uint256):
    alloc_locals
    assert_not_zero(sender)
    assert_not_zero(recipient)
    uint256_check(amount) # almost surely not needed, might remove after confirmation

    let (local sender_balance: Uint256) = balances.read(account=sender)

    # validates amount <= sender_balance and returns 1 if true
    let (enough_balance) = uint256_le(amount, sender_balance)
    assert_not_zero(enough_balance)

    # subtract from sender
    let (new_sender_balance: Uint256) = uint256_sub(sender_balance, amount)
    balances.write(sender, new_sender_balance)

    # add to recipient
    let (recipient_balance: Uint256) = balances.read(account=recipient)
    # overflow is not possible because sum is guaranteed by mint to be less than total supply
    let (new_recipient_balance, _: Uint256) = uint256_add(recipient_balance, amount)
    balances.write(recipient, new_recipient_balance)
    return ()
end
