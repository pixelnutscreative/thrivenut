import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SupplementChecklistItem({ supplement, isTaken, onLog }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
        isTaken
          ? 'bg-green-50 border-green-300'
          : 'bg-white border-gray-200 hover:border-purple-300'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        {isTaken ? (
          <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
        ) : (
          <Circle className="w-6 h-6 text-gray-400 flex-shrink-0" />
        )}
        <div>
          <h4 className="font-semibold">{supplement.name}</h4>
          <p className="text-sm text-gray-600">{supplement.dosage}</p>
        </div>
      </div>
      {!isTaken && (
        <Button
          onClick={onLog}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
        >
          Mark Taken
        </Button>
      )}
      {isTaken && (
        <span className="text-sm text-green-600 font-medium">✓ Taken</span>
      )}
    </motion.div>
  );
}