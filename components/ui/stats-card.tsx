'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: LucideIcon;
  gradient?: string;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  gradient = 'from-tesla-emerald/20 to-tesla-emerald/5',
  className 
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="relative overflow-hidden border-tesla-gray/20 bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold text-tesla-charcoal">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {change && (
                <div className={cn(
                  "flex items-center text-xs font-medium",
                  change.type === 'increase' && "text-emerald-600",
                  change.type === 'decrease' && "text-red-600",
                  change.type === 'neutral' && "text-muted-foreground"
                )}>
                  {change.type === 'increase' && '↗'}
                  {change.type === 'decrease' && '↘'}
                  {change.type === 'neutral' && '→'}
                  <span className="ml-1">
                    {Math.abs(change.value)}% from last month
                  </span>
                </div>
              )}
            </div>
            <div className="p-3 bg-white/50 rounded-2xl">
              <Icon className="h-6 w-6 text-tesla-charcoal" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}