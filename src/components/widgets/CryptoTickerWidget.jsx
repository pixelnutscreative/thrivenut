import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, TrendingUp, Coins, RefreshCw, Palette, DollarSign, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTheme } from '../shared/useTheme';

// Predefined palette colors
const colorPalette = [
  '#1e293b', // slate-800
  '#4f46e5', // indigo-600
  '#7c3aed', // violet-600
  '#db2777', // pink-600
  '#e11d48', // rose-600
  '#ea580c', // orange-600
  '#ca8a04', // amber-600
  '#16a34a', // green-600
  '#0d9488', // emerald-600
  '#0891b2', // teal-600
  '#0284c7', // cyan-600
  '#2563eb', // sky-600
];

export default function CryptoTickerWidget({ portfolio = [], onUpdatePortfolio }) {
  const { user, preferences } = useTheme();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCoin, setNewCoin] = useState({ symbol: '', amount: '', color: '#1e293b' });
  const [prices, setPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Fetch prices
  useEffect(() => {
    const fetchPrices = async () => {
      if (portfolio.length === 0) return;
      setLoadingPrices(true);
      try {
        const symbols = portfolio.map(c => c.symbol);
        const { data } = await base44.functions.invoke('fetchCryptoPrices', { symbols });
        setPrices(data.prices || {});
      } catch (err) {
        console.error("Failed to fetch prices", err);
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPrices();
    // Refresh every 60s
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [portfolio]);

  // Update User Holdings
  const updateUserHoldingsMutation = useMutation({
    mutationFn: async ({ symbol, amount }) => {
      // Get current user prefs portfolio
      const currentPortfolio = preferences?.crypto_portfolio || [];
      const existingIndex = currentPortfolio.findIndex(c => c.symbol === symbol);
      
      let newPortfolio = [...currentPortfolio];
      if (existingIndex >= 0) {
        newPortfolio[existingIndex] = { ...newPortfolio[existingIndex], amount: parseFloat(amount) };
      } else {
        newPortfolio.push({ symbol, amount: parseFloat(amount) });
      }
      
      // Update UserPreferences
      // Need to find the preferences ID first. Assuming we have it or fetch it.
      // useTheme provides preferences object which usually has ID if fetched from DB.
      // If not, we filter.
      let prefsId = preferences?.id;
      if (!prefsId) {
         const res = await base44.entities.UserPreferences.filter({ user_email: user.email });
         if (res.length > 0) prefsId = res[0].id;
      }

      if (prefsId) {
        await base44.entities.UserPreferences.update(prefsId, { crypto_portfolio: newPortfolio });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['preferences']);
    }
  });

  const handleAddCoin = () => {
    if (!newCoin.symbol) return;
    const updated = [...portfolio, { 
      symbol: newCoin.symbol.toUpperCase(), 
      amount: parseFloat(newCoin.amount) || 0,
      color: newCoin.color
    }];
    onUpdatePortfolio(updated);
    setIsAddOpen(false);
    setNewCoin({ symbol: '', amount: '', color: '#1e293b' });
  };

  const handleRemoveCoin = (index) => {
    const updated = portfolio.filter((_, i) => i !== index);
    onUpdatePortfolio(updated);
  };

  return (
    <Card className="shadow-lg border-0 bg-transparent text-white overflow-hidden bg-slate-900">
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row justify-between items-center space-y-0">
        <div className="flex items-center gap-2">
            {/* Removed Title as requested */}
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white">
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-slate-900 text-white border-slate-700">
            <DialogHeader>
              <DialogTitle>Add Group Ticker</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Coin Symbol</label>
                <Input 
                  value={newCoin.symbol} 
                  onChange={e => setNewCoin({...newCoin, symbol: e.target.value})}
                  placeholder="BTC"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Group Target Amount (Optional)</label>
                <Input 
                  type="number"
                  value={newCoin.amount} 
                  onChange={e => setNewCoin({...newCoin, amount: e.target.value})}
                  placeholder="0.00"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Background Color</label>
                <div className="flex gap-2 items-center">
                    <Input 
                        type="color" 
                        value={newCoin.color}
                        onChange={e => setNewCoin({...newCoin, color: e.target.value})}
                        className="w-12 h-10 p-1 bg-slate-800 border-slate-700"
                    />
                    <div className="flex flex-wrap gap-1">
                        {colorPalette.map(c => (
                            <div 
                                key={c} 
                                className={`w-6 h-6 rounded-full cursor-pointer border-2 ${newCoin.color === c ? 'border-white' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                                onClick={() => setNewCoin({...newCoin, color: c})}
                            />
                        ))}
                    </div>
                </div>
              </div>

              <Button 
                onClick={handleAddCoin} 
                disabled={!newCoin.symbol}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Add Ticker
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {portfolio.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            <Coins className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No tickers configured.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {portfolio.map((coin, idx) => {
              const currentPrice = prices[coin.symbol] || 0;
              const userHolding = (preferences?.crypto_portfolio || []).find(c => c.symbol === coin.symbol)?.amount || 0;
              const userValue = userHolding * currentPrice;
              
              return (
                <div 
                    key={`${coin.symbol}-${idx}`} 
                    className="relative overflow-hidden rounded-xl border border-white/10 transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: coin.color || '#1e293b' }}
                >
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className="font-bold text-lg">{coin.symbol}</div>
                            {loadingPrices && <RefreshCw className="w-3 h-3 animate-spin opacity-50" />}
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
                                <Popover>
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
                                                onChange={(e) => {
                                                    // Auto-save on blur or enter? Let's add a save button
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        updateUserHoldingsMutation.mutate({ symbol: coin.symbol, amount: e.target.value });
                                                        e.currentTarget.blur();
                                                    }
                                                }}
                                                className="h-8 bg-slate-800 border-slate-600"
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
                            onClick={() => handleRemoveCoin(idx)}
                            className="h-6 w-6 text-white/40 hover:text-red-300 hover:bg-transparent"
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}