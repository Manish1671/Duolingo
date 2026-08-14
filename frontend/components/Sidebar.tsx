"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useStats } from "./StatsProvider";

const ITEMS = [
  { href: "/", label: "Learn", icon: HomeIcon, color: "#FFC800" },
  { href: "/sounds", label: "Sounds", icon: MouthIcon, color: "#FF4B8B" },
  { href: "/leaderboard", label: "Leaderboards", icon: ShieldIcon, color: "#FFC800" },
  { href: "/quests", label: "Quests", icon: ChestIcon, color: "#FFC800" },
  { href: "/shop", label: "Shop", icon: ShopIcon, color: "#FF4B4B" },
  { href: "/profile", label: "Profile", icon: HomeIcon, color: "#CE82FF" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const { me } = useStats();

  return (
    <aside className="hidden md:flex w-[256px] shrink-0 border-r-2 border-[var(--border)] min-h-screen sticky top-0 flex-col px-4 py-6 gap-1">
      <Link href="/" className="px-3 pb-7 pt-1">
        <span className="text-[32px] font-extrabold tracking-[-0.04em] text-[#58cc02] lowercase leading-none">
          duolingo
        </span>
      </Link>
      {ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3.5 rounded-[16px] px-3 py-3 font-extrabold uppercase text-[15px] tracking-wide border-2 ${
              active
                ? "border-[var(--nav-active-border)] bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]"
                : "text-[var(--nav-text)] border-transparent hover:bg-[var(--nav-hover)]"
            }`}
          >
            {item.href === "/profile" ? (
              <ProfileAvatar
                letter={me?.displayName?.[0] || "M"}
                color={me?.avatarColor || "#58CC02"}
              />
            ) : (
              <item.icon active={active} color={item.color} />
            )}
            {item.label}
          </Link>
        );
      })}
      <div className="relative mt-0.5">
        <button
          onClick={() => setMore((v) => !v)}
          className="w-full flex items-center gap-3.5 rounded-[16px] px-3 py-3 font-extrabold uppercase text-[15px] tracking-wide text-[var(--nav-text)] border-2 border-transparent hover:bg-[var(--nav-hover)]"
        >
          <MoreIcon />
          More
        </button>
        {more && (
          <div className="absolute left-0 right-0 top-full mt-1 rounded-2xl border-2 border-[var(--border)] bg-[var(--modal-bg)] p-2 z-20">
            <Link
              href="/settings"
              className="block px-3 py-2 rounded-xl font-extrabold uppercase text-sm hover:bg-[var(--nav-hover)]"
              onClick={() => setMore(false)}
            >
              Settings
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { me } = useStats();
  const mobileItems = [
    { href: "/", label: "Learn", icon: "home" as const },
    { href: "/leaderboard", label: "Leagues", icon: "shield" as const },
    { href: "/profile", label: "Profile", icon: "profile" as const },
    { href: "/shop", label: "Shop", icon: "shop" as const },
    { href: "/settings", label: "Settings", icon: "more" as const },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[var(--bg)] border-t-2 border-[var(--border)] flex justify-around py-2 z-30">
      {mobileItems.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-2">
            {item.icon === "home" ? (
              <HomeIcon active={active} color="#FFC800" />
            ) : item.icon === "shield" ? (
              <ShieldIcon active={active} color="#FFC800" />
            ) : item.icon === "profile" ? (
              <ProfileAvatar
                letter={me?.displayName?.[0] || "M"}
                color={me?.avatarColor || "#58CC02"}
              />
            ) : item.icon === "shop" ? (
              <ShopIcon active={active} color="#FF4B4B" />
            ) : (
              <MoreIcon />
            )}
            <span
              className={`text-[9px] font-extrabold uppercase ${
                active ? "text-[var(--nav-active-text)]" : "text-[var(--hare)]"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function ProfileAvatar({ letter, color }: { letter: string; color: string }) {
  return (
    <span
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-extrabold border-2 border-white/40"
      style={{ background: color }}
    >
      {letter.toUpperCase()}
    </span>
  );
}

function HomeIcon({ active, color }: { active: boolean; color: string }) {
  const fill = active ? "#FFC800" : color;
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
      <path d="M4 14.5 16 4l12 10.5V28H19v-8h-6v8H4V14.5z" fill={fill} />
      <circle cx="16" cy="16.5" r="3.2" fill="#fff" />
      <rect x="14.4" y="19" width="3.2" height="3.2" rx="0.6" fill="#fff" />
    </svg>
  );
}

function MouthIcon(_props: { active?: boolean; color?: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
      <ellipse cx="16" cy="17" rx="13" ry="10" fill="#FF4B8B" />
      <path d="M5 15c3-6 19-6 22 0" fill="#FF8AB8" />
      <ellipse cx="16" cy="19" rx="9" ry="5.5" fill="#1a1a1a" />
      <ellipse cx="16" cy="21" rx="5.5" ry="3" fill="#E53935" />
    </svg>
  );
}

function ShieldIcon({ color }: { active: boolean; color: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
      <path d="M16 3 6 7.2v9.2c0 6.2 4.1 10.8 10 12.6 5.9-1.8 10-6.4 10-12.6V7.2L16 3z" fill={color} />
      <path d="M16 7.2 10 9.6v6.2c0 3.8 2.4 6.7 6 8 3.6-1.3 6-4.2 6-8V9.6L16 7.2z" fill="#FFE47A" />
    </svg>
  );
}

function ChestIcon({ color }: { active: boolean; color: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
      <rect x="4" y="12" width="24" height="14" rx="2" fill={color} />
      <path d="M5 8h22l3 4H2l3-4z" fill="#E5A100" />
      <rect x="14.2" y="12" width="3.6" height="14" fill="#E5A100" />
      <circle cx="16" cy="19" r="2.1" fill="#fff" />
    </svg>
  );
}

function ShopIcon({ color }: { active: boolean; color: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
      <path d="M4 12h24l-1.4 16H5.4L4 12z" fill={color} />
      <path d="M6 6h20l3 6H3l3-6z" fill="#EA2B2B" />
      <path d="M6 6h4l-1 6H3l3-6zm6 0h4l.2 6h-4.4L12 6zm6 0h4l3 6h-5.2L18 6z" fill="#FF8A80" />
      <rect x="12" y="18" width="8" height="10" fill="#fff" opacity="0.9" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#CE82FF" />
      <circle cx="8.5" cy="16" r="2.3" fill="#fff" />
      <circle cx="16" cy="16" r="2.3" fill="#fff" />
      <circle cx="23.5" cy="16" r="2.3" fill="#fff" />
    </svg>
  );
}
