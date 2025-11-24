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
import { Badge } from '@/components/ui/badge';
import { Plus, ExternalLink, Trash2, Video, Calendar as CalendarIcon, Heart, Swords, Zap, ShoppingBag, CalendarPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const liveTypeConfig = {
  regular: { label: 'Regular', icon: Video, color: 'bg-purple-100 text-purple-700' },
  pop_up: { label: 'Pop-Up', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
  battle: { label: 'Battle', icon: Swords, color: 'bg-red-100 text-red-700' },
  tt_shop: { label: 'TT Shop', icon: ShoppingBag, color: 'bg-green-100 text-green-700' },
  daily_heart_me: { label: 'Daily Heart Me', icon: Heart, color: 'bg-orange-100 text-orange-700' }
};

export default function LiveSchedule() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    host_username: '',
    recurring_days: [],
    time: '',
    live_type: 'regular',
    priority: 5,
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
    onSuccess: (newSchedule) => {
      queryClient.invalidateQueries({ queryKey: ['liveSchedules'] });
      
      // Prompt to add to device calendar
      if (window.confirm('Would you like to add this to your device calendar?')) {
        generateCalendarFile(newSchedule);
      }
      
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
      recurring_days: [],
      time: '',
      live_type: 'regular',
      priority: 5,
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

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      recurring_days: prev.recurring_days.includes(day)
        ? prev.recurring_days.filter(d => d !== day)
        : [...prev.recurring_days, day]
    }));
  };

  const openTikTok = (username) => {
    window.open(`https://tiktok.com/@${username}`, '_blank');
  };

  const generateCalendarFile = (schedule) => {
    const startDate = schedule.specific_date || new Date().toISOString().split('T')[0];
    const timeStr = schedule.time || '12:00 PM';
    
    // Parse time
    const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let hours = 12;
    let minutes = 0;
    
    if (timeParts) {
      hours = parseInt(timeParts[1]);
      minutes = parseInt(timeParts[2]);
      if (timeParts[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (timeParts[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    
    const startDateTime = `${startDate.replace(/-/g, '')}T${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}00`;
    const endDateTime = `${startDate.replace(/-/g, '')}T${(hours + 1).toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}00`;
    
    const liveTypeLabel = liveTypeConfig[schedule.live_type]?.label || 'Live';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ThriveNut//Live Schedule//EN',
      'BEGIN:VEVENT',
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `SUMMARY:${liveTypeLabel}: @${schedule.host_username} TikTok Live`,
      `DESCRIPTION:${schedule.notes || `Watch @${schedule.host_username}'s ${liveTypeLabel} on TikTok`}\\nhttps://tiktok.com/@${schedule.host_username}`,
      `UID:${schedule.id}@thrivenut.app`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tiktok-live-${schedule.host_username}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group schedules by day and sort by priority
  const schedulesByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = schedules
      .filter(s => s.is_recurring && s.recurring_days?.includes(day))
      .sort((a, b) => {
        // Sort by priority first (higher priority first), then by time
        if (b.priority !== a.priority) return b.priority - a.priority;
        const timeA = a.time || '';
        const timeB = b.time || '';
        return timeA.localeCompare(timeB);
      });
    return acc;
  }, {});

  // One-time lives, sorted by priority
  const oneTimeLives = schedules
    .filter(s => !s.is_recurring)
    .sort((a, b) => b.priority - a.priority);

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
                      schedulesByDay[day].map((schedule) => {
                        const typeConfig = liveTypeConfig[schedule.live_type] || liveTypeConfig.regular;
                        const TypeIcon = typeConfig.icon;
                        
                        return (
                          <div
                            key={schedule.id}
                            className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors relative"
                          >
                            {/* Priority indicator */}
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                              {schedule.priority}
                            </div>
                            
                            <div className="flex items-start gap-2 pr-8">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <TypeIcon 
                                    className={`w-4 h-4 flex-shrink-0 ${
                                      schedule.live_type === 'daily_heart_me' ? 'text-orange-500' : 'text-purple-600'
                                    }`} 
                                  />
                                  <span 
                                    className="font-semibold text-sm cursor-pointer hover:text-purple-600 truncate"
                                    onClick={() => openTikTok(schedule.host_username)}
                                  >
                                    @{schedule.host_username}
                                  </span>
                                </div>
                                
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {schedule.live_type !== 'regular' && (
                                    <Badge className={`text-xs ${typeConfig.color}`}>
                                      {typeConfig.label}
                                    </Badge>
                                  )}
                                </div>
                                
                                {schedule.time && (
                                  <p className="text-xs text-gray-600 ml-6">{schedule.time}</p>
                                )}
                                {schedule.notes && (
                                  <p className="text-xs text-gray-500 italic mt-1 ml-6">{schedule.notes}</p>
                                )}
                                
                                <div className="flex gap-1 mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={() => generateCalendarFile(schedule)}
                                  >
                                    <CalendarPlus className="w-3 h-3 mr-1" />
                                    Add to Cal
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2 text-red-500 hover:text-red-700"
                                    onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
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
              {oneTimeLives.map((schedule, index) => {
                const typeConfig = liveTypeConfig[schedule.live_type] || liveTypeConfig.regular;
                const TypeIcon = typeConfig.icon;
                
                return (
                  <motion.div
                    key={schedule.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="relative">
                      <CardContent className="p-4">
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center">
                          {schedule.priority}
                        </div>
                        
                        <div className="flex items-start pr-10">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <TypeIcon 
                                className={`w-4 h-4 ${
                                  schedule.live_type === 'daily_heart_me' ? 'text-orange-500' : 'text-pink-600'
                                }`} 
                              />
                              <span 
                                className="font-semibold cursor-pointer hover:text-purple-600"
                                onClick={() => openTikTok(schedule.host_username)}
                              >
                                @{schedule.host_username}
                              </span>
                            </div>
                            
                            {schedule.live_type !== 'regular' && (
                              <Badge className={`text-xs mb-2 ${typeConfig.color}`}>
                                {typeConfig.label}
                              </Badge>
                            )}
                            
                            {schedule.specific_date && (
                              <p className="text-sm text-gray-600">{schedule.specific_date}</p>
                            )}
                            {schedule.time && (
                              <p className="text-sm text-gray-600">{schedule.time}</p>
                            )}
                            {schedule.notes && (
                              <p className="text-sm text-gray-500 italic mt-2">{schedule.notes}</p>
                            )}
                            
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateCalendarFile(schedule)}
                              >
                                <CalendarPlus className="w-3 h-3 mr-1" />
                                Add to Calendar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Live Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-2">
              <Label htmlFor="liveType">Live Type</Label>
              <Select
                value={formData.live_type}
                onValueChange={(value) => setFormData({ ...formData, live_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Live</SelectItem>
                  <SelectItem value="pop_up">Pop-Up Live</SelectItem>
                  <SelectItem value="battle">Battle</SelectItem>
                  <SelectItem value="tt_shop">TT Shop Live</SelectItem>
                  <SelectItem value="daily_heart_me">Daily Heart Me 🧡</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority (1-10, 10 = highest)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
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
                <Label>Select Days</Label>
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map(day => (
                    <div
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                        formData.recurring_days.includes(day)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox checked={formData.recurring_days.includes(day)} />
                        <span>{day}</span>
                      </div>
                    </div>
                  ))}
                </div>
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