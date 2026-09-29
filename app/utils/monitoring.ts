/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Console-only logging.
 *
 * Upstream also forwards every call to Sentry/GlitchTip. This fork runs as a
 * pure SPA + Electron client with no telemetry backend, so the reporting half
 * is dropped and only the console output is kept. The call signatures are
 * unchanged so callers do not need to know about the difference.
 */

interface LogDetails {
  error?: unknown;
  extra?: Record<string, unknown>;
}

export function logError(message: string, details?: LogDetails) {
  console.error(message, ...toConsoleArgs(details));
}

export function logWarning(message: string, details?: LogDetails) {
  console.warn(message, ...toConsoleArgs(details));
}

function toConsoleArgs({ error, extra }: LogDetails = {}) {
  return [
    ...(extra !== undefined ? [extra] : []),
    ...(error !== undefined ? [error] : [])
  ];
}
