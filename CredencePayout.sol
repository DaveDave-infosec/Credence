// CredencePayout.sol — deliberate unchecked-call bug for Remedy verifier test
pragma solidity ^0.8.0;

contract CredencePayout {
    mapping(address => uint256) public owed;
    address public treasury;

    constructor() {
        treasury = msg.sender;
    }

    function record(address user, uint256 amount) external {
        require(msg.sender == treasury, "only treasury");
        owed[user] += amount;
    }

    // VULNERABLE: the low-level call's return value is never checked.
    // If the transfer fails (recipient reverts, out of gas, contract with no
    // payable fallback), the function still marks the debt as paid and emits
    // success — funds are lost / accounting is corrupted with no revert.
    function claim() external {
        uint256 amount = owed[msg.sender];
        require(amount > 0, "nothing owed");
        owed[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "payout transfer failed");
    }

    receive() external payable {}
}