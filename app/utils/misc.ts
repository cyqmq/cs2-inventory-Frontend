/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Serialized loader data. React Router v8's built-in `SerializeFrom` collapses
 * plain interfaces to `undefined` unless they carry an index signature, so this
 * app keeps the simpler Remix-style definition it was built for.
 */
export type SerializeFrom<T extends (...args: never[]) => unknown> = Awaited<
  ReturnType<T>
>;

export function random<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function safeParseJson(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

export function has(str?: string) {
  return (str?.length ?? 0) > 0;
}

export function isOurHostname() {
  if (typeof window === "undefined") {
    return false;
  }
  return ["inventory.cstrike.app", "localhost"].includes(
    window.location.hostname
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function colorText(input: string) {
  return escapeHtml(input).replace(/{(\w+)}([^{}]*)/g, (_, color, text) => {
    return `<span style="color: ${color};">${text}</span>`;
  });
}

export function noop() {}

export function trim(value: string) {
  value = value.trim();
  return value.length > 0 ? value : undefined;
}

export function truncateCodePoints(value: string, maximum: number) {
  return [...value].slice(0, maximum).join("");
}

export function nonEmptyString(value: string | undefined) {
  return value !== undefined
    ? value.length > 0
      ? value
      : undefined
    : undefined;
}

export function hasKeys(obj: object) {
  return Object.keys(obj).length > 0;
}

export function toArrayIf<T>(value: T, condition: (value: T) => boolean) {
  return condition(value) ? [value] : [];
}

export function tryOrDefault<T, R = undefined>(
  getValue: () => T,
  defaultValue?: R
) {
  try {
    return getValue();
  } catch {
    return defaultValue;
  }
}
