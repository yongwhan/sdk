// The async/queue library has a task-based interface for building a concurrent queue.

import { providers } from "ethers";
import { isDefined } from "../utils";
import { isEqual } from "lodash";

/**
 * Deletes keys from an object and returns new copy of object without ignored keys
 * @param ignoredKeys
 * @param obj
 * @returns Objects with ignored keys removed
 */
function deleteIgnoredKeys(ignoredKeys: string[], obj: Record<string, unknown>) {
  if (!isDefined(obj)) {
    return;
  }
  const newObj = { ...obj };
  for (const key of ignoredKeys) {
    delete newObj[key];
  }
  return newObj;
}

export function compareResultsAndFilterIgnoredKeys(
  ignoredKeys: string[],
  _objA: Record<string, unknown>,
  _objB: Record<string, unknown>
): boolean {
  // Remove ignored keys from copied objects.
  const filteredA = deleteIgnoredKeys(ignoredKeys, _objA);
  const filteredB = deleteIgnoredKeys(ignoredKeys, _objB);

  // Compare objects without the ignored keys.
  return isEqual(filteredA, filteredB);
}

export function compareArrayResultsWithIgnoredKeys(ignoredKeys: string[], objA: unknown[], objB: unknown[]): boolean {
  // Remove ignored keys from each element of copied arrays.
  const filteredA = objA?.map((obj) => deleteIgnoredKeys(ignoredKeys, obj as Record<string, unknown>));
  const filteredB = objB?.map((obj) => deleteIgnoredKeys(ignoredKeys, obj as Record<string, unknown>));

  // Compare objects without the ignored keys.
  return isDefined(filteredA) && isDefined(filteredB) && isEqual(filteredA, filteredB);
}

/**
 * This is the type we pass to define a request "task".
 */
export interface RateLimitTask {
  // These are the arguments to be passed to super.send().
  sendArgs: [string, Array<unknown>];

  // These are the promise callbacks that will cause the initial send call made by the user to either return a result
  // or fail.
  resolve: (result: unknown) => void;
  reject: (err: unknown) => void;
}

/**
 * A helper function to format an error message for a provider.
 * @param provider The provider that failed.
 * @param rawErrorText The raw error text.
 * @returns The formatted error message.
 */
export function formatProviderError(provider: providers.StaticJsonRpcProvider, rawErrorText: string) {
  return `Provider ${provider.connection.url} failed with error: ${rawErrorText}`;
}

export function createSendErrorWithMessage(message: string, sendError: Record<string, unknown>) {
  const error = new Error(message);
  return { ...sendError, ...error };
}

/**
 * Compares two RPC results, filtering out fields that are known to differ between providers.
 * Note: this function references `IGNORED_ERROR_CODES` which is a record of error codes that correspond to fields
 *       that should be ignored when comparing RPC results.
 * @param method The method that was called - conditionally filters out fields based on the method.
 * @param rpcResultA The first RPC result.
 * @param rpcResultB The second RPC result.
 * @returns True if the results are equal, false otherwise.
 */
export function compareRpcResults(method: string, rpcResultA: unknown, rpcResultB: unknown): boolean {
  if (method === "eth_getBlockByNumber") {
    // We've seen RPC's disagree on the miner field, for example when Polygon nodes updated software that
    // led alchemy and quicknode to disagree on the miner field's value.
    return compareResultsAndFilterIgnoredKeys(
      [
        "miner", // polygon (sometimes)
        "l1BatchNumber", // zkSync
        "l1BatchTimestamp", // zkSync
        "size", // Alchemy/Arbitrum (temporary)
        "totalDifficulty", // Quicknode/Alchemy (sometimes)
      ],
      rpcResultA as Record<string, unknown>,
      rpcResultB as Record<string, unknown>
    );
  } else if (method === "eth_getLogs") {
    // We've seen some RPC's like QuickNode add in transactionLogIndex which isn't in the
    // JSON RPC spec: https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getfilterchanges
    // Additional reference: https://github.com/ethers-io/ethers.js/issues/1721
    // 2023-08-31 Added blockHash because of upstream zkSync provider disagreements. Consider removing later.
    // 2024-05-07 Added l1BatchNumber and logType due to Alchemy. Consider removing later.
    // 2024-07-11 Added blockTimestamp after zkSync rolled out a new node release.
    return compareArrayResultsWithIgnoredKeys(
      ["blockTimestamp", "transactionLogIndex", "l1BatchNumber", "logType"],
      rpcResultA as unknown[],
      rpcResultB as unknown[]
    );
  } else {
    return isEqual(rpcResultA, rpcResultB);
  }
}

export enum CacheType {
  NONE, // Do not cache
  WITH_TTL, // Cache with TTL
  NO_TTL, // Cache with infinite TTL
}