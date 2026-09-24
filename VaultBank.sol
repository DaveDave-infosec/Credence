// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// VaultBank.sol - deliberate reentrancy bug for Remedy verifier testing.
// Deposits are tracked per address. withdraw() sends ETH BEFORE clearing the
// balance, so a contract depositor can re-enter and drain the vault.
contract VaultBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        require(msg.value > 0, "no value");
        balances[msg.sender] += msg.value;
    }

    // VULNERABLE: the external call happens before the balance is zeroed.
    // A contract caller whose receive() calls withdraw() again still shows a
    // non-zero balance on re-entry and can withdraw repeatedly.
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "nothing to withdraw");
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        balances[msg.sender] = 0;
    }

    function totalHeld() external view returns (uint256) {
        return address(this).balance;
    }
}
