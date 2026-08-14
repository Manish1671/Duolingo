import type { Metadata } from "next";
import Script from "next/script";
import { Nunito } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Duolingo — Learn Spanish",
  description: "A Duolingo-style language learning web app clone.",
};

const themeBoot = `(function(){try{var p=JSON.parse(localStorage.getItem("duo-prefs")||"{}");var t=p.theme||"system";var dark=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-[var(--bg)] text-[var(--text)]">
        <Script id="duo-theme-boot" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
