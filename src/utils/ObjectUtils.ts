/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Append value along the keyPath to object. For example assign(deposits, ['1337', '31337'], [{depositId:1}]) will create
// deposits = {1337:{31337:[{depositId:1}]}}. Note that if the path into the object exists then this will append. This

import lodash from "lodash";
import { isDefined } from "./TypeGuards";

// function respects the destination type; if it is an object then deep merge and if an array effectively will push.
export function assign(obj: any, keyPath: any[], value: any): void {
  const lastKeyIndex = keyPath.length - 1;
  for (let i = 0; i < lastKeyIndex; ++i) {
    const key = keyPath[i];
    if (!(key in obj)) {
      obj[key] = {};
    }
    obj = obj[key];
  }
  // If the object at the deep path does not exist then set to the value.
  if (!obj[keyPath[lastKeyIndex]] || typeof obj[keyPath[lastKeyIndex]] == "string") {
    obj[keyPath[lastKeyIndex]] = value;
  }
  // If the object at the deep path is an array then append array wise.
  else if (Array.isArray(value)) {
    obj[keyPath[lastKeyIndex]] = [...obj[keyPath[lastKeyIndex]], ...value];
  }
  // If the value is false bool then set to false. This special case is needed as {...false} = {} which causes issues.
  else if (value === false) {
    obj[keyPath[lastKeyIndex]] = false;
  }
  // If the object at the deep path is an object then append object wise.
  else {
    obj[keyPath[lastKeyIndex]] = { ...obj[keyPath[lastKeyIndex]], ...value };
  }
}

// Refactor to be more generalized with N props
export function groupObjectCountsByThreeProps(
  objects: any[],
  primaryProp: string,
  secondaryProp: string,
  tertiaryProp: string
): any {
  return objects.reduce((result, obj) => {
    result[obj[primaryProp]] = result[obj[primaryProp]] ?? {};
    result[obj[primaryProp]][obj[secondaryProp]] = result[obj[primaryProp]][obj[secondaryProp]] ?? {};
    const existingCount = result[obj[primaryProp]][obj[secondaryProp]][obj[tertiaryProp]];
    result[obj[primaryProp]][obj[secondaryProp]][obj[tertiaryProp]] =
      existingCount === undefined ? 1 : existingCount + 1;
    return result;
  }, {});
}
export function groupObjectCountsByTwoProps(
  objects: any[],
  primaryProp: string,
  getSecondaryProp: (obj: any) => string
): any {
  return objects.reduce((result, obj) => {
    result[obj[primaryProp]] = result[obj[primaryProp]] ?? {};
    const existingCount = result[obj[primaryProp]][getSecondaryProp(obj)];
    result[obj[primaryProp]][getSecondaryProp(obj)] = existingCount === undefined ? 1 : existingCount + 1;
    return result;
  }, {});
}

export function groupObjectCountsByProp(objects: any[], getProp: (obj: any) => string): any {
  return objects.reduce((result, obj) => {
    const existingCount = result[getProp(obj)];
    result[getProp(obj)] = existingCount === undefined ? 1 : existingCount + 1;
    return result;
  }, {});
}

/**
 * Filter out falsy keys from an object. Falsy keys are keys with values of false, null, undefined, 0, or empty string.
 * @param obj The object to filter
 * @returns A new object with falsy keys removed
 */
export function filterFalsyKeys(obj: Record<string | number, unknown>): Record<string | number, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v));
}

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
  return lodash.isEqual(filteredA, filteredB);
}

export function compareArrayResultsWithIgnoredKeys(ignoredKeys: string[], objA: unknown[], objB: unknown[]): boolean {
  // Remove ignored keys from each element of copied arrays.
  const filteredA = objA?.map((obj) => deleteIgnoredKeys(ignoredKeys, obj as Record<string, unknown>));
  const filteredB = objB?.map((obj) => deleteIgnoredKeys(ignoredKeys, obj as Record<string, unknown>));

  // Compare objects without the ignored keys.
  return isDefined(filteredA) && isDefined(filteredB) && lodash.isEqual(filteredA, filteredB);
}
