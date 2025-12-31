import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, TrendingUp, Coins, RefreshCw, Palette, DollarSign, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useTheme } from '../shared/useTheme';
import TickerItem from './TickerItem';

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
    // Refresh every hour (3600000 ms)
    const interval = setInterval(fetchPrices, 3600000);
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
      let prefsId = preferences?.id;

      // Double check if we can't find ID from props
      if (!prefsId && user?.email) {
         const res = await base44.entities.UserPreferences.filter({ user_email: user.email });
         if (res.length > 0) {
           prefsId = res[0].id;
         } else {
           // Create if doesn't exist
           const newPrefs = await base44.entities.UserPreferences.create({
             user_email: user.email,
             crypto_portfolio: newPortfolio
           });
           return newPrefs;
         }
      }

      if (prefsId) {
        await base44.entities.UserPreferences.update(prefsId, { crypto_portfolio: newPortfolio });
      } else {
        throw new Error("Could not find or create user preferences to save portfolio.");
      }
      },
      onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      }
  });

  const handleAddCoin = () => {
    if (!newCoin.symbol) return;
    const symbol = newCoin.symbol.trim().toUpperCase();
    const updated = [...portfolio, { 
      symbol: symbol, 
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
                <TickerItem
                  key={`${coin.symbol}-${idx}`}
                  coin={coin}
                  currentPrice={currentPrice}
                  userHolding={userHolding}
                  userValue={userValue}
                  loading={loadingPrices}
                  onUpdateHolding={(val) => updateUserHoldingsMutation.mutate({ symbol: coin.symbol, amount: val })}
                  onRemove={() => handleRemoveCoin(idx)}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}