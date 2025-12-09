import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, Calendar, Clock, AlertTriangle, Plus, Trash2, ExternalLink, 
  CreditCard, Bell, CheckCircle2, XCircle, Filter, PieChart 
} from 'lucide-react';
import { format, differenceInDays, addDays, parseISO, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function FinanceDashboard({ userEmail }) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('all'); // all, trials, subscriptions

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['financeItems', userEmail],
    queryFn: () => base44.entities.FinanceItem.filter({ 
      created_by: userEmail,
      status: 'active'
    }, '-due_date'),
    enabled: !!userEmail
  });

  const { totalMonthly, upcomingTrials } = useMemo(() => {
    let monthly = 0;
    const trials = [];
    
    items.forEach(item => {
      if (item.type === 'subscription' && item.status === 'active') {
        if (item.billing_cycle === 'monthly') monthly += (item.amount || 0);
        if (item.billing_cycle === 'yearly') monthly += (item.amount || 0) / 12;
        if (item.billing_cycle === 'weekly') monthly += (item.amount || 0) * 4.33;
      }
      
      if (item.type === 'trial' && item.status === 'active') {
        trials.push(item);
      }
    });
    
    return { totalMonthly: monthly, upcomingTrials: trials };
  }, [items]);

  const itemMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        return await base44.entities.FinanceItem.update(data.id, data);
      } else {
        return await base44.entities.FinanceItem.create({
          created_by: userEmail,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeItems'] });
      setShowAddModal(false);
      setEditingItem(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Instead of deleting, mark as cancelled/archived to keep history? 
      // For now let's just update status to cancelled
      return await base44.entities.FinanceItem.update(id, { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeItems'] });
    }
  });

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'trials') return item.type === 'trial';
    if (filter === 'subscriptions') return item.type === 'subscription';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-emerald-600 font-medium">Monthly Burn</p>
              <h3 className="text-2xl font-bold text-gray-800">${totalMonthly.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 ${upcomingTrials.length > 0 ? 'ring-2 ring-amber-400' : ''}`}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-amber-600 font-medium">Active Trials</p>
              <h3 className="text-2xl font-bold text-gray-800">{upcomingTrials.length}</h3>
              {upcomingTrials.length > 0 && (
                <p className="text-xs text-amber-700 mt-1">Don't forget to cancel!</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 cursor-pointer hover:shadow-md transition-all" onClick={() => { setEditingItem(null); setShowAddModal(true); }}>
          <CardContent className="p-6 flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2 text-blue-600">
              <Plus className="w-8 h-8" />
              <span className="font-semibold">Add New Item</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main List */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Subscriptions & Trials</CardTitle>
            <CardDescription>Track your recurring expenses and trial expiration dates</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'trials' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFilter('trials')}
              className={filter === 'trials' ? 'bg-amber-500 hover:bg-amber-600' : ''}
            >
              Trials Only
            </Button>
            <Button 
              variant={filter === 'subscriptions' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFilter('subscriptions')}
            >
              Subscriptions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <PieChart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No items found. Add your subscriptions to start tracking!</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <FinanceItemRow 
                  key={item.id} 
                  item={item} 
                  onEdit={() => { setEditingItem(item); setShowAddModal(true); }}
                  onDelete={() => deleteMutation.mutate(item.id)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <FinanceItemModal 
        isOpen={showAddModal} 
        onClose={() => { setShowAddModal(false); setEditingItem(null); }}
        item={editingItem}
        onSave={(data) => itemMutation.mutate(data)}
      />
    </div>
  );
}

function FinanceItemRow({ item, onEdit, onDelete }) {
  const daysUntilDue = differenceInDays(parseISO(item.due_date), new Date());
  const isTrial = item.type === 'trial';
  const isUrgent = isTrial && daysUntilDue <= 3 && daysUntilDue >= 0;
  const isOverdue = daysUntilDue < 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center gap-4 transition-all hover:shadow-md ${
        isUrgent ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300' : 'bg-white border-gray-100'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        isTrial ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
      }`}>
        {isTrial ? <Clock className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-gray-800 truncate">{item.name}</h4>
          {isTrial && <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">TRIAL</Badge>}
          {item.category && <Badge variant="secondary" className="text-xs">{item.category}</Badge>}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {isOverdue ? 'Expired' : 'Due'}: {format(parseISO(item.due_date), 'MMM d, yyyy')}
          </span>
          {item.amount > 0 && (
            <span className="font-medium text-gray-700">
              ${item.amount}/{item.billing_cycle === 'one-time' ? 'once' : item.billing_cycle === 'yearly' ? 'yr' : 'mo'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
        {isTrial && (
          <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
            isUrgent ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-600'
          }`}>
            {daysUntilDue < 0 ? 'Ended' : `${daysUntilDue} days left`}
          </div>
        )}
        
        {item.website_url && (
          <a 
            href={item.website_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-500 transition-colors"
            title="Manage Subscription"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        
        <Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-400 hover:text-red-600 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function FinanceItemModal({ isOpen, onClose, item, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'subscription',
    billing_cycle: 'monthly',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    reminder_date: '',
    website_url: '',
    category: 'other',
    notes: ''
  });

  React.useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        due_date: item.due_date ? format(parseISO(item.due_date), 'yyyy-MM-dd') : '',
        reminder_date: item.reminder_date ? format(parseISO(item.reminder_date), 'yyyy-MM-dd') : ''
      });
    } else {
      setFormData({
        name: '',
        amount: '',
        type: 'subscription',
        billing_cycle: 'monthly',
        due_date: format(new Date(), 'yyyy-MM-dd'),
        reminder_date: '',
        website_url: '',
        category: 'other',
        notes: ''
      });
    }
  }, [item, isOpen]);

  // Auto-set reminder date for trials
  const handleTypeChange = (val) => {
    const updated = { ...formData, type: val };
    if (val === 'trial' && !formData.reminder_date && formData.due_date) {
      // Default remind 3 days before
      const due = parseISO(formData.due_date);
      const reminder = addDays(due, -3);
      updated.reminder_date = format(reminder, 'yyyy-MM-dd');
    }
    setFormData(updated);
  };

  const handleSubmit = () => {
    onSave({
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      id: item?.id
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add Expense / Trial'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="trial">Free Trial</SelectItem>
                  <SelectItem value="one-time">One-Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="software">Software / App</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input 
              placeholder="e.g. Netflix, Adobe, Gym"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Input 
                  type="number"
                  className="pl-7"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cycle</label>
              <Select value={formData.billing_cycle} onValueChange={(v) => setFormData({...formData, billing_cycle: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="one-time">One-Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{formData.type === 'trial' ? 'Trial Ends' : 'Next Due Date'}</label>
              <Input 
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
            {formData.type === 'trial' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-600">Remind Me On</label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="date"
                    value={formData.reminder_date}
                    onChange={(e) => setFormData({...formData, reminder_date: e.target.value})}
                    className="border-amber-200 focus:ring-amber-500"
                  />
                  <Bell className="w-4 h-4 text-amber-500" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Website / Management URL</label>
            <Input 
              placeholder="https://..."
              value={formData.website_url}
              onChange={(e) => setFormData({...formData, website_url: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea 
              placeholder="Cancellation steps, login info, etc."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">Save Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}