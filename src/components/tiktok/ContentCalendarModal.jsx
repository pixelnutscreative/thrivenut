import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Video, FileText, MessageSquare, Trash2, Clock, Loader2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const typeConfig = {
  post: { label: 'Content Creation', icon: FileText, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  schedule: { label: 'Schedule Posts', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-300' },
  live: { label: 'Live', icon: Video, color: 'bg-pink-100 text-pink-700 border-pink-300' },
  engagement: { label: 'Engagement', icon: MessageSquare, color: 'bg-teal-100 text-teal-700 border-teal-300' }
};

export default function ContentCalendarModal({ isOpen, onClose, effectiveEmail }) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'live',
    title: '',
    day_of_week: 'Monday',
    time: '12:00',
    is_recurring: true,
    audience: 'all_ages',
    share_to_directory: false
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['contentCalendarItems', effectiveEmail],
    queryFn: () => base44.entities.ContentCalendarItem.filter({ created_by: effectiveEmail }),
    enabled: !!effectiveEmail && isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentCalendarItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentCalendarItems'] });
      setShowAddForm(false);
      setFormData({ type: 'live', title: '', day_of_week: 'Monday', time: '12:00', is_recurring: true, audience: 'all_ages', share_to_directory: false });
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

  const today = format(new Date(), 'yyyy-MM-dd');

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const itemsByDay = DAYS.reduce((acc, day) => {
    acc[day] = items.filter(item => item.day_of_week === day).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return acc;
  }, {});

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>My Content Calendar</span>
            <Button
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Add Form */}
        {showAddForm && (
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">📱 Content</SelectItem>
                      <SelectItem value="schedule">📅 Schedule</SelectItem>
                      <SelectItem value="live">🔴 Live</SelectItem>
                      <SelectItem value="engagement">💬 Engagement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Day</Label>
                  <Select value={formData.day_of_week} onValueChange={(v) => setFormData({ ...formData, day_of_week: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Time</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    placeholder="Optional title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={formData.is_recurring}
                    onCheckedChange={(c) => setFormData({ ...formData, is_recurring: c })}
                  />
                  🔄 Recurring
                </label>
                {formData.type === 'live' && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={formData.share_to_directory}
                      onCheckedChange={(c) => setFormData({ ...formData, share_to_directory: c })}
                    />
                    📢 Share to Directory
                  </label>
                )}
                <div className="ml-auto flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => createMutation.mutate(formData)}
                    disabled={createMutation.isPending}
                    className="bg-purple-600"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {DAYS.map(day => (
              <Card key={day} className="min-h-[150px]">
                <CardHeader className="py-2 px-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <CardTitle className="text-xs font-semibold">{day}</CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1">
                  {itemsByDay[day].length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">No items</p>
                  ) : (
                    itemsByDay[day].map(item => {
                      const config = typeConfig[item.type];
                      const Icon = config.icon;
                      const isCompletedToday = (item.completed_dates || []).includes(today);

                      return (
                        <div
                          key={item.id}
                          className={`p-1.5 rounded border ${config.color} ${isCompletedToday ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center gap-1 text-xs">
                            <Icon className="w-3 h-3" />
                            <span className="font-medium">{formatTime(item.time)}</span>
                          </div>
                          {item.title && (
                            <p className={`text-xs truncate ${isCompletedToday ? 'line-through' : ''}`}>
                              {item.title}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <button
                              onClick={() => toggleCompleteMutation.mutate({
                                id: item.id,
                                date: today,
                                currentDates: item.completed_dates || []
                              })}
                              className={`p-0.5 rounded ${isCompletedToday ? 'bg-green-500 text-white' : 'bg-white/50 hover:bg-white'}`}
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(item.id); }}
                              className="p-0.5 hover:bg-red-100 rounded text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600 pt-2 border-t">
          <span className="flex items-center gap-1"><FileText className="w-4 h-4 text-purple-600" /> {items.filter(i => i.type === 'post').length} Content</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-amber-600" /> {items.filter(i => i.type === 'schedule').length} Scheduled</span>
          <span className="flex items-center gap-1"><Video className="w-4 h-4 text-pink-600" /> {items.filter(i => i.type === 'live').length} Lives</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4 text-teal-600" /> {items.filter(i => i.type === 'engagement').length} Engagement</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}