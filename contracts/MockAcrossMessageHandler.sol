// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@across-protocol/contracts-v2/contracts/SpokePool.sol";

contract ExternalAcrossMessageHandler is AcrossMessageHandler {
  constructor() {}

  function handleAcrossMessage(
    address tokenSent,
    uint256 amount,
    bool fillCompleted,
    address relayer,
    bytes memory message
  ) external view override {
    // Assume the message is a number and iterate
    // an empty for loop for that many times.
    uint256 number = abi.decode(message, (uint256));
    for (uint256 i = 0; i < number; i++) {
      // Get the balance of the token sent for the relayer
      uint256 balance = IERC20(tokenSent).balanceOf(relayer);
      // If the balance is less than the amount, revert
      if (balance < amount) {
        revert("balance less than amount");
      }
    }
    // If the fill is not completed, revert
    if (!fillCompleted) {
      revert("fill not completed");
    }
  }
}
