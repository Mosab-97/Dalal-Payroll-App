'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Users, 
  Calculator, 
  CreditCard, 
  Receipt, 
  FileText, 
  BarChart3,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Employees', href: '/employees', icon: Users },
  { name: 'Payroll', href: '/payroll', icon: Calculator },
  { name: 'Advances', href: '/advances', icon: CreditCard },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Statements', href: '/statements', icon: FileText },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 bg-tesla-charcoal text-tesla-white h-screen fixed left-0 top-0 z-40 flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Building2 className="h-8 w-8 text-tesla-emerald" />
          <span className="text-2xl font-light tracking-tight">Dalal</span>
        </div>
        <p className="text-sm text-tesla-white/60 mt-1 font-light">
          Financial Console
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start px-4 py-3 h-auto rounded-xl font-medium transition-all duration-200",
                  isActive
                    ? "bg-tesla-emerald text-white shadow-lg"
                    : "text-tesla-white/70 hover:text-tesla-white hover:bg-white/5"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}