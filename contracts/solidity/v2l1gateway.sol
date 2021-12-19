

pragma solidity ^0.6.12;
//SPDX-License-Identifier: UNLICENSED

interface IStarknetCore {
    /**
      Sends a message to an L2 contract.

      Returns the hash of the message.
    */
    function sendMessageToL2(
        uint256 toAddress,
        uint256 selector,
        uint256[] calldata payload
    ) external returns (bytes32);

    /**
      Consumes a message that was sent from an L2 contract.

      Returns the hash of the message.
    */
    function consumeMessageFromL2(uint256 fromAddress, uint256[] calldata payload)
        external
        returns (bytes32);
        
     /**
      Message registry
     */
    function l2ToL1Messages(bytes32 msgHash) external view returns (uint256);
}


interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


//////////////////////////////////////////////////////////////////////////////////////////////////
    
/**
  Demo contract for L1 <-> L2 interaction between an L2 StarkNet contract and this L1 solidity
  contract.
*/
contract L1L2Example {
    // The StarkNet core contract.
    IStarknetCore public starknetCore;
	//l2 Gateway contract address
	uint256 public l2GatewayAddress;	
	//balance of l2erc20contracts, not the users/accounts themselves. 	
    mapping(uint256=> uint256) public custodyBalances;
   
   

    uint256 constant MESSAGE_WITHDRAW = 0;

    // The selector of the "deposit" l1_handler.
    uint256 constant DEPOSIT_SELECTOR =
        352040181584456735608515580760888541466059565068553383579463728554843487745;

    /**
      Initializes the contract state.
      The two contracts, cairo-solidit, have to be initialied in the following order: 1 deploy the cairo contract, 2 sol deploy with cairo address, 3 set the address of the sol contract on cairo. 
    */
    constructor(IStarknetCore starknetCore_, uint256 l2GatewayAddress_) public {
        starknetCore = starknetCore_;
        l2GatewayAddress = l2GatewayAddress_;
    }
    
    //events to be emitted
    event BridgeToStarknet(
        address indexed l1ERC20,
        uint256 indexed l2ERC20,
        uint256 indexed l2Account,
        uint256 amount
    );
    
    event BridgeFromStarknet(
        address indexed l1ERC20,
        uint256 indexed l2ERC20,
        address indexed l1Account,
        uint256 amount
    );
    
    
    function deposit(
        IERC20 l1ContractAddress,
        uint256 l2ContractAddress,
        uint256 user,
        uint256 amount
    ) external payable {
        
    	// optimistic transfer, should revert if no approved or not owner
        l1ContractAddress.transferFrom(msg.sender, address(this), amount);
        
		uint256 amountLow = amount % 2**128;
		uint256 amountHigh = amount / 2**128;
        // Construct the deposit message's payload.
        uint256[] memory payload = new uint256[](3);
        payload[0] = user;
        payload[1] = amountLow;
        payload[2] = amountHigh;

        // Send the message to the StarkNet core contract.
        starknetCore.sendMessageToL2(l2ContractAddress, DEPOSIT_SELECTOR, payload);
    }
    
    
    
    
    // Bridging to Starknet
    function bridgeToStarknet(
        IERC721 _l1TokenContract,
        uint256 _l2TokenContract,
        uint256 _tokenId,
        uint256 _account
    ) external {
        uint256[] memory payload = new uint256[](4);

        // optimistic transfer, should revert if no approved or not owner
        _l1TokenContract.transferFrom(msg.sender, address(this), _tokenId);

        // build deposit message payload
        payload[0] = _account;
        payload[1] = addressToUint(address(_l1TokenContract));
        payload[2] = _l2TokenContract;
        payload[3] = _tokenId;

        // send message
        starknetCore.sendMessageToL2(
            endpointGateway,
            ENDPOINT_GATEWAY_SELECTOR,
            payload
        );

        emit BridgeToStarknet(
            address(_l1TokenContract),
            _l2TokenContract,
            _account,
            _tokenId
        );
    }






    function withdrawFromL2(
        uint256 l2ContractAddress,
        uint256 user, //this is a uint256 here, but it represents an address. So the javascript will have to do the conversion from address to uint256. This makes the gas fee lower.
        //uint256 withdrawAddress,
        uint256 amount
    ) external {
        // Construct the withdrawal message's payload.
        uint256[] memory payload = new uint256[](5);
        
	//do the processing for cairo
	uint256 amountLow = amount % 2**128;
	uint256 amountHigh = amount / 2**128;

        payload[0] = MESSAGE_WITHDRAW;
        payload[1] = user;
        payload[2] = uint256(uint160(address(msg.sender)));
        payload[3] = amountLow;
        payload[4] = amountHigh;

        // Consume the message from the StarkNet core contract.
        // This will revert the (Ethereum) transaction if the message does not exist.
        starknetCore.consumeMessageFromL2(l2ContractAddress, payload);

        // Update the L1 balance.
        bool r = msg.sender.send(amount);
        if (!r){
          accountBalances[uint256(uint160(address(msg.sender)))] += amount;
        }
    }

    function withdrawFromL1(
        uint256 amount
    ) external {
        
        uint256 uintAddress = uint256(uint160(address(msg.sender)));    
        require(amount <= accountBalances[uintAddress], "Invalid amount.");
        
        // Update the L1 balance.
        accountBalances[uintAddress] -= amount;

        bool r = msg.sender.send(amount);
        if (!r){
          accountBalances[uintAddress] += amount;
        }
        //return r;
    }

    
} 

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";


