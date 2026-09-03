import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ToasterProvider } from "@/components/ToasterProvider";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nuckle = localFont({
  src: [
    {
      path: "./../../public/fonts/nuckle-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./../../public/fonts/nuckle-semi-bold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./../../public/fonts/nuckle-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-nuckle",
});

export const metadata: Metadata = {
  title: "Beyond Stays - PG Management Portal",
  description: "PG Occupancy Management and Referral Rewards Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${nuckle.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-nuckle">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ToasterProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
