import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Sparkles, X, Fish, ArrowDownUp, Disc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoveAwaySpinner({ giveaway, onClose }) {
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [verticalOffset, setVerticalOffset] = useState(0);
  const [winner, setWinner] = useState(null);
  const [mode, setMode] = useState('wheel'); // wheel, fishbowl, vertical
  const [fishBowlWinnerIndex, setFishBowlWinnerIndex] = useState(null);

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
    setWinner(null);
    
    const randomIndex = Math.floor(Math.random() * pool.length);
    const winningEntry = pool[randomIndex];

    if (mode === 'wheel') {
        // Wheel Logic - Match consolidated segments
        const consolidated = new Map();
        entries.forEach(e => {
            const username = e.username || 'Unknown';
            if (!consolidated.has(username)) {
                consolidated.set(username, { ...e, username, totalWeight: 0 });
            }
            consolidated.get(username).totalWeight += (e.final_entry_count || 1);
        });
        
        const uniqueEntries = Array.from(consolidated.values());
        const totalWeight = uniqueEntries.reduce((sum, e) => sum + e.totalWeight, 0);

        // Find the segment that corresponds to the winner
        let currentAngle = 0;
        let winnerStartAngle = 0;
        let winnerEndAngle = 0;
        
        for (const entry of uniqueEntries) {
            const angleSize = (entry.totalWeight / totalWeight) * 360;
            if (entry.username === winningEntry.username) {
                winnerStartAngle = currentAngle;
                winnerEndAngle = currentAngle + angleSize;
                break;
            }
            currentAngle += angleSize;
        }
        
        const winnerCenter = (winnerStartAngle + winnerEndAngle) / 2;
        const wedgeSize = winnerEndAngle - winnerStartAngle;
        const jitter = (Math.random() * wedgeSize * 0.6) - (wedgeSize * 0.3); 
        
        const stopAngle = 360 * 8 + (360 - winnerCenter + jitter) - 90; 
        
        setRotation(stopAngle);
        setTimeout(() => finishSpin(winningEntry), 8000);
    } 
    else if (mode === 'fishbowl') {
        // Fish Bowl Logic - Shuffle animation
        let shuffles = 0;
        const shuffleInterval = setInterval(() => {
            setFishBowlWinnerIndex(Math.floor(Math.random() * entries.length));
            shuffles++;
            if (shuffles > 40) { // Stop after ~4 seconds
                clearInterval(shuffleInterval);
                finishSpin(winningEntry);
            }
        }, 100);
    }
    else if (mode === 'vertical') {
        // Vertical Wheel Logic (Price is Right style)
        // Just scroll very far down to the winner
        // We'll duplicate the list many times
        const itemHeight = 60; 
        const winnerIndex = entries.findIndex(e => e.id === winningEntry.id);
        const loops = 15;
        // Target offset
        const finalOffset = (entries.length * itemHeight * loops) + (winnerIndex * itemHeight);
        setVerticalOffset(finalOffset);
        setTimeout(() => finishSpin(winningEntry), 6000);
    }
  };

  const finishSpin = (winningEntry) => {
    setWinner(winningEntry);
    setSpinning(false);
    selectWinnerMutation.mutate(winningEntry);
  };

  // FUN & VIBRANT PALETTE
  const vibrantColors = [
      '#FF0055', '#00CCFF', '#CCFF00', '#FF00CC', '#00FF66', 
      '#FF6600', '#6600FF', '#00FFCC', '#FFCC00', '#CC00FF',
      '#FF3366', '#33CCFF', '#CCFF33', '#FF33CC', '#33FF66'
  ];

  // Build weighted segments - MEMOIZED
  const segments = React.useMemo(() => {
    // 1. Consolidate entries by username using Map to avoid key collisions
    const consolidated = new Map();
    
    entries.forEach(e => {
        const username = e.username || 'Unknown';
        if (!consolidated.has(username)) {
            consolidated.set(username, { 
                ...e, 
                username, // Ensure username is explicit
                totalWeight: 0, 
                ids: [] 
            });
        }
        const record = consolidated.get(username);
        record.totalWeight += (e.final_entry_count || 1);
        record.ids.push(e.id);
        
        // Prefer the one with a color set
        if (e.favorite_color && (!record.favorite_color || record.favorite_color === '#000000')) {
            record.favorite_color = e.favorite_color;
        }
    });
    
    const uniqueEntries = Array.from(consolidated.values());
    const totalWeight = uniqueEntries.reduce((sum, e) => sum + e.totalWeight, 0);
    let currentAngle = 0;
    
    return uniqueEntries.map((entry, idx) => {
        const angleSize = totalWeight > 0 ? (entry.totalWeight / totalWeight) * 360 : 0;
        const start = currentAngle;
        currentAngle += angleSize;
        
        // Use vibrant palette cyclically if no favorite color
        const paletteIndex = idx % vibrantColors.length;
        const vibrantColor = vibrantColors[paletteIndex];
        
        // Ensure color is valid
        const finalColor = (entry.favorite_color && entry.favorite_color !== '#000000') ? entry.favorite_color : vibrantColor;

        return {
            ...entry,
            color: finalColor,
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
               {/* Single Conic Gradient Background for better rendering */}
               <div 
                  className="absolute inset-0 w-full h-full"
                  style={{
                    background: `conic-gradient(from 0deg, ${segments.map(s => `${s.color} ${s.startAngle}deg ${s.startAngle + s.angleSize}deg`).join(', ')})`
                  }}
               />

               {/* Labels Layer */}
              {segments.map((segment) => (
                <div 
                    key={segment.username}
                    className="absolute inset-0 w-full h-full"
                >
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
              ))}
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
          <div className="mt-8 flex items-center justify-center gap-12 text-center">
            <div>
              <p className="text-3xl font-bold text-purple-600">{new Set(entries.map(e => e.username)).size}</p>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Unique People</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {entries.reduce((sum, e) => sum + (e.final_entry_count || 1), 0)}
              </p>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Total Entries</p>
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