/**
 * i18n utilities for message interpolation and variant selection
 */

export type MessageVariables = {
  name?: string;
  score?: number;
  count?: number;
  [key: string]: string | number | undefined;
};

type VariantSelectionStrategy = "random" | "first" | "last";

export interface VariantSelectionOptions {
  strategy?: VariantSelectionStrategy;
}

/**
 * Interpolates variables into a message template.
 * Replaces {variableName} with the corresponding value from vars.
 *
 * @example
 * interpolateMessage("Hello {name}!", { name: "World" }) // "Hello World!"
 * interpolateMessage("Score: {score}%", { score: 95 }) // "Score: 95%"
 */
export function interpolateMessage(
  template: string,
  vars: MessageVariables,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];
    if (value !== undefined) {
      return String(value);
    }
    return match;
  });
}

/**
 * Selects a variant from an array of messages or returns the message if it's a string.
 * Supports different selection strategies for future extensibility.
 *
 * @param messages - A single message string or array of message variants
 * @param options - Selection options (strategy defaults to 'random')
 * @returns The selected message string
 *
 * @example
 * selectVariant("Hello") // "Hello"
 * selectVariant(["Hi!", "Hello!", "Hey!"]) // Random selection
 * selectVariant(["Hi!", "Hello!"], { strategy: 'first' }) // "Hi!"
 */
export function selectVariant(
  messages: string | string[],
  options: VariantSelectionOptions = {},
): string {
  if (typeof messages === "string") {
    return messages;
  }

  if (messages.length === 0) {
    return "";
  }

  if (messages.length === 1) {
    return messages[0];
  }

  const { strategy = "random" } = options;

  switch (strategy) {
    case "first":
      return messages[0];
    case "last":
      return messages[messages.length - 1];
    case "random":
    default:
      return messages[Math.floor(Math.random() * messages.length)];
  }
}

/**
 * Combines variant selection and interpolation in one call.
 * Useful for getting a fully processed message ready for display.
 *
 * @example
 * processMessage(
 *   ["Hello {name}!", "Hi {name}!"],
 *   { name: "Alex" }
 * ) // "Hello Alex!" or "Hi Alex!"
 */
export function processMessage(
  messages: string | string[],
  vars: MessageVariables = {},
  options: VariantSelectionOptions = {},
): string {
  const selected = selectVariant(messages, options);
  return interpolateMessage(selected, vars);
}
