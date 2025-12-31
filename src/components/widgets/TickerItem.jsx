import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2 } from 'lucide-react';

export default function TickerItem({ coin, currentPrice, userHolding, userValue, loading, onUpdateHolding, onRemove }) {
  const [open, setOpen] = useState(false);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onUpdateHolding(e.target.value);
      setOpen(false);
    }
  };

  return (
    <div 
        className="relative overflow-hidden rounded-xl border border-white/10 transition-all hover:scale-[1.02]"
        style={{ backgroundColor: coin.color || '#1e293b' }}
    >
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                <div className="font-bold text-lg">{coin.symbol}</div>
                {loading && <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />}
            </div>
            <div className="text-right">
                <div className="font-mono text-lg font-bold">
                    ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </div>
            </div>
        </div>
        
        <div className="flex justify-between items-end pt-2 border-t border-white/10">
            <div className="flex-1">
                <label className="text-[10px] text-white/60 uppercase font-semibold mb-1 block">My Holdings</label>
                <div className="flex items-center gap-2">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <button className="text-sm font-mono bg-black/20 hover:bg-black/40 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                {userHolding > 0 ? userHolding : 'Set Qty'}
                                <Pencil className="w-3 h-3 opacity-50" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 bg-slate-900 border-slate-700 text-white">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">My {coin.symbol} Amount</h4>
                                <Input 
                                    type="number" 
                                    defaultValue={userHolding}
                                    onKeyDown={handleKeyDown}
                                    className="h-8 bg-slate-800 border-slate-600 text-white"
                                    autoFocus
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-slate-400">Press Enter to save</p>
                            </div>
                        </PopoverContent>
                    </Popover>
                    {userValue > 0 && (
                        <span className="text-xs text-green-300 font-mono">
                            (${userValue.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                        </span>
                    )}
                </div>
            </div>
            
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={onRemove}
                className="h-6 w-6 text-white/40 hover:text-red-300 hover:bg-transparent"
            >
                <Trash2 className="w-3 h-3" />
            </Button>
        </div>
      </div>
    </div>
  );
}