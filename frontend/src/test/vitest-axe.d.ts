/// <reference types="vitest" />

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> {
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toHaveNoViolations(): any;
  }
}
