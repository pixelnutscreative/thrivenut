import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Upload, Mail, Users, Bot, Star, Loader2, Check, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sourceLabels = {
  ai_tools: { label: "Let's Go Nuts AI", icon: Bot, color: 'bg-blue-100 text-blue-700' },
  nuts_and_bots: { label: 'Nuts & Bots', icon: Users, color: 'bg-purple-100 text-purple-700' },
  superfan: { label: 'SuperFan', icon: Star, color: 'bg-amber-100 text-amber-700' },
  manual: { label: 'Manual', icon: Mail, color: 'bg-gray-100 text-gray-700' },
};

export default function AdminPreApprovedEmailsContent() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [formData, setFormData] = useState({ email: '', source: 'manual', notes: '' });
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkSource, setBulkSource] = useState('ai_tools');

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ['preApprovedEmails'],
    queryFn: () => base44.entities.PreApprovedEmail.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PreApprovedEmail.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preApprovedEmails'] });
      setShowAddModal(false);
      setFormData({ email: '', source: 'manual', notes: '' });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (emailList) => {
      const results = [];
      for (const email of emailList) {
        const trimmed = email.trim().toLowerCase();
        if (trimmed && trimmed.includes('@')) {
          // Check if already exists
          const existing = emails.find(e => e.email.toLowerCase() === trimmed);
          if (!existing) {
            results.push(await base44.entities.PreApprovedEmail.create({
              email: trimmed,
              source: bulkSource,
              is_active: true
            }));
          }
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['preApprovedEmails'] });
      setShowBulkModal(false);
      setBulkEmails('');
      alert(`Added ${results.length} new emails!`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PreApprovedEmail.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preApprovedEmails'] }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.PreApprovedEmail.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preApprovedEmails'] }),
  });

  const filteredEmails = emails.filter(e => {
    const matchesSearch = !searchQuery || e.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || e.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const handleBulkAdd = () => {
    const emailList = bulkEmails.split(/[\n,;]+/).filter(e => e.trim());
    bulkCreateMutation.mutate(emailList);
  };

  // Stats
  const stats = {
    total: emails.length,
    active: emails.filter(e => e.is_active !== false).length,
    ai_tools: emails.filter(e => e.source === 'ai_tools').length,
    nuts_and_bots: emails.filter(e => e.source === 'nuts_and_bots').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.ai_tools}</p>
            <p className="text-sm text-gray-600">AI Tools</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.nuts_and_bots}</p>
            <p className="text-sm text-gray-600">Nuts & Bots</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="ai_tools">AI Tools</SelectItem>
              <SelectItem value="nuts_and_bots">Nuts & Bots</SelectItem>
              <SelectItem value="superfan">SuperFan</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Add
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Email
          </Button>
        </div>
      </div>

      {/* Email List */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-Approved Emails</CardTitle>
          <CardDescription>
            Users with these emails will automatically get full access when they sign up
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {emails.length === 0 ? 'No pre-approved emails yet' : 'No emails match your search'}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              <AnimatePresence>
                {filteredEmails.map((email, idx) => {
                  const sourceConfig = sourceLabels[email.source] || sourceLabels.manual;
                  const SourceIcon = sourceConfig.icon;
                  return (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        email.is_active === false ? 'bg-gray-50 opacity-60' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${sourceConfig.color}`}>
                          <SourceIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">{email.email}</p>
                          {email.notes && <p className="text-xs text-gray-500">{email.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={sourceConfig.color}>{sourceConfig.label}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate({ 
                            id: email.id, 
                            is_active: email.is_active === false 
                          })}
                          className={email.is_active === false ? 'text-green-600' : 'text-amber-600'}
                        >
                          {email.is_active === false ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirm('Delete this email?') && deleteMutation.mutate(email.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Single Email Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Pre-Approved Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_tools">Let's Go Nuts AI</SelectItem>
                  <SelectItem value="nuts_and_bots">Nuts & Bots</SelectItem>
                  <SelectItem value="superfan">SuperFan</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input
                placeholder="Any notes about this person..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({ ...formData, is_active: true })}
              disabled={!formData.email || createMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Add Emails</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <Select value={bulkSource} onValueChange={setBulkSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_tools">Let's Go Nuts AI</SelectItem>
                  <SelectItem value="nuts_and_bots">Nuts & Bots</SelectItem>
                  <SelectItem value="superfan">SuperFan</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Addresses</label>
              <p className="text-xs text-gray-500">Enter one email per line, or separate with commas</p>
              <Textarea
                placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkModal(false)}>Cancel</Button>
            <Button
              onClick={handleBulkAdd}
              disabled={!bulkEmails.trim() || bulkCreateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {bulkCreateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Emails
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}