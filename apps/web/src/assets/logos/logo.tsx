import type { SVGProps } from "react";
import { cn } from "@/lib/cn";

import IbcBalletJunior from "@/assets/logos/ibc_junior_logo.svg";
import IbcBalletPre from "@/assets/logos/ibc_pre_logo.svg";
import SimplyDance from "@/assets/logos/sds_logo.svg";
import IbcLogoLarge from "@/assets/logos/ibc_logo_large.svg";
import SdsLogoLarge from "@/assets/logos/sds_logo_large.svg";

export type LogoName = "ibc-ballet-junior" | "ibc-ballet-pre" | "simply-dance" | "ibc-logo-large" | "sds-logo-large";

const LOGOS = {
  "ibc-ballet-junior": IbcBalletJunior,
  "ibc-ballet-pre": IbcBalletPre,
  "simply-dance": SimplyDance,
  "ibc-logo-large": IbcLogoLarge,
  "sds-logo-large": SdsLogoLarge,
} as const;

export type LogoSource =
  | { kind: "asset"; name: string }
  | { kind: "url"; src: string; alt?: string };

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isComponent(v: unknown): v is React.ComponentType<SVGProps<SVGSVGElement>> {
  return typeof v === "function";
}

export function Logo({
  logo,
  className,
  title,
}: {
  logo?: LogoSource;
  className?: string;
  title?: string;
}) {
  if (!logo) return null;

  if (logo.kind === "url") {
    return <img src={logo.src} alt={logo.alt ?? title ?? "Logo"} className={className} />;
  }

  const raw: any = (LOGOS as any)[logo.name];

  if (!raw) {
    return (
      <span className={cn("logo-fallback", className)}>
        Missing logo: <b>{String(logo.name)}</b>
      </span>
    );
  }

  const mod = raw?.default ?? raw;

  if (isComponent(mod)) {
    const Component = mod as React.ComponentType<SVGProps<SVGSVGElement>>;
    return <Component className={className} role="img" aria-label={title ?? "Logo"} />;
  }

  if (isString(mod)) {
    return <img src={mod} alt={title ?? "Logo"} className={className} />;
  }

  return (
    <span className={cn("logo-fallback", className)}>
      Invalid logo module: <b>{String(logo.name)}</b>
    </span>
  );
}
