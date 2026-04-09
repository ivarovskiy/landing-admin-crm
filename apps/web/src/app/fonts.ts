import localFont from "next/font/local";

export const fontMaru = localFont({
  src: [
    { path: "../assets/fonts/GTMaruRegular.ttf", weight: "400", style: "normal" },
    { path: "../assets/fonts/GTMaruMedium.ttf", weight: "500", style: "normal" },
    { path: "../assets/fonts/GTMaruBold.ttf", weight: "700", style: "normal" },
    { path: "../assets/fonts/GTMaruBlack.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-maru",
  display: "swap",
});

export const fontMaruOblique = localFont({
  src: [
    { path: "../assets/fonts/GTMaruMediumOblique.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-maru-oblique",
  display: "swap",
});

export const fontDisplay = localFont({
  src: [
    { path: "../assets/fonts/GTMaruBlack.ttf", weight: "700", style: "normal" },
    { path: "../assets/fonts/GTMaruMedium.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});