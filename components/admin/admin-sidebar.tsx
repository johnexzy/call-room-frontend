"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  PhoneCall,
  BarChart3,
  Settings,
  List,
} from "lucide-react";

const menuItems = [
  {
    href: "/dashboard/admin",
    label: "Overview",
    icon: BarChart3,
  },
  {
    href: "/dashboard/admin/representatives",
    label: "Representatives",
    icon: Users,
  },
  {
    href: "/dashboard/admin/queue",
    label: "Queue Management",
    icon: List,
  },
  {
    href: "/dashboard/admin/calls",
    label: "Active Calls",
    icon: PhoneCall,
  },
  {
    href: "/dashboard/admin/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r min-h-[calc(100vh-64px)] p-4 space-y-4">
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
} 