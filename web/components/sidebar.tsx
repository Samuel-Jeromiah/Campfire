"use client";

/*
  This is a client component because it needs to know which page the user
  is currently on (usePathname hook), so it can highlight the active nav link.
*/

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ShieldCheck, Flame, Lightbulb } from "lucide-react";

/*
  The list of navigation links shown in the sidebar.
  Each entry has a URL path, a display label, and an icon.
*/
const navItems = [
  { href: "/",           label: "Overview",            icon: BarChart3   },
  { href: "/portfolio",  label: "Portfolio Insights",  icon: ShieldCheck },
  { href: "/recommend",  label: "Recommend a Channel", icon: Lightbulb   },
];

export default function Sidebar() {
  /* usePathname gives us the current URL so we can mark the active link */
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">

      {/* Brand header at the top of the sidebar */}
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">

          {/* Flame icon with the campfire orange gradient */}
          <div className="w-8 h-8 rounded-lg gradient-campfire flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-white" />
          </div>

          <div>
            <div className="font-semibold text-sm text-sidebar-foreground tracking-tight leading-tight">
              Campfire
            </div>
            <div className="text-xs text-sidebar-foreground/50 tracking-wider uppercase leading-tight mt-0.5">
              Intelligence Platform
            </div>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">

        {/* Section label above the links */}
        <div className="px-3 mb-3 text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40">
          Navigation
        </div>

        {navItems.map(({ href, label, icon: Icon }) => {
          /*
            A link is "active" if the current URL matches its href exactly.
            Active links get a highlighted background and orange text.
            Inactive links are gray and turn white on hover.
          */
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/25"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer at the bottom of the sidebar showing dataset info */}
      <div className="px-6 pt-4 pb-16 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/60 font-medium">
          1,634 clean rows
        </div>
        <div className="text-xs text-sidebar-foreground/40 mt-1">
          3 anonymized clients
        </div>
      </div>
    </aside>
  );
}

