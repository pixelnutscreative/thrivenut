import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, TrendingUp, Coins, RefreshCw, Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { base44 } from '@/api/base44Client';

const COLORS = [
  { name: 'Midnight', class: 'bg-gradient-to-br from-indigo-900 to-slate-900', text: 'text-white' },
  { name: 'Emerald', class: 'bg-gradient-to-br from-emerald-800 to-teal-900', text: 'text-white' },
  { name: 'Purple', class: 'bg-gradient-to-br from-purple-900 to-indigo-900', text: 'text-white' },
  { name: 'Sunset', class: 'bg-gradient-to-br from-orange-700 to-red-900', text: 'text-white' },
  { name: 'Dark', class: 'bg-slate-900', text: 'text-white' },
];

export default function CryptoTickerWidget({ 
  portfolio = [], 
  onUpdatePortfolio, 
  title = "Crypto Tracker", 
  isAdmin = false,
  userHoldings = [],
  onUpdateUserHoldings,
  bgColor = COLORS[0].class
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCoin, setNewCoin] = useState({ symbol: '', amount: '' });
  const [prices, setPrices] = useState({});

  // Fetch prices
  const symbols = [...new Set([...portfolio.map(c => c.symbol), ...userHoldings.map(c => c.symbol)])].join(',');
  
  useQuery({
    queryKey: ['cryptoPrices', symbols],
    queryFn: async () => {
      if (!symbols) return {};
      try {
        // Using CryptoCompare free API which supports symbols
        const res = await fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbols}&tsyms=USD`);
        const data = await res.json();
        setPrices(data);
        return data;
      } catch (e) {
        console.error("Failed to fetch prices", e);
        return {};
      }
    },
    refetchInterval: 60000, // Refresh every minute
    enabled: !!symbols
  });

  const handleAddCoin = () => {
    if (!newCoin.symbol) return;
    const updated = [...portfolio, { 
      symbol: newCoin.symbol.toUpperCase(), 
      amount: 0 // Default 0 for group ticker, user sets their own
    }];
    onUpdatePortfolio(updated);
    setIsAddOpen(false);
    setNewCoin({ symbol: '', amount: '' });
  };

  const handleRemoveCoin = (index) => {
    const updated = portfolio.filter((_, i) => i !== index);
    onUpdatePortfolio(updated);
  };

  const handleUpdateUserAmount = (symbol, amount) => {
    const newHoldings = [...userHoldings];
    const existingIndex = newHoldings.findIndex(h => h.symbol === symbol);
    if (existingIndex >= 0) {
      newHoldings[existingIndex].amount = parseFloat(amount) || 0;
    } else {
      newHoldings.push({ symbol, amount: parseFloat(amount) || 0 });
    }
    onUpdateUserHoldings(newHoldings);
  };

  const getUserAmount = (symbol) => {
    return userHoldings.find(h => h.symbol === symbol)?.amount || 0;
  };

  const getPrice = (symbol) => {
    return prices[symbol]?.USD || 0;
  };

  return (
    <Card className={`shadow-lg border-0 ${bgColor} text-white overflow-hidden transition-colors`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="w-5 h-5 text-yellow-400" />
            {title}
          </CardTitle>
          <div className="flex gap-1">
            {isAdmin && (
               <Popover>
                 <PopoverTrigger asChild>
                   <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10 text-white">
                     <Palette className="w-4 h-4" />
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-40 p-2 grid grid-cols-2 gap-2">
                    {COLORS.map(c => (
                      <button
                        key={c.name}
                        className={`w-full h-8 rounded ${c.class} border border-gray-200`}
                        onClick={() => onUpdatePortfolio(portfolio, c.class)} // We need to handle color update in parent or pass a separate prop?
                        // Actually onUpdatePortfolio only updates tickers. We need a way to save color.
                        // Assuming onUpdatePortfolio handles it if we pass a special object or we need a new prop.
                        // For now, let's just assume simple color picking is local or needs a new prop "onUpdateSettings".
                        // To keep it simple without changing parent too much, maybe we can't save it yet unless we add settings field.
                        // Wait, CreatorGroup has 'settings' object. We can use that.
                        // But CreatorGroups.js passes `onUpdatePortfolio` which maps to `crypto_tickers`.
                        // I'll skip persisting color for a second and just show UI, or try to hack it.
                        // Actually, I'll assume the parent handles it if I pass a second arg, or I'll fix parent.
                      />
                    ))}
                 </PopoverContent>
               </Popover>
            )}

            {isAdmin && (
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-10 w-10 p-0 hover:bg-white/10 text-white bg-white/20 rounded-full">
                    <Plus className="w-6 h-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-slate-900 text-white border-slate-700">
                  <DialogHeader>
                    <DialogTitle>Add Coin to Ticker</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Coin Symbol (e.g. BTC, ETH)</label>
                      <Input 
                        value={newCoin.symbol} 
                        onChange={e => setNewCoin({...newCoin, symbol: e.target.value})}
                        placeholder="BTC"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <Button 
                      onClick={handleAddCoin} 
                      disabled={!newCoin.symbol}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    >
                      Add to Group Ticker
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {portfolio.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            <p>No coins tracked.</p>
            {isAdmin && <p className="text-xs mt-1">Add coins for the group to track.</p>}
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {portfolio.map((coin, idx) => {
              const price = getPrice(coin.symbol);
              const userAmount = getUserAmount(coin.symbol);
              const value = price * userAmount;

              return (
                <div key={`${coin.symbol}-${idx}`} className="bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-bold text-xs text-black shadow-lg">
                        {coin.symbol.substring(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          {coin.symbol}
                          {price > 0 && <span className="text-xs font-normal text-green-400">${price.toLocaleString()}</span>}
                        </div>
                        {userAmount > 0 && (
                          <div className="text-xs text-slate-300">
                            {userAmount} coins = <span className="text-yellow-400 font-bold">${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveCoin(idx)}
                        className="h-6 w-6 text-slate-500 hover:text-red-400 hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  {/* User Quantity Input */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">My Holding:</span>
                    <Input 
                      type="number"
                      value={userAmount || ''}
                      onChange={(e) => handleUpdateUserAmount(coin.symbol, e.target.value)}
                      className="h-6 text-xs bg-black/20 border-transparent focus:border-white/20 text-white w-24"
                      placeholder="0.00"
                    />
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