contract Gateway {
    
    uint256 constant ENDPOINT_GATEWAY_SELECTOR =
        1738423374452994793145864788013146788518531877200292826651981332061687045062;
    
    uint256 constant BRIDGE_MODE_DEPOSIT = 0;
    uint256 constant BRIDGE_MODE_WITHDRAW = 1;

    

    // Utils
    function addressToUint(address value)
        internal
        pure
        returns (uint256 convertedValue)
    {
        convertedValue = uint256(uint160(address(value)));
    }

    

    

    function bridgeFromStarknetAvailable(
        IERC721 _l1TokenContract,
        uint256 _l2TokenContract,
        uint256 _tokenId
    ) external view returns (bool) {
        uint256[] memory payload = new uint256[](5);

        // build withdraw message payload
        payload[0] = BRIDGE_MODE_WITHDRAW;
        payload[1] = addressToUint(msg.sender);
        payload[2] = addressToUint(address(_l1TokenContract));
        payload[3] = _l2TokenContract;
        payload[4] = _tokenId;

        bytes32 msgHash = keccak256(
            abi.encodePacked(
                endpointGateway,
                addressToUint(address(this)),
                payload.length,
                payload
            )
        );

        return starknetCore.l2ToL1Messages(msgHash) > 0;
    }

    function debug_bridgeFromStarknetAvailable(
        IERC721 _l1TokenContract,
        uint256 _l2TokenContract,
        uint256 _tokenId
    ) external view returns (bytes32) {
        uint256[] memory payload = new uint256[](5);

        // build withdraw message payload
        payload[0] = BRIDGE_MODE_WITHDRAW;
        payload[1] = addressToUint(msg.sender);
        payload[2] = addressToUint(address(_l1TokenContract));
        payload[3] = _l2TokenContract;
        payload[4] = _tokenId;

        bytes32 msgHash = keccak256(
            abi.encodePacked(
                endpointGateway,
                addressToUint(address(this)),
                payload.length,
                payload
            )
        );

        return msgHash;
    }

    // Bridging back from Starknet
    function bridgeFromStarknet(
        IERC721 _l1TokenContract,
        uint256 _l2TokenContract,
        uint256 _tokenId
    ) external {
        uint256[] memory payload = new uint256[](5);

        // build withdraw message payload
        payload[0] = BRIDGE_MODE_WITHDRAW;
        payload[1] = addressToUint(msg.sender);
        payload[2] = addressToUint(address(_l1TokenContract));
        payload[3] = _l2TokenContract;
        payload[4] = _tokenId;

        // consum withdraw message
        starknetCore.consumeMessageFromL2(endpointGateway, payload);

        // optimistic transfer, should revert if gateway is not token owner
        _l1TokenContract.transferFrom(address(this), msg.sender, _tokenId);

        emit BridgeFromStarknet(
            address(_l1TokenContract),
            _l2TokenContract,
            msg.sender,
            _tokenId
        );
    }
}
