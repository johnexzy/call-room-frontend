"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#testimonials", label: "Testimonials" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] bg-black/95 border-white/10">
        <nav className="flex flex-col space-y-4 mt-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-lg text-gray-300 hover:text-white transition-colors"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex flex-col space-y-4 mt-4">
            <Link href="/login">
              <Button variant="ghost" className="w-full text-white">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button className="w-full bg-white text-black hover:bg-gray-100">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
} 