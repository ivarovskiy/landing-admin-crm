import type React from "react";
import { cn } from "@/lib/cn";

export function IconButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("ds-icon-btn", className)} {...props} />;
}

export function PillLink({
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cn("ds-pill", className)} {...props} />;
}