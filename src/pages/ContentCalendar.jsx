import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Video, FileText, MessageSquare, Trash2, Edit, Share2, Clock, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const typeConfig = {
  post: { label: 'Post', icon: FileText, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  live: { label: 'Live', icon: Video, color: 'bg-pink-100 text-pink-700 border-pink-300' },
  engagement: { label: 'Engagement', icon: MessageSquare, color: 'bg-teal-100 text-teal-700 border-teal-300' }
};

export default function ContentCalendar() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    type: 'live',
    title: '',
    day_of_week: 'Monday',
    time: '12:00',
    is_recurring: true,
    audience: 'all_ages',
    share_to_directory: false,
    notes: ''
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['contentCalendarItems', effectiveEmail],
    queryFn: () => base44.entities.ContentCalendarItem.filter({ created_by: effectiveEmail }),
    enabled: !!effectiveEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentCalendarItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentCalendarItems'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContentCalendarItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentCalendarItems'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContentCalendarItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contentCalendarItems'] }),
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ id, date, currentDates }) => {
      const newDates = currentDates.includes(date)
        ? currentDates.filter(d => d !== date)
        : [...currentDates, date];
      return base44.entities.ContentCalendarItem.update(id, { completed_dates: newDates });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contentCalendarItems'] }),
  });

  const openAddModal = (type = 'live') => {
    setEditingItem(null);
    setFormData({
      type,
      title: '',
      day_of_week: 'Monday',
      time: '12:00',
      is_recurring: true,
      audience: 'all_ages',
      share_to_directory: false,
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      title: item.title || '',
      day_of_week: item.day_of_week,
      time: item.time,
      is_recurring: item.is_recurring !== false,
      audience: item.audience || 'all_ages',
      share_to_directory: item.share_to_directory || false,
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  // Group items by day
  const itemsByDay = DAYS.reduce((acc, day) => {
    acc[day] = items.filter(item => item.day_of_week === day);
    return acc;
  }, {});

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Content Calendar</h1>
            <p className="text-gray-600">Schedule your posts, lives, and engagement</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => openAddModal('post')} variant="outline" className="border-purple-300 text-purple-700">
              <FileText className="w-4 h-4 mr-2" /> Add Post
            </Button>
            <Button onClick={() => openAddModal('live')} variant="outline" className="border-pink-300 text-pink-700">
              <Video className="w-4 h-4 mr-2" /> Add Live
            </Button>
            <Button onClick={() => openAddModal('engagement')} variant="outline" className="border-teal-300 text-teal-700">
              <MessageSquare className="w-4 h-4 mr-2" /> Add Engagement
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {DAYS.map(day => (
            <Card key={day} className="min-h-[200px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600">{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {itemsByDay[day].sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(item => {
                  const config = typeConfig[item.type];
                  const Icon = config.icon;
                  const isCompletedToday = (item.completed_dates || []).includes(today);

                  return (
                    <div
                      key={item.id}
                      className={`p-2 rounded-lg border-2 ${config.color} ${isCompletedToday ? 'opacity-60' : ''} cursor-pointer hover:shadow-md transition-all`}
                      onClick={() => openEditModal(item)}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          <span className="text-xs font-medium">{formatTime(item.time)}</span>
                        </div>
                        {item.share_to_directory && (
                          <Share2 className="w-3 h-3 text-blue-500" />
                        )}
                      </div>
                      {item.title && (
                        <p className={`text-xs mt-1 font-medium ${isCompletedToday ? 'line-through' : ''}`}>
                          {item.title}
                        </p>
                      )}
                      {item.type === 'live' && item.audience === '18+' && (
                        <span className="text-[10px] text-red-600">18+</span>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompleteMutation.mutate({
                              id: item.id,
                              date: today,
                              currentDates: item.completed_dates || []
                            });
                          }}
                          className={`p-1 rounded ${isCompletedToday ? 'bg-green-500 text-white' : 'bg-white/50 hover:bg-white'}`}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this item?')) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          className="p-1 hover:bg-red-100 rounded text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {itemsByDay[day].length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No items</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>{items.filter(i => i.type === 'post').length} Posts</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-pink-600" />
                <span>{items.filter(i => i.type === 'live').length} Lives</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <span>{items.filter(i => i.type === 'engagement').length} Engagement</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Share2 className="w-4 h-4 text-blue-600" />
                <span>{items.filter(i => i.share_to_directory).length} shared to directory</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">📱 Post</SelectItem>
                  <SelectItem value="live">🔴 Live</SelectItem>
                  <SelectItem value="engagement">💬 Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title / Description</Label>
              <Input
                placeholder="e.g., Studio Sunday, Gift Gallery Party..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day</Label>
                <Select value={formData.day_of_week} onValueChange={(v) => setFormData({ ...formData, day_of_week: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            {formData.type === 'live' && (
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={formData.audience} onValueChange={(v) => setFormData({ ...formData, audience: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_ages">All Ages</SelectItem>
                    <SelectItem value="18+">18+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3 pt-2 border-t">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                />
                <span className="text-sm">🔄 Recurring weekly</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={formData.share_to_directory}
                  onCheckedChange={(checked) => setFormData({ ...formData, share_to_directory: checked })}
                />
                <div>
                  <span className="text-sm font-medium">📢 Share to Discover Creators</span>
                  <p className="text-xs text-gray-500">Others can see this in the creator directory</p>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}