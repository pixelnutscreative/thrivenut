import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import FinanceDashboard from '../components/finance/FinanceDashboard';
import { useTheme } from '../components/shared/useTheme';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

export default function Finance() {
  const [user, setUser] = useState(null);
  const { bgClass, textClass, subtextClass } = useTheme();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <DollarSign className="w-10 h-10 text-emerald-500" />
            Financial Tracker
          </h1>
          <p className={subtextClass}>Manage subscriptions, track expenses, and never miss a trial cancellation.</p>
        </motion.div>

        <FinanceDashboard userEmail={user?.email} />
      </div>
    </div>
  );
}