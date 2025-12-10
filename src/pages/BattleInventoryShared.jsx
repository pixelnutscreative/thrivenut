import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, addDays, parseISO } from 'date-fns';
import { Shield, Plus, CheckCircle, Loader2, Wind, Zap, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BattleInventoryShared() {
  const queryClient = useQueryClient();
  
  // Inventory Form State
  const [newItem, setNewItem] = useState({
    contact_id: '',
    contact_name: '',
    type: 'Glove',
    quantity: 1,
    acquired_date: format(new Date(), 'yyyy-MM-dd')
  });

  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Contacts for dropdown
  // Note: Since this is likely public/shared, we need to ensure we can list contacts.
  // If public pages can't access entities directly without auth, this might fail if not authenticated.
  // However, Base44 instructions say "can throw an error if the user is not logged in and the app is public".
  // But standard entity listing might be restricted. 
  // Assuming the user meant "Share with a MOD who has an account" OR "Public access is allowed for this entity".
  // Given standard Base44 rules, typically data access requires auth. 
  // If the user wants to "share" it, they might mean sending the link to someone who IS a team member/admin.
  // OR, if it's truly public, I might need a backend function to handle the submission securely (bypassing RLS if necessary, but that's risky).
  // For now, I'll assume the person accessing this page has some level of access or it's an internal tool link.
  
  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts'],
    queryFn: () => base44.entities.TikTokContact.list('display_name', 1000),
  });

  // Mutation
  const createItemMutation = useMutation({
    mutationFn: (data) => base44.entities.BattlePowerUp.create({
        ...data,
        expires_date: format(addDays(parseISO(data.acquired_date), 5), 'yyyy-MM-dd')
    }),
    onSuccess: () => {
      setSuccessMsg(`Added ${newItem.quantity} ${newItem.type}(s) for ${newItem.contact_name}!`);
      setNewItem({ ...newItem, quantity: 1 }); // Keep contact selected for rapid entry
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  });

  const handleContactSelect = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    setNewItem({
      ...newItem,
      contact_id: contactId,
      contact_name: contact ? (contact.display_name || contact.username) : ''
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            Battle Inventory
          </h1>
          <p className="text-slate-600">Quick Log for Mods & Team</p>
        </div>

        <Card className="shadow-xl border-indigo-100">
          <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
            <CardTitle>Log Power-Up</CardTitle>
            <CardDescription>Items expire 5 days after acquisition.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Who has it?</label>
              <Select value={newItem.contact_id} onValueChange={handleContactSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Creator/Contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(c => (
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Acquired Date</label>
              <Input 
                type="date" 
                value={newItem.acquired_date} 
                onChange={(e) => setNewItem({...newItem, acquired_date: e.target.value})} 
              />
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
              onClick={() => createItemMutation.mutate(newItem)}
              disabled={!newItem.contact_id || createItemMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 size-lg text-lg"
            >
              {createItemMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
              Log Item
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}