import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Coins, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminCustomCoins() {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCoin, setEditingCoin] = useState(null); // null for create, object for edit

  // Form State
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    current_price: ''
  });

  const { data: coins = [], isLoading } = useQuery({
    queryKey: ['adminCustomCoins'],
    queryFn: () => base44.entities.CustomCoin.list('-updated_date')
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        current_price: parseFloat(data.current_price),
        updated_by: (await base44.auth.me())?.email
      };

      if (editingCoin) {
        return base44.entities.CustomCoin.update(editingCoin.id, payload);
      } else {
        return base44.entities.CustomCoin.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCustomCoins']);
      setIsEditOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomCoin.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCustomCoins']);
    }
  });

  const resetForm = () => {
    setFormData({ symbol: '', name: '', current_price: '' });
    setEditingCoin(null);
  };

  const openCreate = () => {
    resetForm();
    setIsEditOpen(true);
  };

  const openEdit = (coin) => {
    setEditingCoin(coin);
    setFormData({
      symbol: coin.symbol,
      name: coin.name,
      current_price: coin.current_price
    });
    setIsEditOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coin?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Coins className="w-6 h-6 text-purple-600" />
            Custom Coins & Tokens
          </h2>
          <p className="text-gray-500">Manage prices for custom community tokens (e.g. PNIC, MIRX)</p>
        </div>
        <Dialog open={isEditOpen} onOpenChange={(open) => !open && setIsEditOpen(false)}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" /> Add Coin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCoin ? 'Edit Coin' : 'Add New Coin'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Symbol</label>
                <Input
                  placeholder="e.g. PNIC"
                  value={formData.symbol}
                  onChange={e => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  disabled={!!editingCoin} // Lock symbol on edit to prevent confusion? Or allow edit. Let's allow edit.
                />
                <p className="text-xs text-gray-500">Unique ticker symbol (uppercase)</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g. Pixel Nuts Coin"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Price ($)</label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <Input
                    type="number"
                    step="0.00000001"
                    className="pl-9"
                    placeholder="0.00"
                    value={formData.current_price}
                    onChange={e => setFormData({ ...formData, current_price: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => saveMutation.mutate(formData)}
                disabled={!formData.symbol || !formData.current_price || saveMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Coin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No custom coins found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              coins.map(coin => (
                <TableRow key={coin.id}>
                  <TableCell className="font-bold">{coin.symbol}</TableCell>
                  <TableCell>{coin.name}</TableCell>
                  <TableCell className="font-mono">${coin.current_price}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {coin.updated_date ? format(new Date(coin.updated_date), 'MMM d, yyyy HH:mm') : '-'}
                    {coin.updated_by && <div className="text-xs opacity-70">by {coin.updated_by}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(coin)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(coin.id)} className="text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}