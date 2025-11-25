import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ExternalLink, Trash2, Check, Calendar, BookOpen, History, Edit, Tag, FolderPlus } from 'lucide-react';
import { format, getDay, addDays, parseISO, isPast } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const colorOptions = [
  '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', 
  '#3B82F6', '#6366F1', '#84CC16', '#14B8A6', '#F97316'
];

const getDayName = (date) => {
  return daysOfWeek[getDay(date)];
};

export default function TikTokEngagement() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCreator, setEditingCreator] = useState(null);
  const [expandedHistory, setExpandedHistory] = useState({});
  const [viewMode, setViewMode] = useState('today');
  const [justEngaged, setJustEngaged] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#8B5CF6');
  
  const [formData, setFormData] = useState({
    username: '',
    engagement_frequency: 'weekly',
    specific_days: [],
    notes: '',
    color: '#8B5CF6',
    category_id: ''
  });

  const { data: creators = [] } = useQuery({
    queryKey: ['tiktokCreators'],
    queryFn: () => base44.entities.TikTokCreator.list('-created_date'),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['engagementCategories'],
    queryFn: () => base44.entities.EngagementCategory.list('name'),
  });

  const createCreatorMutation = useMutation({
    mutationFn: (data) => base44.entities.TikTokCreator.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokCreators'] });
      setShowModal(false);
      resetForm();
    },
  });

  const updateCreatorMutation = useMutation({
    mutationFn: ({ id, ...data }) => base44.entities.TikTokCreator.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokCreators'] });
      setShowModal(false);
      setEditingCreator(null);
      resetForm();
    },
  });

  const deleteCreatorMutation = useMutation({
    mutationFn: (id) => base44.entities.TikTokCreator.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokCreators'] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.EngagementCategory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementCategories'] });
      setShowCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryColor('#8B5CF6');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => base44.entities.EngagementCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementCategories'] });
    },
  });

  const markEngagedMutation = useMutation({
    mutationFn: async ({ id, currentHistory }) => {
      const newTimestamp = new Date().toISOString();
      const updatedHistory = [...(currentHistory || []), newTimestamp];
      
      return await base44.entities.TikTokCreator.update(id, {
        last_engaged_date: format(new Date(), 'yyyy-MM-dd'),
        engagement_history: updatedHistory
      });
    },
    onSuccess: (_, variables) => {
      setJustEngaged(prev => ({ ...prev, [variables.id]: true }));
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tiktokCreators'] });
      }, 800);
    },
  });

  const resetForm = () => {
    setFormData({
      username: '',
      engagement_frequency: 'weekly',
      specific_days: [],
      notes: '',
      color: '#8B5CF6',
      category_id: ''
    });
    setEditingCreator(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (creator) => {
    setEditingCreator(creator);
    setFormData({
      username: creator.username,
      engagement_frequency: creator.engagement_frequency || 'weekly',
      specific_days: creator.specific_days || [],
      notes: creator.notes || '',
      color: creator.color || '#8B5CF6',
      category_id: creator.category_id || ''
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.username.trim()) return;
    
    const cleanUsername = formData.username.replace('@', '').trim();
    const dataToSave = { ...formData, username: cleanUsername };

    if (editingCreator) {
      updateCreatorMutation.mutate({ id: editingCreator.id, ...dataToSave });
    } else {
      createCreatorMutation.mutate(dataToSave);
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      specific_days: prev.specific_days.includes(day)
        ? prev.specific_days.filter(d => d !== day)
        : [...prev.specific_days, day]
    }));
  };

  const openTikTok = (username) => {
    window.open(`https://tiktok.com/@${username}`, '_blank');
  };

  const getFrequencyLabel = (creator) => {
    if (creator.engagement_frequency === 'daily') return 'Daily';
    if (creator.engagement_frequency === 'weekly') return 'Weekly';
    if (creator.specific_days?.length) {
      return creator.specific_days.map(d => d.slice(0, 3)).join(', ');
    }
    return 'Multiple/Week';
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : null;
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentDayName = getDayName(new Date());

  const creatorsToShow = creators.filter(creator => {
    if (viewMode === 'all') return true;
    if (justEngaged[creator.id]) return false;

    const lastEngagedToday = creator.last_engaged_date === today;
    if (lastEngagedToday) return false;

    if (creator.engagement_frequency === 'daily') return true;

    if (creator.engagement_frequency === 'weekly') {
      if (!creator.last_engaged_date) return true;
      const lastEngagedDate = parseISO(creator.last_engaged_date);
      const oneWeekAgo = addDays(new Date(), -7);
      return isPast(lastEngagedDate) && lastEngagedDate <= oneWeekAgo;
    }

    if (creator.engagement_frequency === 'multiple_per_week') {
      return creator.specific_days?.includes(currentDayName);
    }

    return true;
  });

  const CreatorCard = ({ creator, index }) => {
    const isEngaged = justEngaged[creator.id];
    const categoryName = getCategoryName(creator.category_id);

    return (
      <motion.div
        key={creator.id}
        initial={{ opacity: 0, y: 20 }}
        animate={isEngaged ? { opacity: 0, scale: 0.8, y: -20 } : { opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ delay: isEngaged ? 0 : index * 0.05, duration: isEngaged ? 0.5 : 0.3 }}
      >
        <Card 
          className="hover:shadow-lg transition-shadow overflow-hidden"
          style={{ borderTop: `4px solid ${creator.color || '#8B5CF6'}` }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">@{creator.username}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-500">{getFrequencyLabel(creator)}</p>
                  {categoryName && (
                    <Badge variant="outline" className="text-xs" style={{ borderColor: creator.color }}>
                      {categoryName}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEditModal(creator)} className="text-gray-400 hover:text-blue-500">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteCreatorMutation.mutate(creator.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {creator.last_engaged_date && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Last: {format(new Date(creator.last_engaged_date), 'MMM d, yyyy')}</span>
                </div>
                {creator.engagement_history?.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{creator.engagement_history.length} total</Badge>
                )}
              </div>
            )}
            
            {creator.notes && <p className="text-sm text-gray-600 italic">{creator.notes}</p>}

            {creator.engagement_history?.length > 0 && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedHistory(prev => ({ ...prev, [creator.id]: !prev[creator.id] }))}
                  className="w-full justify-start text-xs text-gray-600"
                >
                  <History className="w-3 h-3 mr-2" />
                  {expandedHistory[creator.id] ? 'Hide' : 'Show'} Engagement Log
                </Button>
                
                {expandedHistory[creator.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="max-h-32 overflow-y-auto space-y-1 pl-2 border-l-2 border-purple-200"
                  >
                    {[...creator.engagement_history].reverse().map((timestamp, idx) => (
                      <p key={idx} className="text-xs text-gray-500">✓ {format(new Date(timestamp), 'MMM d, yyyy h:mm a')}</p>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={() => openTikTok(creator.username)} className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Profile
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => markEngagedMutation.mutate({ id: creator.id, currentHistory: creator.engagement_history })}
                className={`transition-all duration-300 ${isEngaged ? 'bg-green-500 border-green-500' : 'border-green-300 hover:bg-green-50'}`}
                title="Mark as engaged"
              >
                <Check className={`w-4 h-4 ${isEngaged ? 'text-white' : 'text-green-600'}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">TikTok Engagement Tracker</h1>
            <p className="text-gray-600 mt-1">Manage creators you want to engage with regularly</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
              <FolderPlus className="w-4 h-4 mr-2" />
              Categories
            </Button>
            <Button onClick={openAddModal} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Creator
            </Button>
          </div>
        </div>

        {/* Engagement Guide */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">How to Properly Engage</h3>
                <p className="text-sm text-gray-600">Learn the best practices for meaningful engagement</p>
              </div>
              <Button variant="outline" onClick={() => window.open('https://www.tiktok.com/@pixelnutscreative/video/7568313920054627598', '_blank')} className="border-blue-300 hover:bg-blue-100">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Guide
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today">Due Today ({creatorsToShow.length})</TabsTrigger>
            <TabsTrigger value="all">View All ({creators.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4">
            <AnimatePresence>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creatorsToShow.length === 0 ? (
                  <Card className="col-span-full p-12 text-center">
                    <p className="text-gray-500 mb-4">🎉 No creators due today. Great job!</p>
                    <Button onClick={() => setViewMode('all')} variant="outline">View All Creators</Button>
                  </Card>
                ) : (
                  creatorsToShow.map((creator, index) => <CreatorCard key={creator.id} creator={creator} index={index} />)
                )}
              </div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creators.length === 0 ? (
                <Card className="col-span-full p-12 text-center">
                  <p className="text-gray-500 mb-4">No creators added yet</p>
                  <Button onClick={openAddModal} variant="outline"><Plus className="w-4 h-4 mr-2" />Add Your First Creator</Button>
                </Card>
              ) : (
                creators.map((creator, index) => <CreatorCard key={creator.id} creator={creator} index={index} />)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Creator Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCreator ? 'Edit Creator' : 'Add TikTok Creator'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>TikTok Username</Label>
              <Input placeholder="@username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Engagement Frequency</Label>
              <Select value={formData.engagement_frequency} onValueChange={(value) => setFormData({ ...formData, engagement_frequency: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="multiple_per_week">Multiple Days Per Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.engagement_frequency === 'multiple_per_week' && (
              <div className="space-y-2">
                <Label>Select Days</Label>
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map(day => (
                    <div
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`p-2 rounded-lg border-2 cursor-pointer text-sm ${formData.specific_days.includes(day) ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox checked={formData.specific_days.includes(day)} />
                        <span>{day}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger><SelectValue placeholder="Select category (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No Category</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(color => (
                  <div
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea placeholder="Why you want to engage with this creator..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.username.trim()} className="bg-purple-600 hover:bg-purple-700">
              {editingCreator ? 'Save Changes' : 'Add Creator'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Category Name</Label>
              <Input placeholder="e.g., Battle Buddies, Supporters" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(color => (
                  <div
                    key={color}
                    onClick={() => setNewCategoryColor(color)}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-all ${newCategoryColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <Button onClick={() => createCategoryMutation.mutate({ name: newCategoryName, color: newCategoryColor })} disabled={!newCategoryName.trim()} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>

            {categories.length > 0 && (
              <div className="pt-4 border-t space-y-2">
                <Label>Existing Categories</Label>
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteCategoryMutation.mutate(cat.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}