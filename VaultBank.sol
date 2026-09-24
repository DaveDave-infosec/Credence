// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// VaultBank.sol - reentrancy fixed.
// withdraw() now clears the balance BEFORE the external call and holds a
// reentrancy lock for the duration, so a re-entering recipient finds nothing
// left to withdraw and the second call reverts.
contract VaultBank {
    mapping(address => uint256) public balances;
    bool private locked;

    modifier nonReentrant() {
        require(!locked, "reentrant call");
        locked = true;
        _;
        locked = false;
    }

    function deposit() external payable {
        require(msg.value > 0, "no value");
        balances[msg.sender] += msg.value;
    }

    // FIXED: effects before interactions, plus an explicit reentrancy guard.
    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "nothing to withdraw");
        balances[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
    }

    function totalHeld() external view returns (uint256) {
        return address(this).balance;
    }
}
