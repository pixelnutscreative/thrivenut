import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, addDays, parseISO } from 'date-fns';
import { Shield, Plus, CheckCircle, Loader2, Wind, Zap, Crosshair, Users, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function BattleInventoryShared() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ creator: '', mod_username: '', contacts: [], inventory: [] });
  
  const [newItem, setNewItem] = useState({
    contact_id: '',
    contact_name: '',
    type: 'Glove',
    quantity: 1,
    acquired_date: format(new Date(), 'yyyy-MM-dd'),
    acquired_time: '12:00'
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) {
      setToken(t);
      fetchContext(t);
    } else {
      setLoading(false);
      setError('Missing access token.');
    }
  }, []);

  const fetchContext = async (t) => {
    try {
      const res = await base44.functions.invoke('sharedInventory', { action: 'get_context', token: t });
      if (res.data.error) {
        throw new Error(res.data.error);
      }
      setData(res.data);
    } catch (e) {
      setError(e.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const dateTimeString = `${newItem.acquired_date}T${newItem.acquired_time || '12:00'}:00`;
      const acquisitionDate = new Date(dateTimeString);
      const expirationDate = addDays(acquisitionDate, 5);

      const payload = {
        ...newItem,
        expires_at: expirationDate.toISOString(),
        expires_date: format(expirationDate, 'yyyy-MM-dd')
      };
      
      const res = await base44.functions.invoke('sharedInventory', { 
        action: 'add_item', 
        token, 
        item: payload 
      });

      if (res.data.error) throw new Error(res.data.error);

      setSuccessMsg(`Added ${newItem.quantity} ${newItem.type}(s) for ${newItem.contact_name}!`);
      setNewItem(prev => ({ ...prev, quantity: 1 }));
      fetchContext(token); // Refresh inventory list
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      alert('Error adding item: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async (id, updates) => {
    try {
      await base44.functions.invoke('sharedInventory', {
        action: 'update_item',
        token,
        itemId: id,
        updates
      });
      fetchContext(token);
    } catch (e) {
      console.error(e);
    }
  };

  const handleContactSelect = (contactId) => {
    const contact = data.contacts.find(c => c.id === contactId);
    setNewItem({
      ...newItem,
      contact_id: contactId,
      contact_name: contact ? (contact.display_name || contact.username) : ''
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="max-w-md w-full border-red-200">
        <CardContent className="p-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-red-700">Access Denied</h2>
          <p className="text-slate-600">{error}</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 flex justify-center">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Battle Inventory</h1>
          <p className="text-slate-600">
            Managing for <span className="font-semibold text-indigo-600">{data.creator}</span>
            {data.mod_username && <span className="block text-sm mt-1">Logged in as: @{data.mod_username}</span>}
          </p>
        </div>

        {/* Add Item Form */}
        <Card className="shadow-xl border-indigo-100">
          <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-4">
            <CardTitle className="text-lg text-indigo-900">Log New Power-Up</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Who has it?</label>
              <Select value={newItem.contact_id} onValueChange={handleContactSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Creator/Contact" />
                </SelectTrigger>
                <SelectContent>
                  {data.contacts.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.display_name || c.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={newItem.type} onValueChange={(v) => setNewItem({...newItem, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Glove">🥊 Glove</SelectItem>
                    <SelectItem value="Mist">🌫️ Mist</SelectItem>
                    <SelectItem value="Sniper">🎯 Sniper</SelectItem>
                    <SelectItem value="Jet">✈️ Jet</SelectItem>
                    <SelectItem value="Sub">🌊 Sub</SelectItem>
                    <SelectItem value="Other">❓ Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input 
                  type="number" 
                  min="1" 
                  value={newItem.quantity} 
                  onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Acquired Date</label>
                <Input 
                  type="date" 
                  value={newItem.acquired_date} 
                  onChange={(e) => setNewItem({...newItem, acquired_date: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Select value={newItem.acquired_time} onValueChange={(v) => setNewItem({...newItem, acquired_time: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return <SelectItem key={hour} value={`${hour}:00`}>{hour}:00</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AnimatePresence>
              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 text-sm font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              onClick={handleAddItem}
              disabled={!newItem.contact_id || isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg shadow-md hover:shadow-lg transition-all"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
              Log Item
            </Button>
          </CardContent>
        </Card>

        {/* Inventory List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Current Active Inventory</span>
              <Badge variant="secondary">{data.inventory.length} Items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto divide-y">
              {data.inventory.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="font-medium text-slate-900">{item.contact_name}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-normal">
                        {item.type === 'Glove' ? '🥊' : item.type === 'Mist' ? '🌫️' : '⚡'} {item.type}
                      </Badge>
                      <span>x{item.quantity}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => handleUpdateItem(item.id, { quantity: Math.max(0, item.quantity - 1) })}
                      disabled={item.quantity <= 0}
                    >
                      Use (-1)
                    </Button>
                  </div>
                </div>
              ))}
              {data.inventory.length === 0 && (
                <div className="p-8 text-center text-slate-500 italic">No active items found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}