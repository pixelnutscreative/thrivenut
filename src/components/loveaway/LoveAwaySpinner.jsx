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
    // Weighted random selection
    const pool = buildEntryPool();
    if (pool.length === 0) return;

    setSpinning(true);
    
    // Determine winner instantly (but show animation)
    const randomIndex = Math.floor(Math.random() * pool.length);
    const winningEntry = pool[randomIndex];
    
    // Calculate rotation to land on the winner
    // We need to find the segment corresponding to the winner
    // Since segments are mapped from entries, let's find the winning entry's index in entries array
    // Wait, multiple entries might be same person. But `pool` has replicates.
    // The visual wheel uses `segments` which is unique entries.
    // We need to pick a winner based on weight, then spin to THAT person's segment.
    
    const winnerSegmentIndex = entries.findIndex(e => e.id === winningEntry.id);
    if (winnerSegmentIndex === -1) return; // Should not happen

    const segmentCount = entries.length;
    const segmentAngle = 360 / segmentCount;
    
    // Calculate angle to land on this segment
    // Segment 0 is at 0 degrees (top? right?)
    // Usually 0 is right (3 o'clock) in CSS rotate, but depends on setup.
    // Let's assume standard CSS rotation. 
    // Target angle = -(index * segmentAngle + segmentAngle/2)
    // Add multiple full rotations (e.g. 10 rounds = 3600)
    // Add random jitter within the segment
    
    const spinRotations = 10 + Math.random() * 5; // 10-15 rotations
    const targetAngle = (winnerSegmentIndex * segmentAngle) + (segmentAngle / 2);
    // Adjust for the pointer being at top (270deg or -90deg) vs 0 (right)
    // If pointer is top, we need to rotate so target is at top.
    
    // Let's just do a big spin and force result
    // Actually user said "it has to go round and round and the person cannot stop it"
    // "it's got to be completely random"
    
    const finalRotation = 3600 + (360 - targetAngle) + 90; // +90 to align with top pointer if 0 is right?
    // Let's simplfy: Just spin a lot random amount, calculate winner based on where it lands?
    // NO, weighted probability is harder to visualize if segments are equal size.
    // If I show equal segments but use weighted probability, visual doesn't match physics.
    // IF I want visual to match: segments should be sized by weight.
    
    // Let's resize segments based on weight!
    
    // But for now, let's keep logic simple: 
    // 1. Determine winner by weight (done)
    // 2. Spin to that winner's segment
    
    const spinDuration = 8000; // 8 seconds
    const extraSpins = 360 * 10;
    // Calculate angle to land on winner
    // Winner index i. Center of wedge is i*wedge + wedge/2.
    // We want this angle to be at 270 deg (top) or whatever pointer is.
    // If pointer is top (270 deg), we need to rotate: 270 - center_angle.
    // And add full spins.
    
    // Visual logic handled in rendering
    
    // New logic with sized segments:
    const totalWeight = entries.reduce((sum, e) => sum + (e.final_entry_count || 1), 0);
    let currentAngle = 0;
    let winnerStartAngle = 0;
    let winnerEndAngle = 0;
    
    entries.forEach(e => {
        const weight = e.final_entry_count || 1;
        const angle = (weight / totalWeight) * 360;
        if (e.id === winningEntry.id) {
            winnerStartAngle = currentAngle;
            winnerEndAngle = currentAngle + angle;
        }
        currentAngle += angle;
    });
    
    const winnerCenter = (winnerStartAngle + winnerEndAngle) / 2;
    // We want winnerCenter to end up at -90 (top)
    const stopAngle = 360 * 10 + (360 - winnerCenter) - 90; 
    
    setRotation(stopAngle);

    setTimeout(() => {
      setWinner(winningEntry);
      setSpinning(false);
      selectWinnerMutation.mutate(winningEntry);
    }, spinDuration);
  };

  // Build weighted segments - MEMOIZED to prevent flickering colors
  const segments = React.useMemo(() => {
    const totalWeight = entries.reduce((sum, e) => sum + (e.final_entry_count || 1), 0);
    let currentAngle = 0;
    
    return entries.map(entry => {
        const weight = entry.final_entry_count || 1;
        const angleSize = (weight / totalWeight) * 360;
        const start = currentAngle;
        currentAngle += angleSize;
        
        // Use a consistent random color based on username if missing
        const consistentRandomColor = () => {
            let hash = 0;
            const str = entry.username || 'unknown';
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            const hue = Math.abs(hash % 360);
            return `hsl(${hue}, 70%, 60%)`;
        };

        return {
        ...entry,
        color: entry.favorite_color || consistentRandomColor(),
        startAngle: start,
        angleSize: angleSize
        };
    });
  }, [entries]);

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
                // Using conic-gradient for variable sized segments is easier than clip-path
                return (
                  <div
                    key={segment.id}
                    className="absolute inset-0"
                    style={{
                      background: `conic-gradient(${segment.color} ${segment.startAngle}deg, ${segment.color} ${segment.startAngle + segment.angleSize}deg, transparent 0)`,
                      borderRadius: '50%'
                    }}
                  >
                    {/* Label */}
                    <div 
                      className="absolute w-full h-full flex items-start justify-center pt-4"
                      style={{
                        transform: `rotate(${segment.startAngle + segment.angleSize / 2}deg)`
                      }}
                    >
                      <div className="text-white font-bold text-xs" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        {segment.username}
                        {segment.final_entry_count > 1 && ` (x${segment.final_entry_count})`}
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