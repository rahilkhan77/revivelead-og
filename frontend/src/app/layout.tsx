import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { isClerkEnabled } from "@/lib/auth/clerk";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeScript = `(function(){try{var stored=localStorage.getItem("theme");var preferDark=window.matchMedia("(prefers-color-scheme: dark)").matches;var dark=stored==="dark"||((stored==="system"||stored==null)&&preferDark);document.documentElement.classList.toggle("dark",dark);document.documentElement.style.colorScheme=dark?"dark":"light"}catch(e){}})();`;

export const metadata: Metadata = {
  title: {
    default: "ReviveLead — Turn Lost Real Estate Leads Into Revenue",
    template: "%s · ReviveLead",
  },
  description:
    "ReviveLead uses AI to qualify leads, automate follow-ups and reactivate dormant prospects for real estate agencies in Dubai, Qatar, Mumbai and Bangalore.",
  icons: {
    icon: "/brand/favicon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Script id="revivelead-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <Providers clerkEnabled={isClerkEnabled()}>{children}</Providers>
      </body>
    </html>
  );
}
