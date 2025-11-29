import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, Edit, Trash2, Check, X, Clock, AlertCircle, 
  Bug, Sparkles, Palette, Calendar, Heart, Brain, Music,
  LayoutDashboard, Users, Target, BookOpen, Filter, Search,
  ListChecks, Play, Copy, ChevronUp, ChevronDown
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

const categoryConfig = {
  bug: { label: 'Bug/Fix', icon: Bug, color: 'bg-red-100 text-red-700' },
  feature: { label: 'Feature', icon: Sparkles, color: 'bg-purple-100 text-purple-700' },
  ui: { label: 'UI/Theme', icon: Palette, color: 'bg-pink-100 text-pink-700' },
  integration: { label: 'Integration', icon: Calendar, color: 'bg-blue-100 text-blue-700' },
  wellness: { label: 'Wellness', icon: Heart, color: 'bg-green-100 text-green-700' },
  mental_health: { label: 'Mental Health', icon: Brain, color: 'bg-teal-100 text-teal-700' },
  song_generator: { label: 'Song Generator', icon: Music, color: 'bg-amber-100 text-amber-700' },
  dashboard: { label: 'Dashboard', icon: LayoutDashboard, color: 'bg-indigo-100 text-indigo-700' },
  onboarding: { label: 'Onboarding', icon: Users, color: 'bg-cyan-100 text-cyan-700' },
  resources: { label: 'Resources', icon: BookOpen, color: 'bg-orange-100 text-orange-700' },
  calendar: { label: 'Calendar', icon: Calendar, color: 'bg-sky-100 text-sky-700' },
  contacts: { label: 'Contacts', icon: Users, color: 'bg-violet-100 text-violet-700' },
  goals: { label: 'Goals', icon: Target, color: 'bg-lime-100 text-lime-700' },
  other: { label: 'Other', icon: Sparkles, color: 'bg-gray-100 text-gray-700' },
};

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: Check },
  wont_do: { label: "Won't Do", color: 'bg-red-100 text-red-700', icon: X },
  needs_info: { label: 'Needs Info', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

export default function AdminFeedbackContent() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    category: 'feature',
    title: '',
    description: '',
    my_thoughts: '',
    status: 'pending',
    priority: 'medium',
    notes: '',
  });

  const { data: items = [] } = useQuery({
    queryKey: ['feedbackItems'],
    queryFn: () => base44.entities.FeedbackItem.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FeedbackItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbackItems'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FeedbackItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbackItems'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FeedbackItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedbackItems'] }),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      category: 'feature',
      title: '',
      description: '',
      my_thoughts: '',
      status: 'pending',
      priority: 'medium',
      notes: '',
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      category: item.category || 'feature',
      title: item.title || '',
      description: item.description || '',
      my_thoughts: item.my_thoughts || '',
      status: item.status || 'pending',
      priority: item.priority || 'medium',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      completed_date: formData.status === 'completed' ? format(new Date(), 'yyyy-MM-dd') : null,
    };
    
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const quickStatusChange = (item, newStatus) => {
    updateMutation.mutate({ 
      id: item.id, 
      data: { 
        status: newStatus,
        completed_date: newStatus === 'completed' ? format(new Date(), 'yyyy-MM-dd') : null,
      } 
    });
  };

  const filteredItems = items.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = !searchTerm || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Group by category for display
  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const stats = {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    inProgress: items.filter(i => i.status === 'in_progress').length,
    completed: items.filter(i => i.status === 'completed').length,
    queued: items.filter(i => i.queued_for_batch).length,
  };

  // Get queued items sorted by batch_order
  const queuedItems = items
    .filter(i => i.queued_for_batch && i.status !== 'completed')
    .sort((a, b) => (a.batch_order || 999) - (b.batch_order || 999));

  const toggleQueuedForBatch = (item) => {
    const isQueued = !item.queued_for_batch;
    const batchOrder = isQueued ? (stats.queued + 1) : null;
    updateMutation.mutate({ 
      id: item.id, 
      data: { queued_for_batch: isQueued, batch_order: batchOrder } 
    });
  };

  const updateBatchOrder = (item, direction) => {
    const currentOrder = item.batch_order || 999;
    const newOrder = direction === 'up' ? currentOrder - 1.5 : currentOrder + 1.5;
    updateMutation.mutate({ id: item.id, data: { batch_order: newOrder } });
  };

  const copyBatchSummary = () => {
    const summary = queuedItems.map((item, idx) => 
      `${idx + 1}. [${categoryConfig[item.category]?.label || item.category}] ${item.title}${item.description ? ': ' + item.description : ''}`
    ).join('\n\n');
    navigator.clipboard.writeText(summary);
    alert('Batch summary copied to clipboard!');
  };

  const clearBatchQueue = () => {
    if (!confirm('Clear all items from the batch queue?')) return;
    queuedItems.forEach(item => {
      updateMutation.mutate({ id: item.id, data: { queued_for_batch: false, batch_order: null } });
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-gray-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Items</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            <p className="text-xs text-yellow-600">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
            <p className="text-xs text-blue-600">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
            <p className="text-xs text-green-600">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-2 border-purple-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats.queued}</p>
            <p className="text-xs text-purple-600">Next Batch</p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Queue Section */}
      {queuedItems.length > 0 && (
        <Card className="border-2 border-purple-300 bg-purple-50/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg text-purple-800">
                <ListChecks className="w-5 h-5" />
                Next Batch Queue
                <Badge className="bg-purple-200 text-purple-800 ml-2">{queuedItems.length} items</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyBatchSummary}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Summary
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearBatchQueue}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Queue
                </Button>
              </div>
            </div>
            <p className="text-sm text-purple-600">Check items below to add to this batch. Copy summary to paste into chat.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {queuedItems.map((item, idx) => {
              const catConfig = categoryConfig[item.category] || categoryConfig.other;
              const CatIcon = catConfig.icon;
              return (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-purple-200">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => updateBatchOrder(item, 'up')}>
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => updateBatchOrder(item, 'down')}>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <Badge className={`text-xs ${catConfig.color}`}>
                    <CatIcon className="w-3 h-3 mr-1" />
                    {catConfig.label}
                  </Badge>
                  <span className="flex-1 font-medium text-sm">{item.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleQueuedForBatch(item)}
                    className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items by Category */}
      {Object.entries(groupedItems).map(([category, categoryItems]) => {
        const catConfig = categoryConfig[category] || categoryConfig.other;
        const CatIcon = catConfig.icon;
        
        return (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CatIcon className="w-5 h-5" />
                {catConfig.label}
                <Badge variant="outline" className="ml-2">{categoryItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryItems.map(item => {
                const statusConf = statusConfig[item.status] || statusConfig.pending;
                const priorityConf = priorityConfig[item.priority] || priorityConfig.medium;
                const StatusIcon = statusConf.icon;
                
                return (
                  <div 
                    key={item.id} 
                    className={`p-3 rounded-lg border ${item.status === 'completed' ? 'bg-green-50/50 border-green-200' : 'bg-white'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-medium ${item.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                            {item.title}
                          </h4>
                          <Badge className={`text-xs ${statusConf.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConf.label}
                          </Badge>
                          <Badge className={`text-xs ${priorityConf.color}`}>
                            {priorityConf.label}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        {item.my_thoughts && (
                          <p className="text-xs text-purple-600 mt-1 italic">💭 {item.my_thoughts}</p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-gray-500 mt-1">📝 {item.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {item.status !== 'completed' && (
                          <>
                            <button
                              onClick={() => toggleQueuedForBatch(item)}
                              className={`h-8 w-8 p-0 flex items-center justify-center rounded transition-colors ${
                                item.queued_for_batch 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'hover:bg-purple-50 text-gray-400'
                              }`}
                              title={item.queued_for_batch ? 'Remove from batch' : 'Add to next batch'}
                            >
                              <ListChecks className="w-4 h-4" />
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => quickStatusChange(item, 'completed')}
                              className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this item?')) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No items found. Add your first feedback item!
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Brief title..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Detailed description..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">My Thoughts (Dev Notes)</label>
              <Textarea
                value={formData.my_thoughts}
                onChange={(e) => setFormData({...formData, my_thoughts: e.target.value})}
                placeholder="Implementation notes, ideas..."
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.title}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {editingItem ? 'Update' : 'Add Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}