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
import { Plus, ExternalLink, Trash2, Video, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function LiveSchedule() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    host_username: '',
    day_of_week: 'Monday',
    time: '',
    is_recurring: true,
    specific_date: '',
    notes: ''
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['liveSchedules'],
    queryFn: () => base44.entities.LiveSchedule.list('-created_date'),
    initialData: [],
  });

  const createScheduleMutation = useMutation({
    mutationFn: (data) => base44.entities.LiveSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveSchedules'] });
      setShowModal(false);
      resetForm();
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id) => base44.entities.LiveSchedule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveSchedules'] });
    },
  });

  const resetForm = () => {
    setFormData({
      host_username: '',
      day_of_week: 'Monday',
      time: '',
      is_recurring: true,
      specific_date: '',
      notes: ''
    });
  };

  const handleSubmit = () => {
    if (!formData.host_username.trim()) return;
    
    const cleanUsername = formData.host_username.replace('@', '').trim();
    createScheduleMutation.mutate({
      ...formData,
      host_username: cleanUsername
    });
  };

  const openTikTok = (username) => {
    window.open(`https://tiktok.com/@${username}`, '_blank');
  };

  // Group schedules by day
  const schedulesByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = schedules.filter(s => s.day_of_week === day && s.is_recurring)
      .sort((a, b) => {
        const timeA = a.time || '';
        const timeB = b.time || '';
        return timeA.localeCompare(timeB);
      });
    return acc;
  }, {});

  // One-time lives
  const oneTimeLives = schedules.filter(s => !s.is_recurring);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Live Schedule Calendar</h1>
            <p className="text-gray-600 mt-1">Never miss your favorite TikTok lives</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Live
          </Button>
        </div>

        {/* Weekly Schedule */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Weekly Schedule
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {daysOfWeek.map((day, dayIndex) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.05 }}
              >
                <Card className="h-full">
                  <CardHeader className="pb-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <CardTitle className="text-lg">{day}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2">
                    {schedulesByDay[day].length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No lives scheduled</p>
                    ) : (
                      schedulesByDay[day].map((schedule) => (
                        <div
                          key={schedule.id}
                          className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                <span 
                                  className="font-semibold text-sm cursor-pointer hover:text-purple-600 truncate"
                                  onClick={() => openTikTok(schedule.host_username)}
                                >
                                  @{schedule.host_username}
                                </span>
                              </div>
                              {schedule.time && (
                                <p className="text-xs text-gray-600 mt-1 ml-6">{schedule.time}</p>
                              )}
                              {schedule.notes && (
                                <p className="text-xs text-gray-500 italic mt-1 ml-6 truncate">{schedule.notes}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                            >
                              <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* One-Time Lives */}
        {oneTimeLives.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Upcoming One-Time Lives</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {oneTimeLives.map((schedule, index) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="w-4 h-4 text-pink-600" />
                            <span 
                              className="font-semibold cursor-pointer hover:text-purple-600"
                              onClick={() => openTikTok(schedule.host_username)}
                            >
                              @{schedule.host_username}
                            </span>
                          </div>
                          {schedule.specific_date && (
                            <p className="text-sm text-gray-600">{schedule.specific_date}</p>
                          )}
                          {schedule.time && (
                            <p className="text-sm text-gray-600">{schedule.time}</p>
                          )}
                          {schedule.notes && (
                            <p className="text-sm text-gray-500 italic mt-2">{schedule.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Live Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Live Schedule</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="host">Host Username</Label>
              <Input
                id="host"
                placeholder="@username or username"
                value={formData.host_username}
                onChange={(e) => setFormData({ ...formData, host_username: e.target.value })}
              />
            </div>

            <div 
              onClick={() => setFormData({ ...formData, is_recurring: !formData.is_recurring })}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <Checkbox checked={formData.is_recurring} />
              <div>
                <p className="font-medium">Recurring Weekly</p>
                <p className="text-xs text-gray-500">Same day/time every week</p>
              </div>
            </div>

            {formData.is_recurring ? (
              <div className="space-y-2">
                <Label htmlFor="day">Day of Week</Label>
                <Select
                  value={formData.day_of_week}
                  onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="date">Specific Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.specific_date}
                  onChange={(e) => setFormData({ ...formData, specific_date: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                placeholder="e.g., 7:00 PM, 10:30 AM"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Shop live, Q&A, etc..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.host_username.trim() || createScheduleMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Add to Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}