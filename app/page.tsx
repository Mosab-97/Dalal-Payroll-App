'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-tesla-white via-tesla-gray/20 to-tesla-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8"
      >
        {/* Logo and Brand */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-4"
        >
          <h1 className="text-7xl md:text-8xl font-light text-tesla-charcoal tracking-tight">
            Dalal
          </h1>
          <p className="text-xl text-muted-foreground font-light tracking-wide">
            Internal Financial Console
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Button 
            onClick={() => router.push('/dashboard')}
            size="lg"
            className="btn-primary text-lg px-8 py-4 rounded-2xl group hover:scale-105 transition-all duration-300"
          >
            Access Dalal
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </motion.div>

        {/* Subtle decoration */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="w-24 h-1 bg-gradient-to-r from-transparent via-tesla-emerald to-transparent mx-auto"
        />
      </motion.div>
    </div>
  );
}