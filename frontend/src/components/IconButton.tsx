"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

export type IconButtonVariant = "default" | "primary" | "danger";

type IconButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  variant?: IconButtonVariant;
  children: ReactNode;
  "aria-label": string;
};

const variantClasses: Record<IconButtonVariant, string> = {
  default: "btn-icon",
  primary: "btn-icon-primary",
  danger: "btn-icon-danger",
};

function isLayoutClass(className: string): boolean {
  const layoutPrefixes = [
    "w-",
    "h-",
    "min-w-",
    "max-w-",
    "min-h-",
    "max-h-",
    "m-",
    "mt-",
    "mr-",
    "mb-",
    "ml-",
    "mx-",
    "my-",
    "absolute",
    "relative",
    "fixed",
    "sticky",
    "static",
    "top-",
    "right-",
    "bottom-",
    "left-",
    "inset-",
    "z-",
  ];
  return layoutPrefixes.some(
    (prefix) =>
      className === prefix.replace("-", "") || className.startsWith(prefix),
  );
}

function filterLayoutClasses(className?: string): string {
  if (!className) return "";
  return className
    .split(" ")
    .filter((cls) => isLayoutClass(cls))
    .join(" ");
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { variant = "default", className, children, ...rest },
    ref,
  ) {
    const baseClass = variantClasses[variant];
    const layoutClass = filterLayoutClasses(className);
    const combinedClassName = [baseClass, layoutClass]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={rest.type ?? "button"}
        className={combinedClassName}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
