import * as React from "react";
import { cn } from "./cn";

/**
 * Minimal Slot: renders its single child, merging the Slot's props into it.
 * Supports className merging and event handler chaining.
 * Used for the `asChild` pattern in Button, Badge, etc.
 */
export function Slot({
  children,
  ...slotProps
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  if (!React.isValidElement(children)) return <>{children}</>;

  const childProps = children.props as Record<string, unknown>;

  // Merge className
  const className = cn(
    slotProps.className as string | undefined,
    childProps.className as string | undefined
  ) || undefined;

  // Chain onClick handlers
  const onClick =
    slotProps.onClick || childProps.onClick
      ? (e: React.MouseEvent<HTMLElement>) => {
          (slotProps.onClick as React.MouseEventHandler<HTMLElement> | undefined)?.(e);
          (childProps.onClick as React.MouseEventHandler<HTMLElement> | undefined)?.(e);
        }
      : undefined;

  return React.cloneElement(children, {
    ...slotProps,
    ...childProps,
    ...(className !== undefined ? { className } : {}),
    ...(onClick !== undefined ? { onClick } : {}),
  } as React.HTMLAttributes<HTMLElement>);
}
