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
import { Plus, ExternalLink, Trash2, Video, Calendar as CalendarIcon, Heart, Swords, Zap, ShoppingBag, CalendarPlus, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import TimezoneSelector from '../components/shared/TimezoneSelector';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const liveTypeConfig = {
  regular: { label: 'Regular', icon: Video, color: 'bg-purple-100 text-purple-700' },
  pop_up: { label: 'Pop-Up', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
  battle: { label: 'Battle', icon: Swords, color: 'bg-red-100 text-red-700' },
  tt_shop: { label: 'TT Shop', icon: ShoppingBag, color: 'bg-green-100 text-green-700' },
  daily_heart_me: { label: 'Daily Heart Me', icon: Heart, color: 'bg-orange-100 text-orange-700' },
  engagement_live: { label: 'Engagement', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  multi_guest: { label: 'Multi-Guest', icon: Video, color: 'bg-blue-100 text-blue-700' },
  co_host: { label: 'Co-Host', icon: Video, color: 'bg-cyan-100 text-cyan-700' }
};

export default function LiveSchedule() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [user, setUser] = useState(null);
  const [userTimezone, setUserTimezone] = useState('America/New_York');
  const [formData, setFormData] = useState({
    host_username: '',
    recurring_days: [],
    time: '',
    creator_timezone: 'America/New_York',
    live_types: ['regular'],
    custom_type: '',
    priority: 5,
    is_recurring: true,
    specific_date: '',
    audience_restriction: 'all_ages',
    video_guide_url: '',
    notes: ''
  });

  // Fetch user and timezone preferences
  React.useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      const prefs = await base44.entities.UserPreferences.filter({ user_email: userData.email });
      if (prefs[0]?.user_timezone) {
        setUserTimezone(prefs[0].user_timezone);
      }
    };
    fetchUser();
  }, []);

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
      setEditingSchedule(null);
      resetForm();
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LiveSchedule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveSchedules'] });
      setShowModal(false);
      setEditingSchedule(null);
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
      creator_timezone: 'America/New_York',
      live_types: ['regular'],
      custom_type: '',
      priority: 5,
      is_recurring: true,
      specific_date: '',
      audience_restriction: 'all_ages',
      video_guide_url: '',
      notes: ''
    });
    setEditingSchedule(null);
  };

  const normalizeTime = (timeStr) => {
    if (!timeStr) return '';
    
    const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return timeStr;
    
    const hours = parseInt(timeParts[1]);
    const minutes = timeParts[2];
    const period = timeParts[3].toUpperCase();
    
    return `${hours}:${minutes} ${period}`;
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      host_username: schedule.host_username,
      recurring_days: schedule.recurring_days || [],
      time: schedule.time,
      creator_timezone: schedule.creator_timezone || 'America/New_York',
      live_types: schedule.live_types || ['regular'],
      custom_type: schedule.custom_type || '',
      priority: schedule.priority || 5,
      is_recurring: schedule.is_recurring,
      specific_date: schedule.specific_date || '',
      audience_restriction: schedule.audience_restriction || 'all_ages',
      video_guide_url: schedule.video_guide_url || '',
      notes: schedule.notes || ''
    });
    setShowModal(true);
  };

  // Convert time from creator timezone to user timezone
  const convertTime = (timeStr, fromTz, toTz) => {
    if (!timeStr) return '';
    
    try {
      const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeParts) return timeStr;
      
      let hours = parseInt(timeParts[1]);
      const minutes = parseInt(timeParts[2]);
      const period = timeParts[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      // Create a date object in the creator's timezone
      const date = new Date();
      const isoString = `${date.toISOString().split('T')[0]}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      
      const creatorTime = new Date(isoString + 'Z');
      
      // Get offset differences
      const creatorOffset = getTimezoneOffset(fromTz);
      const userOffset = getTimezoneOffset(toTz);
      const offsetDiff = userOffset - creatorOffset;
      
      const convertedTime = new Date(creatorTime.getTime() + offsetDiff * 60000);
      
      let convertedHours = convertedTime.getUTCHours();
      const convertedMinutes = convertedTime.getUTCMinutes();
      const convertedPeriod = convertedHours >= 12 ? 'PM' : 'AM';
      
      if (convertedHours === 0) convertedHours = 12;
      else if (convertedHours > 12) convertedHours -= 12;
      
      return `${convertedHours}:${convertedMinutes.toString().padStart(2, '0')} ${convertedPeriod}`;
    } catch (e) {
      return timeStr;
    }
  };

  const getTimezoneOffset = (tz) => {
    try {
      const date = new Date();
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
      return (tzDate.getTime() - utcDate.getTime()) / 60000;
    } catch (e) {
      return 0;
    }
  };

  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return '';
    
    const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return '';
    
    let hours = parseInt(timeParts[1]);
    const minutes = timeParts[2];
    const period = timeParts[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleSubmit = () => {
    if (!formData.host_username.trim()) return;
    
    const cleanUsername = formData.host_username.replace('@', '').trim();
    const normalizedData = {
      ...formData,
      host_username: cleanUsername,
      time: normalizeTime(formData.time)
    };
    
    if (editingSchedule) {
      updateScheduleMutation.mutate({ id: editingSchedule.id, data: normalizedData });
    } else {
      createScheduleMutation.mutate(normalizedData);
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      recurring_days: prev.recurring_days.includes(day)
        ? prev.recurring_days.filter(d => d !== day)
        : [...prev.recurring_days, day]
    }));
  };

  const toggleLiveType = (type) => {
    setFormData(prev => ({
      ...prev,
      live_types: prev.live_types.includes(type)
        ? prev.live_types.filter(t => t !== type)
        : [...prev.live_types, type]
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
    
    const liveTypes = schedule.live_types || [schedule.live_type] || ['regular'];
    const liveTypeLabel = liveTypes.map(type => liveTypeConfig[type]?.label).filter(Boolean).join(' + ') || 'Live';
    
    // Build recurrence rule if recurring
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ThriveNut//Live Schedule//EN',
      'BEGIN:VEVENT',
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `SUMMARY:${liveTypeLabel}: @${schedule.host_username} TikTok Live`,
      `DESCRIPTION:${schedule.notes || `Watch @${schedule.host_username}'s ${liveTypeLabel} on TikTok`}\\nhttps://tiktok.com/@${schedule.host_username}`,
      `UID:${schedule.id}@thrivenut.app`
    ];
    
    // Add recurrence rule for weekly recurring events
    if (schedule.is_recurring && schedule.recurring_days && schedule.recurring_days.length > 0) {
      const dayMap = {
        'Monday': 'MO',
        'Tuesday': 'TU',
        'Wednesday': 'WE',
        'Thursday': 'TH',
        'Friday': 'FR',
        'Saturday': 'SA',
        'Sunday': 'SU'
      };
      const byDay = schedule.recurring_days.map(day => dayMap[day]).join(',');
      icsLines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`);
    }
    
    icsLines.push('END:VEVENT');
    icsLines.push('END:VCALENDAR');
    
    const icsContent = icsLines.join('\r\n');
    
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
            <h1 className="text-3xl font-bold text-gray-800">Creator Calendar</h1>
            <p className="text-gray-600 mt-1">Track all your favorite TikTok creators' live schedules</p>
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
                        const liveTypes = schedule.live_types || [schedule.live_type] || ['regular'];
                        const hasHeartMe = liveTypes.includes('daily_heart_me');
                        
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
                                  {hasHeartMe && (
                                    <Heart className="w-4 h-4 flex-shrink-0 text-orange-500" />
                                  )}
                                  <span 
                                    className="font-semibold text-sm cursor-pointer hover:text-purple-600 truncate"
                                    onClick={() => openTikTok(schedule.host_username)}
                                  >
                                    @{schedule.host_username}
                                  </span>
                                </div>
                                
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {liveTypes.filter(t => t !== 'regular').map(type => {
                                    const typeConfig = liveTypeConfig[type];
                                    if (!typeConfig) return null;
                                    return (
                                      <Badge key={type} className={`text-xs ${typeConfig.color}`}>
                                        {typeConfig.label}
                                      </Badge>
                                    );
                                  })}
                                  {schedule.custom_type && (
                                    <Badge className="text-xs bg-gray-100 text-gray-700">
                                      {schedule.custom_type}
                                    </Badge>
                                  )}
                                </div>
                                
                                {schedule.time && (
                                  <p className="text-xs text-gray-600 ml-6">
                                    {convertTime(schedule.time, schedule.creator_timezone || 'America/New_York', userTimezone)}
                                  </p>
                                )}
                                {schedule.notes && (
                                  <p className="text-xs text-gray-500 italic mt-1 ml-6">{schedule.notes}</p>
                                )}
                                
                                <div className="flex gap-1 mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={() => handleEdit(schedule)}
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
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
                const liveTypes = schedule.live_types || [schedule.live_type] || ['regular'];
                const hasHeartMe = liveTypes.includes('daily_heart_me');
                
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
                              {hasHeartMe && (
                                <Heart className="w-4 h-4 text-orange-500" />
                              )}
                              <span 
                                className="font-semibold cursor-pointer hover:text-purple-600"
                                onClick={() => openTikTok(schedule.host_username)}
                              >
                                @{schedule.host_username}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mb-2">
                              {liveTypes.filter(t => t !== 'regular').map(type => {
                                const typeConfig = liveTypeConfig[type];
                                if (!typeConfig) return null;
                                return (
                                  <Badge key={type} className={`text-xs ${typeConfig.color}`}>
                                    {typeConfig.label}
                                  </Badge>
                                );
                              })}
                              {schedule.custom_type && (
                                <Badge className="text-xs bg-gray-100 text-gray-700">
                                  {schedule.custom_type}
                                </Badge>
                              )}
                            </div>
                            
                            {schedule.specific_date && (
                              <p className="text-sm text-gray-600">{schedule.specific_date}</p>
                            )}
                            {schedule.time && (
                              <p className="text-sm text-gray-600">
                                {convertTime(schedule.time, schedule.creator_timezone || 'America/New_York', userTimezone)}
                              </p>
                            )}
                            {schedule.notes && (
                              <p className="text-sm text-gray-500 italic mt-2">{schedule.notes}</p>
                            )}
                            
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(schedule)}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
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

      {/* Add/Edit Live Modal */}
      <Dialog open={showModal} onOpenChange={(open) => {
        setShowModal(open);
        if (!open) {
          setEditingSchedule(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Edit Live Schedule' : 'Add Live Schedule'}</DialogTitle>
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
              <Label>Live Types (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {Object.entries(liveTypeConfig).map(([key, config]) => (
                  <div
                    key={key}
                    onClick={() => toggleLiveType(key)}
                    className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                      formData.live_types.includes(key)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={formData.live_types.includes(key)} />
                      <span>{config.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customType">Custom Type (Optional)</Label>
              <Input
                id="customType"
                placeholder="e.g., Collab, Giveaway, etc."
                value={formData.custom_type}
                onChange={(e) => setFormData({ ...formData, custom_type: e.target.value })}
              />
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
                type="time"
                value={formData.time ? convertTo24Hour(formData.time) : ''}
                onChange={(e) => {
                  const time24 = e.target.value;
                  if (time24) {
                    const [hours, minutes] = time24.split(':');
                    let hour = parseInt(hours);
                    const period = hour >= 12 ? 'PM' : 'AM';
                    if (hour > 12) hour -= 12;
                    if (hour === 0) hour = 12;
                    setFormData({ ...formData, time: `${hour}:${minutes} ${period}` });
                  }
                }}
              />
              <p className="text-xs text-gray-500">Select time for the live stream</p>
            </div>

            <TimezoneSelector
              label="Creator's Timezone"
              value={formData.creator_timezone}
              onChange={(value) => setFormData({ ...formData, creator_timezone: value })}
            />

            <div className="space-y-2">
              <Label>Audience Restriction</Label>
              <Select
                value={formData.audience_restriction}
                onValueChange={(value) => setFormData({ ...formData, audience_restriction: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_ages">All Ages</SelectItem>
                  <SelectItem value="18+">18+ Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Important for battles and co-hosting. Both accounts must match restrictions.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_guide">Educational Video URL (Optional)</Label>
              <Input
                id="video_guide"
                placeholder="https://..."
                value={formData.video_guide_url}
                onChange={(e) => setFormData({ ...formData, video_guide_url: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Link to a guide explaining live types and audience restrictions
              </p>
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
              disabled={!formData.host_username.trim() || createScheduleMutation.isPending || updateScheduleMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {editingSchedule ? 'Update Schedule' : 'Add to Calendar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}