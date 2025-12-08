import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function LoveAwaySpinner({ giveaway, onClose }) {
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);

  const { data: entries = [] } = useQuery({
    queryKey: ['loveawayEntries', giveaway.id],
    queryFn: () => base44.entities.LoveAwayEntry.filter({ loveaway_id: giveaway.id }),
  });

  const selectWinnerMutation = useMutation({
    mutationFn: async (winningEntry) => {
      return base44.entities.LoveAway.update(giveaway.id, {
        winner_contact_id: winningEntry.contact_id,
        winner_username: winningEntry.username,
        status: 'winner_selected',
        drawn_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loveAways'] });
      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  });

  // Build weighted entry pool
  const buildEntryPool = () => {
    const pool = [];
    entries.forEach(entry => {
      const entryCount = entry.final_entry_count || 1;
      for (let i = 0; i < entryCount; i++) {
        pool.push(entry);
      }
    });
    return pool;
  };

  const handleSpin = () => {
    const pool = buildEntryPool();
    if (pool.length === 0) return;

    setSpinning(true);
    const spinDuration = 5000; // 5 seconds
    const spinRotations = 5 + Math.random() * 3; // 5-8 full rotations
    const finalRotation = spinRotations * 360;

    setRotation(finalRotation);

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const winningEntry = pool[randomIndex];
      setWinner(winningEntry);
      setSpinning(false);
      selectWinnerMutation.mutate(winningEntry);
    }, spinDuration);
  };

  // Build segments from entries
  const segments = entries.map(entry => ({
    ...entry,
    color: entry.favorite_color || `hsl(${Math.random() * 360}, 70%, 60%)`
  }));

  const segmentAngle = 360 / Math.max(segments.length, 1);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {giveaway.title} - Draw Winner
          </DialogTitle>
        </DialogHeader>

        <div className="py-8">
          {/* Spinner Wheel */}
          <div className="relative w-full max-w-md mx-auto aspect-square">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-500" />
            </div>

            {/* Wheel */}
            <motion.div
              className="w-full h-full rounded-full overflow-hidden shadow-2xl relative"
              animate={{ rotate: rotation }}
              transition={{
                duration: 5,
                ease: [0.17, 0.67, 0.3, 0.99]
              }}
              style={{ border: '8px solid #fff' }}
            >
              {segments.map((segment, index) => {
                const startAngle = index * segmentAngle;
                const endAngle = startAngle + segmentAngle;
                const midAngle = (startAngle + endAngle) / 2;

                return (
                  <div
                    key={segment.id}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `rotate(${startAngle}deg)`,
                      transformOrigin: 'center center'
                    }}
                  >
                    <div
                      className="absolute w-full h-full"
                      style={{
                        clipPath: `polygon(50% 50%, 50% 0%, 100% 0%)`,
                        background: segment.color,
                        transform: `rotate(${segmentAngle / 2}deg)`,
                        transformOrigin: '0% 50%'
                      }}
                    >
                      <div
                        className="absolute left-[60%] top-[10%] text-white font-bold text-sm"
                        style={{
                          transform: `rotate(${90 - segmentAngle / 2}deg)`
                        }}
                      >
                        {segment.username}
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Center Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={handleSpin}
                disabled={spinning || winner || entries.length === 0}
                className="w-24 h-24 rounded-full shadow-lg text-lg font-bold z-20"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                {spinning ? '...' : 'SPIN'}
              </Button>
            </div>
          </div>

          {/* Entry Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">{entries.length}</p>
              <p className="text-sm text-gray-500">Participants</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {entries.reduce((sum, e) => sum + (e.final_entry_count || 1), 0)}
              </p>
              <p className="text-sm text-gray-500">Total Entries</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {entries.filter(e => e.multipliers_applied?.length > 0).length}
              </p>
              <p className="text-sm text-gray-500">With Multipliers</p>
            </div>
          </div>

          {/* Winner Announcement */}
          <AnimatePresence>
            {winner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white text-center"
              >
                <Trophy className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">🎉 Winner! 🎉</h3>
                <p className="text-3xl font-bold mb-2">{winner.display_name || winner.username}</p>
                <p className="text-lg opacity-90">@{winner.username}</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {winner.final_entry_count} {winner.final_entry_count === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {entries.length === 0 && (
            <div className="mt-8 text-center text-gray-500">
              <p>No entries yet. Add participants to draw a winner.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}