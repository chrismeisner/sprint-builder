import localFont from "next/font/local";

const gtAmerica = localFont({
  src: "../../fonts/GT-America-Condensed-Black.otf",
  variable: "--font-gt-america",
  display: "swap",
});

const gtAmericaCompressed = localFont({
  src: [
    {
      path: "../../fonts/GT-America-Compressed-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../fonts/GT-America-Compressed-Black.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-gt-america-compressed",
  display: "swap",
});

const akkuratLight = localFont({
  src: [
    {
      path: "../../fonts/AkkuratLightPro-Regular.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../fonts/AkkuratLightPro-Italic.otf",
      weight: "300",
      style: "italic",
    },
  ],
  variable: "--font-akkurat-light",
  display: "swap",
});

const generalGrotesqueMono = localFont({
  src: [
    {
      path: "../../fonts/GeneralGrotesqueMono-Thin.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../fonts/GeneralGrotesqueMono-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../fonts/GeneralGrotesqueMono-Book.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/GeneralGrotesqueMono-Regular.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../fonts/GeneralGrotesqueMono-Demi.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../fonts/GeneralGrotesqueMono-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../fonts/GeneralGrotesqueMono-ExtraBold.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../fonts/GeneralGrotesqueMono-Heavy.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-general-grotesque-mono",
  display: "swap",
});

const styleguidefonts = `${gtAmerica.variable} ${gtAmericaCompressed.variable} ${akkuratLight.variable} ${generalGrotesqueMono.variable}`;

export default function StyleGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styleguidefonts}>{children}</div>;
}
