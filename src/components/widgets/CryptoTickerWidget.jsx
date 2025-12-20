import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, TrendingUp, Coins, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CryptoTickerWidget({ portfolio = [], onUpdatePortfolio, title = "Crypto Tracker" }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCoin, setNewCoin] = useState({ symbol: '', amount: '' });

  const handleAddCoin = () => {
    if (!newCoin.symbol) return;
    const updated = [...portfolio, { 
      symbol: newCoin.symbol.toUpperCase(), 
      amount: parseFloat(newCoin.amount) || 0 
    }];
    onUpdatePortfolio(updated);
    setIsAddOpen(false);
    setNewCoin({ symbol: '', amount: '' });
  };

  const handleRemoveCoin = (index) => {
    const updated = portfolio.filter((_, i) => i !== index);
    onUpdatePortfolio(updated);
  };

  const handleUpdateAmount = (index, amount) => {
    const updated = [...portfolio];
    updated[index].amount = parseFloat(amount) || 0;
    onUpdatePortfolio(updated);
  };

  const handleAddCoin = () => {
    if (!newCoin.symbol) return;
    const updated = [...portfolio, { 
      symbol: newCoin.symbol.toUpperCase(), 
      amount: parseFloat(newCoin.amount) || 0 
    }];
    updatePortfolioMutation.mutate(updated);
  };

  const handleRemoveCoin = (index) => {
    const updated = portfolio.filter((_, i) => i !== index);
    updatePortfolioMutation.mutate(updated);
  };

  const handleUpdateAmount = (index, amount) => {
    const updated = [...portfolio];
    updated[index].amount = parseFloat(amount) || 0;
    updatePortfolioMutation.mutate(updated);
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-900 to-slate-900 text-white overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="w-5 h-5 text-yellow-400" />
            {title}
          </CardTitle>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10 text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-slate-900 text-white border-slate-700">
              <DialogHeader>
                <DialogTitle>Add Crypto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Coin Symbol (e.g. PNIC, MIRX)</label>
                  <Input 
                    value={newCoin.symbol} 
                    onChange={e => setNewCoin({...newCoin, symbol: e.target.value})}
                    placeholder="BTC"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount Held (Optional)</label>
                  <Input 
                    type="number"
                    value={newCoin.amount} 
                    onChange={e => setNewCoin({...newCoin, amount: e.target.value})}
                    placeholder="0.00"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <Button 
                  onClick={handleAddCoin} 
                  disabled={!newCoin.symbol}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  Add Coin
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {portfolio.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            <p>No coins added yet.</p>
            <p className="text-xs mt-1">Add PNIC, MIRX, or others to track.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {portfolio.map((coin, idx) => (
              <div key={`${coin.symbol}-${idx}`} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-bold text-xs text-black shadow-lg">
                    {coin.symbol.substring(0, 3)}
                  </div>
                  <div>
                    <div className="font-bold">{coin.symbol}</div>
                    <div className="text-xs text-slate-400">
                      {coin.amount > 0 ? `${coin.amount.toLocaleString()} coins` : 'Watchlist'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveCoin(idx)}
                    className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}