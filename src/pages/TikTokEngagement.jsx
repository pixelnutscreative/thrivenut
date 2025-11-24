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
import { Plus, ExternalLink, Trash2, Check, Calendar, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TikTokEngagement() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    engagement_frequency: 'weekly',
    specific_days: [],
    notes: ''
  });

  const { data: creators = [] } = useQuery({
    queryKey: ['tiktokCreators'],
    queryFn: () => base44.entities.TikTokCreator.list('-created_date'),
    initialData: [],
  });

  const createCreatorMutation = useMutation({
    mutationFn: (data) => base44.entities.TikTokCreator.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokCreators'] });
      setShowModal(false);
      resetForm();
    },
  });

  const deleteCreatorMutation = useMutation({
    mutationFn: (id) => base44.entities.TikTokCreator.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokCreators'] });
    },
  });

  const markEngagedMutation = useMutation({
    mutationFn: (id) => base44.entities.TikTokCreator.update(id, {
      last_engaged_date: format(new Date(), 'yyyy-MM-dd')
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokCreators'] });
    },
  });

  const resetForm = () => {
    setFormData({
      username: '',
      engagement_frequency: 'weekly',
      specific_days: [],
      notes: ''
    });
  };

  const handleSubmit = () => {
    if (!formData.username.trim()) return;
    
    const cleanUsername = formData.username.replace('@', '').trim();
    createCreatorMutation.mutate({
      ...formData,
      username: cleanUsername
    });
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
      return creator.specific_days.join(', ');
    }
    return 'Multiple/Week';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">TikTok Engagement Tracker</h1>
            <p className="text-gray-600 mt-1">Manage creators you want to engage with regularly</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Creator
          </Button>
        </div>

        {/* Engagement Guide Link */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">How to Properly Engage</h3>
                <p className="text-sm text-gray-600">Learn the best practices for meaningful engagement</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.open('[ENGAGEMENT_GUIDE_URL]', '_blank')}
                className="border-blue-300 hover:bg-blue-100"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Guide
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Creators Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">@{creator.username}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{getFrequencyLabel(creator)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCreatorMutation.mutate(creator.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {creator.last_engaged_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Last: {format(new Date(creator.last_engaged_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  
                  {creator.notes && (
                    <p className="text-sm text-gray-600 italic">{creator.notes}</p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => openTikTok(creator.username)}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => markEngagedMutation.mutate(creator.id)}
                      className="border-green-300 hover:bg-green-50"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {creators.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500 mb-4">No creators added yet</p>
            <Button onClick={() => setShowModal(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Creator
            </Button>
          </Card>
        )}
      </div>

      {/* Add Creator Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add TikTok Creator</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">TikTok Username</Label>
              <Input
                id="username"
                placeholder="@username or username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Engagement Frequency</Label>
              <Select
                value={formData.engagement_frequency}
                onValueChange={(value) => setFormData({ ...formData, engagement_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                      className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                        formData.specific_days.includes(day)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
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
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Why you want to engage with this creator..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.username.trim() || createCreatorMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Add Creator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}