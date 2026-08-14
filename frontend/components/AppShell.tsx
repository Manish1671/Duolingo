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
      <div className="flex min-h-screen justify-center bg-[var(--bg)]">
        <div className="flex w-full max-w-[1440px]">
          <Sidebar />
          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pt-5 pb-24 md:pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-10">
              <div className="min-w-0">
                <div className="lg:hidden mb-4">
                  <TopBar />
                </div>
                {children}
              </div>
              <RightRail />
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    </StatsProvider>
  );
}
