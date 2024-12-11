'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from "@/components/theme/theme-toggle";
import Cookies from 'js-cookie';
import { useAuth } from '@/hooks/use-auth';

export function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    router.push('/login');
  };

  const getNavItems = () => {
    const items = [
      { href: '/dashboard', label: 'Dashboard' },
    ];

    // Only show Call History to reps and admins
    if (user?.role === 'representative' || user?.role === 'admin') {
      items.push({ href: '/dashboard/calls', label: 'Call History' });
    }

    items.push({ href: '/dashboard/settings', label: 'Settings' });

    return items;
  };

  const navItems = getNavItems();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold">
              Callroom
            </Link>
            <div className="flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm transition-colors hover:text-primary',
                    pathname === item.href
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
} 