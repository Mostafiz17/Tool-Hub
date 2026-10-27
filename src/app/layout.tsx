import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Footer, Header } from "@/components/ui";

export const metadata: Metadata = {
  title: { default: "ToolHub — Free Online Tools", template: "%s · ToolHub" },
  description: "Calculators, text tools, developer utilities, image tools and more — fast, free, and privacy-first. Most tools run 100% locally in your browser.",
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const themeInit = `try{var t=JSON.parse(localStorage.getItem('toolhub:theme')||'"system"');var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={dmSans.variable}>
      <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
      <body className="min-h-screen flex flex-col">
        <StoreProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-2 btn-primary btn-sm">Skip to content</a>
          <Header />
          <div id="main" className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
