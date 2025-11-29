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
  LayoutDashboard, Users, Target, BookOpen, Filter, Search
} from 'lucide-react';
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
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
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
      </div>

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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => quickStatusChange(item, 'completed')}
                            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
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