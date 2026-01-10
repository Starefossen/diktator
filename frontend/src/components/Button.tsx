"use client";

import Link from "next/link";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

export type ButtonVariant =
  | "primary-child"
  | "secondary-child"
  | "primary"
  | "secondary"
  | "success"
  | "practice"
  | "danger";

type ButtonBaseProps = {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
};

type ButtonAsButton = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof ButtonBaseProps> & {
    as?: "button";
    href?: never;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof ButtonBaseProps> & {
    as: "link";
    href: string;
  };

type ButtonAsAnchor = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof ButtonBaseProps> & {
    as: "a";
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

const variantClasses: Record<ButtonVariant, string> = {
  "primary-child": "btn-primary-child",
  "secondary-child": "btn-secondary-child",
  primary: "btn-primary",
  secondary: "btn-secondary",
  success: "btn-success",
  practice: "btn-practice",
  danger: "btn-danger",
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
    "p-",
    "pt-",
    "pr-",
    "pb-",
    "pl-",
    "px-",
    "py-",
    "flex",
    "inline-flex",
    "block",
    "inline-block",
    "inline",
    "hidden",
    "grid",
    "gap-",
    "space-",
    "justify-",
    "items-",
    "self-",
    "order-",
    "col-",
    "row-",
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
    "overflow-",
    "text-center",
    "text-left",
    "text-right",
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

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(props, ref) {
  const {
    variant = "primary",
    loading = false,
    className,
    children,
    as = "button",
    ...rest
  } = props;

  const baseClass = variantClasses[variant];
  const layoutClass = filterLayoutClasses(className);
  const combinedClassName = [
    baseClass,
    layoutClass,
    loading ? "opacity-70 cursor-wait" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = loading ? (
    <>
      <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      {children}
    </>
  ) : (
    children
  );

  if (as === "link") {
    const { href, ...linkRest } = rest as Omit<
      ButtonAsLink,
      keyof ButtonBaseProps | "as"
    >;
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href!}
        className={combinedClassName}
        {...linkRest}
      >
        {content}
      </Link>
    );
  }

  if (as === "a") {
    const { href, ...anchorRest } = rest as Omit<
      ButtonAsAnchor,
      keyof ButtonBaseProps | "as"
    >;
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={combinedClassName}
        {...anchorRest}
      >
        {content}
      </a>
    );
  }

  const buttonRest = rest as Omit<ButtonAsButton, keyof ButtonBaseProps | "as">;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={buttonRest.type ?? "button"}
      className={combinedClassName}
      disabled={loading || buttonRest.disabled}
      {...buttonRest}
    >
      {content}
    </button>
  );
});

Button.displayName = "Button";
