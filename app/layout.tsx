import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { ThemeInitScript } from "@/components/theme-init-script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zoomlion | Waste Management Experts",
  description:
    "iWaste Solutions Inc. — smart and sustainable waste management solutions.",
  icons: {
    icon: "/zl.png",
    shortcut: "/zl.png",
    apple: "/zl.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      data-brand="blue"
      suppressHydrationWarning
    >
      <body className="h-full overflow-hidden bg-surface text-primary">
        <ThemeInitScript />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
