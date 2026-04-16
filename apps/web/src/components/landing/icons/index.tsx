import type { SVGProps } from "react";

import Phone from "@/assets/icons/phone.svg";
import Mail from "@/assets/icons/email_mb.svg";
import MailDt from "@/assets/icons/email_dt.svg";
import Hamburger from "@/assets/icons/hamburger.svg";
import Instagram from "@/assets/icons/instagram.svg";
import Facebook from "@/assets/icons/facebook_dt.svg";
import Lock from "@/assets/icons/lock_closed_v1.svg";
import Unlock from "@/assets/icons/lock_opened_v2.svg";
import Expand from "@/assets/icons/expand_btn.svg";
import Collapse from "@/assets/icons/collapse_btn.svg";
import Point from "@/assets/icons/point.svg";
import SeeLess from "@/assets/icons/see_less.svg";
import Close from "@/assets/icons/x.svg";
import BalletBar from "@/assets/icons/ballet_bar.svg";
import BalletShoes from "@/assets/icons/ballet_shoes.svg";
import PrizeCup from "@/assets/icons/prize_cup.svg";
import Girl from "@/assets/icons/girl.svg";
import ParentPortal from "@/assets/buttons/parent-portal.svg";

export type IconName =
  | "phone"
  | "mail"
  | "mail-dt"
  | "instagram"
  | "facebook"
  | "lock"
  | "unlock"
  | "expand"
  | "collapse"
  | "point"
  | "see-less"
  | "hamburger"
  | "close"
  | "ballet-bar"
  | "ballet-shoes"
  | "prize-cup"
  | "parent-portal"
  | "girl";

const ICONS = {
  phone: Phone,
  mail: Mail,
  "mail-dt": MailDt,
  instagram: Instagram,
  facebook: Facebook,
  lock: Lock,
  unlock: Unlock,
  expand: Expand,
  collapse: Collapse,
  point: Point,
  "see-less": SeeLess,
  hamburger: Hamburger,
  close: Close,
  "ballet-bar": BalletBar,
  "ballet-shoes": BalletShoes,
  "prize-cup": PrizeCup,
  "parent-portal": ParentPortal,
  "girl": Girl
} satisfies Record<IconName, React.ComponentType<SVGProps<SVGSVGElement>>>;

export function Icon({
  name,
  className,
  ...props
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  const raw: any = ICONS[name];
  const Comp = raw?.default ?? raw;

  if (typeof Comp !== "function") {
    throw new Error(`Icon "${name}" is not a React component. Check SVGR/Turbopack config.`);
  }

  return <Comp className={className} {...props} />;
}