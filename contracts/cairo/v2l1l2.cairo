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

@contract_interface 
namespace IBridgedERC20:
    func mint(to : felt, amount : Uint256):
    end

    func ERC20_burn(account : felt, amount: Uint256):
    end

    func balanceOf(account : felt) -> (amount : Uint256):
    end

    func l1ERC20Address() -> (address : felt):
    end
end

# construction guard
@storage_var
func initialized() -> (res : felt):
end


#address of l1Gateway pair contract.
@storage_var
func l1GatewayAddress() -> (res:felt):
end

@view
func getGatewayAddress{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (res : felt):
    let (l1GatewayAddress) = l1GatewayAddress.read()
    return (l1GatewayAddress)
end


# keep track of the minted ERC20
@storage_var
func custody(l2ERC20Address : felt) -> (res : Uint256):
end

#stores how many tokens each BridgedERC20.cairo holds.
@view
func getCustodyBalance{
	syscall_ptr : felt*,
	pedersen_ptr : HashBuiltin*, 
	range_check_ptr
	}(l2ERC20Address : felt) -> (balance : Uint256):
    let (balance: Uint256) = custody.read(l2ERC20Address = l2ERC20Address)
    return (balance)
end

# keep track of deposit messages, before minting.  if amount is 0, there is no need to mint
@storage_var
func mintCredit(l1ERC20Address : felt, l2ERC20Address : felt, owner : felt) -> ( amount : Uint256):
end

@view
func getMintCredit{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        l1ERC20ddress : felt, l2ERC20Address : felt, owner : felt) -> ( amount : Uint256):
    let (amount : Uint256) = mintCredit.read(
        l1ERC20Address=l1ERC20Address, l2ERC20Address=l2ERC20Address, owner=owner)
    return (amount)
end


#Basically constructor
@external
func initialize{
	syscall_ptr : felt*,
	pedersen_ptr : HashBuiltin*,
	range_check_ptr
    }( l1GatewayAddress : felt):
    let (isInitialized) = initialized.read()
    assert isInitialized = 0

    l1GatewayAddress.write(l1GatewayAddress)

    initialized.write(1)
    return ()
end


# receive and handle deposit messages
@l1_handler
func bridgeFromL1{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        from_address : felt,  l1ERC20Address : felt , l2ERC20Address : felt , owner : felt,
       amountLow : felt, amountHigh:felt):
       
    # Make sure the message was sent by the L1 Gateway contract.
    let (l1GatewayAddress:felt)=l1GatewayAddress.read()
    assert from_address = l1GatewayAddress
    
    #read, compute and update mintcredit. If we carry, then we will have an error. 
   	let ( currentAmount : Uint256) = mintCredit.read(l1ERC20Address, l2ERC20Address, owner)
    let (newAmount:Uint256, carry:felt) = uint256_add(currentAmount, Uint256(amountLow, amountHigh))
    assert carry=0
	
    mintCredit.write(
        l1ERC20ddress=l1ERC20address,
        l2ERC20ddress=l2ERC20address,
        owner=owner,
        value=newAmount)

    return ()
end





# tries to consume all of the availabe mint credit 
@external
func consumeMintCredit{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        l1ERC20Address : felt , l2ERC20Address : felt , owner : felt):
    
    #get amount to mint, assert >0
    let (amount:Uint256) = mint_credits.read(
        l1ERC20Address = l1ERC20Address, l2ERC20Address = l2ERC20Address, owner=owner)

    assert uint256_lt(UInt(0, 0), amount)

	#Check that the address we are minting to is valid. 
    let (_l1ERC20Address) = IBridgedERC20.l1ERC20Address(contract_address=l2ERC20Address)
    assert _l1ERC20Address = l1ERC20Address

	#consume credit
	mintCredit.write(
        l1ERC20Address=l1ERC20Address, l2ERC20Address=l2ERC20Address, owner=owner, amount=Uint(0, 0))
	
	#Mint
    IBridgedERC20.mint(
        contract_address=l2ERC20Address, owner=owner, amount=amount)
        
    
    # Read the current custody balance.
    let (currentAmount : Uint256) = custody.read(account=l2ERC20Address)
     
    # Compute and update the new balance.
    let (newBalance:Uint256, carry:felt) = uint256_add(currentAmount, Uint256(amountLow, amountHigh))
    assert carry=0
          
    custody.write( l2ERC20Address, newBalance)

    return ()
end

# revoke all of the available mint credit if consuming is failing. Basically a variant of BridgeToL1. 
@external
func revokeMintCredit{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        l1ERC20Address : felt, l2ERC20Address : felt, l1Owner : felt ):
        
    let (owner) = get_caller_address()
    let (amount : Uint256) = mintCredit.read(
        l1ERC20Address=l1ERC20Address, l2ERC20Address=l2ERC20Address, owner=owner)

    assert uint_lt(Uint256(0,0), amount) 

    let (l1GatewayAddress) = l1GatewayAddress.read()

    let (message_payload : felt*) = alloc()
    assert message_payload[0] = MESSAGE_WITHDRAW
    assert message_payload[1] = l1ERC20Address
    assert message_payload[2] = l2ERC20Address
    assert message_payload[3] = l1Owner
    assert message_payload[4] = amount.low
    assert message_payload[5] = amount.high

	mintCredit.write(
        l1ERC20Address=l1ERC20Address, l2ERC20Address=l2ERC20Address, owner=owner, amount=Uint(0, 0))

    send_message_to_l1(to_address=l1GatewayAddress, payload_size=6, payload=message_payload)

    

    return ()
end





# burns the L2 ERC20 and sends withdrawal message
@external
func bridgeToL1{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        l2ERC20Address : felt, l1Owner : felt, amount : Uint256):
    alloc_locals
    
    let (owner) = get_caller_address()
    let (l1ERC20Address) = IBridgedERC20.l1ERC20Address(contract_address=l2ERC20Address)
    let (availableAmount : Uint256) = IBridgedERC20.balanceOf(contract_address=l2ERC20Address, account=owner)
    
    uint256_check(amount)
    assert (uint256_le(amount, availableAmount))

	#burn amount of tokens
    IBridgedERC721.burn(contract_address=l2ERC20Address, account=owner, amount=amount)


	#update custody balance
	# Read the current custody balance.
    let (currentAmount : Uint256) = custody.read(account=l2ERC20Address)
     
    # Compute and update the new balance.
    let (newBalance:Uint256) = uint256_sub(currentAmount, Uint256(amountLow, amountHigh))
    custody.write( l2ERC20Address, newBalance)

	

	#send message to l1
	let (l1gatewayAddress) = l1GatewayAddress.read()

    let (message_payload : felt*) = alloc()
    assert message_payload[0] = MESSAGE_WITHDRAW
    assert message_payload[1] = l1ERC20Address
    assert message_payload[2] = l2ERC20Address
    assert message_payload[3] = l1Owner
    assert message_payload[4] = amount.low
    assert message_payload[5] = amount.high

    

    send_message_to_l1(to_address=l1GatewayAddress, payload_size=6, payload=message_payload)



    return ()
end
