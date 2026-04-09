import type React from "react";
import { cn } from "@/lib/cn";

export function Hairline({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-hairline", className)} {...props} />;
}