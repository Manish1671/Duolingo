"use client";

import { usePathname } from "next/navigation";
import { BottomNav, Sidebar } from "./Sidebar";
import { StatsProvider } from "./StatsProvider";
import { RightRail } from "./RightRail";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lesson = pathname.startsWith("/lesson");

  if (lesson) {
    return <StatsProvider>{children}</StatsProvider>;
  }

  return (
    <StatsProvider>
      <div className="flex min-h-screen bg-[var(--bg)]">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="max-w-[1140px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,600px)_368px] gap-8 px-4 lg:px-10 pb-24 md:pb-12 pt-5">
            <div className="min-w-0">
              <div className="lg:hidden mb-4">
                <TopBar />
              </div>
              {children}
            </div>
            <RightRail />
          </div>
        </main>
        <BottomNav />
      </div>
    </StatsProvider>
  );
}
