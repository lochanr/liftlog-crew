"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Dumbbell,
  Weight,
  Ruler,
  CalendarDays,
  Users,
  UserCircle,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/workouts", icon: Dumbbell, label: "Workouts" },
  { href: "/weight", icon: Weight, label: "Weight" },
  { href: "/measurements", icon: Ruler, label: "Body" },
  { href: "/attendance", icon: CalendarDays, label: "Attendance" },
  { href: "/friends", icon: Users, label: "Crew" },
  { href: "/profile", icon: UserCircle, label: "Profile" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 md:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                pathname === item.href
                  ? "text-emerald-400"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop Side Nav */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-zinc-900 border-r border-zinc-800 flex-col p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            LiftLog Crew
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Track. Progress. Dominate.</p>
        </div>
        
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                pathname === item.href
                  ? "bg-emerald-500/10 text-emerald-400 font-medium"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      
      <div className="hidden md:block md:ml-64" />
    </>
  );
}
