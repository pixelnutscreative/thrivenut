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
        // Ensure weight is a number
        const weight = typeof e.final_entry_count === 'number' ? e.final_entry_count : 1;
        record.totalWeight += weight;
        record.ids.push(e.id);
        
        // Prefer the one with a color set
        if (e.favorite_color && (!record.favorite_color || record.favorite_color === '#000000')) {
            record.favorite_color = e.favorite_color;
        }
    });
    
    const uniqueEntries = Array.from(consolidated.values());
    // Ensure total weight is calculated correctly
    const totalWeight = uniqueEntries.reduce((sum, e) => sum + (e.totalWeight || 0), 0);
    
    // Sort to keep consistent order
    uniqueEntries.sort((a, b) => a.username.localeCompare(b.username));

    let currentAngle = 0;

    return uniqueEntries.map((entry, idx) => {
        // Safe division
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

  const handleSpin = () => {
    if (entries.length === 0) return;

    setSpinning(true);
    setWinner(null);
    
    // Weighted selection from segments
    const totalWeight = segments.reduce((sum, s) => sum + s.totalWeight, 0);
    let random = Math.random() * totalWeight;
    let winningSegment = segments[segments.length - 1];
    
    for (const segment of segments) {
        if (random < segment.totalWeight) {
            winningSegment = segment;
            break;
        }
        random -= segment.totalWeight;
    }

    if (mode === 'wheel') {
        // Wheel Logic
        const winnerStartAngle = winningSegment.startAngle;
        const winnerEndAngle = winningSegment.startAngle + winningSegment.angleSize;
        
        const winnerCenter = (winnerStartAngle + winnerEndAngle) / 2;
        const wedgeSize = winningSegment.angleSize;
        const jitter = (Math.random() * wedgeSize * 0.6) - (wedgeSize * 0.3); 
        
        const stopAngle = 360 * 8 + (360 - winnerCenter + jitter) - 90; 
        
        setRotation(stopAngle);
        setTimeout(() => finishSpin(winningSegment), 8000);
    } 
    else if (mode === 'fishbowl') {
        // Fish Bowl Logic
        let shuffles = 0;
        const shuffleInterval = setInterval(() => {
            setFishBowlWinnerIndex(Math.floor(Math.random() * segments.length));
            shuffles++;
            if (shuffles > 40) { 
                clearInterval(shuffleInterval);
                finishSpin(winningSegment);
            }
        }, 100);
    }
    else if (mode === 'vertical') {
        // Vertical Logic
        const itemHeight = 60; 
        const winnerIndex = segments.findIndex(e => e.username === winningSegment.username);
        const loops = 15;
        const finalOffset = (segments.length * itemHeight * loops) + (winnerIndex * itemHeight);
        setVerticalOffset(finalOffset);
        setTimeout(() => finishSpin(winningSegment), 6000);
    }
  };

  const finishSpin = (winningEntry) => {
    setWinner(winningEntry);
    setSpinning(false);
    selectWinnerMutation.mutate(winningEntry);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {giveaway.title} - Draw Winner
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Tabs defaultValue="wheel" onValueChange={setMode} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="wheel" disabled={spinning}><Disc className="w-4 h-4 mr-2" /> Classic Wheel</TabsTrigger>
              <TabsTrigger value="fishbowl" disabled={spinning}><Fish className="w-4 h-4 mr-2" /> Fish Bowl</TabsTrigger>
              <TabsTrigger value="vertical" disabled={spinning}><ArrowDownUp className="w-4 h-4 mr-2" /> Vertical Spin</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* MODE: CLASSIC WHEEL */}
          {mode === 'wheel' && (
            <div className="relative w-full max-w-md mx-auto aspect-square">
                {/* Pointer (Blue Pin with Star) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-5 z-20 pointer-events-none filter drop-shadow-xl">
                <div className="relative">
                    <div className="w-12 h-14 bg-blue-500 rounded-full rounded-br-none transform -rotate-45 flex items-center justify-center border-4 border-white shadow-lg">
                        <div className="transform rotate-45">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" stroke="none" className="w-5 h-5">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </div>
                    </div>
                </div>
                </div>

                {/* Wheel */}
                <motion.div
                className="w-full h-full rounded-full overflow-hidden shadow-2xl relative"
                animate={{ rotate: rotation }}
                transition={{
                    duration: 8,
                    ease: [0.15, 0, 0.15, 1] 
                }}
                >
                <div 
                    className="absolute inset-0 w-full h-full"
                    style={{
                        background: `conic-gradient(from 0deg, ${segments.map(s => `${s.color} ${s.startAngle}deg ${s.startAngle + s.angleSize}deg`).join(', ')})`,
                        borderRadius: '50%'
                    }}
                />

                {segments.map((segment) => (
                    <div 
                        key={segment.username}
                        className="absolute w-full h-full flex justify-center pt-4 left-0 top-0 pointer-events-none"
                        style={{
                            transform: `rotate(${segment.startAngle + segment.angleSize / 2}deg)`
                        }}
                    >
                        <div className="text-white font-bold text-xs transform -translate-y-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                            {segment.angleSize > 10 ? (
                                <span className="block transform rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                    {segment.username.substring(0, 15)}
                                </span>
                            ) : '.'}
                        </div>
                    </div>
                ))}
                </motion.div>

                {/* Center Button */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center z-20 pointer-events-auto">
                        <Button
                            onClick={handleSpin}
                            disabled={spinning || winner || entries.length === 0}
                            className="w-16 h-16 rounded-full shadow-inner text-sm font-bold p-0"
                            style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            }}
                        >
                            {spinning ? '...' : 'SPIN'}
                        </Button>
                    </div>
                </div>
            </div>
          )}

          {/* MODE: FISH BOWL */}
          {mode === 'fishbowl' && (
             <div className="relative w-full max-w-md mx-auto aspect-square bg-blue-50 rounded-full border-4 border-blue-200 overflow-hidden shadow-inner flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-100/50 backdrop-blur-sm z-0"></div>
                
                <AnimatePresence>
                    {!spinning && !winner && (
                        <div className="z-10 text-center">
                            <Fish className="w-16 h-16 text-blue-400 mx-auto mb-2" />
                            <Button onClick={handleSpin} className="bg-blue-500 hover:bg-blue-600">
                                Reach in Bowl
                            </Button>
                        </div>
                    )}
                </AnimatePresence>

                {spinning && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <motion.div
                            key={fishBowlWinnerIndex}
                            initial={{ scale: 0.5, opacity: 0, y: 50 }}
                            animate={{ scale: 1.2, opacity: 1, y: 0 }}
                            exit={{ scale: 0.5, opacity: 0, y: -50 }}
                            className="text-3xl font-bold text-blue-800"
                        >
                            {segments[fishBowlWinnerIndex]?.username}
                        </motion.div>
                    </div>
                )}
             </div>
          )}

          {/* MODE: VERTICAL SPIN */}
          {mode === 'vertical' && (
             <div className="relative w-full max-w-sm mx-auto h-80 bg-gray-100 rounded-xl border-4 border-gray-300 overflow-hidden shadow-inner">
                 <div className="absolute top-1/2 left-0 right-0 h-16 -mt-8 bg-yellow-400/30 border-y-2 border-yellow-500 z-10 pointer-events-none backdrop-blur-[1px]"></div>
                 <div className="absolute top-1/2 right-2 -mt-3 text-yellow-600 z-20 font-bold text-2xl">◄</div>
                 <div className="absolute top-1/2 left-2 -mt-3 text-yellow-600 z-20 font-bold text-2xl">►</div>

                 <div className="h-full overflow-hidden relative">
                    <motion.div
                        className="absolute w-full"
                        animate={{ y: -verticalOffset }}
                        transition={{ duration: 6, ease: [0.15, 0, 0.15, 1] }}
                        style={{ top: '50%', marginTop: '-30px' }} 
                    >
                        {[...Array(20)].map((_, i) => (
                            <div key={i}>
                                {segments.map((entry) => (
                                    <div 
                                        key={`${i}-${entry.username}`} 
                                        className="h-[60px] flex items-center justify-center text-lg font-bold border-b border-gray-200"
                                        style={{ backgroundColor: entry.color ? `${entry.color}20` : 'white' }}
                                    >
                                        <div 
                                            className="w-4 h-4 rounded-full mr-2" 
                                            style={{ backgroundColor: entry.color }}
                                        />
                                        {entry.username}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </motion.div>
                 </div>

                 {!spinning && !winner && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                        <Button onClick={handleSpin} className="w-full mx-4 shadow-lg bg-green-600 hover:bg-green-700">
                            SPIN THE REEL
                        </Button>
                    </div>
                 )}
             </div>
          )}

          {/* Entry Stats */}
          <div className="mt-8 flex items-center justify-center gap-12 text-center">
            <div>
              <p className="text-3xl font-bold text-purple-600">{segments.length}</p>
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
                    {winner.totalWeight} {winner.totalWeight === 1 ? 'entry' : 'entries'}
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