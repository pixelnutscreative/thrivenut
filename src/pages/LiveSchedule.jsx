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
import { Plus, Trash2, Video, Calendar as CalendarIcon, Heart, Swords, Popcorn, ShoppingBag, CalendarPlus, Edit, FileText, Users, GraduationCap, Handshake, LayoutGrid, Camera, UserPlus, CalendarDays, Eye, EyeOff, Copy, Sparkles, Moon, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import TimezoneSelector from '../components/shared/TimezoneSelector';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { useTheme } from '../components/shared/useTheme';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const liveTypeConfig = {
  regular: { label: 'Regular', icon: Camera, color: 'bg-blue-100 text-blue-700' },
  pop_up: { label: 'Pop Up', icon: Popcorn, color: 'bg-yellow-100 text-yellow-700' },
  battle: { label: 'Battle', icon: Swords, color: 'bg-red-100 text-red-700' },
  tt_shop: { label: 'Shop', icon: ShoppingBag, color: 'bg-green-100 text-green-700' },
  daily_heart_me: { label: 'Daily Heart', icon: Heart, color: 'bg-orange-100 text-orange-600' },
  engagement_live: { label: 'Engagement', icon: Handshake, color: 'bg-pink-100 text-pink-700' },
  multi_guest: { label: 'Multi Box', icon: LayoutGrid, color: 'bg-indigo-100 text-indigo-700' },
  co_host: { label: 'Co-Host', icon: Users, color: 'bg-cyan-100 text-cyan-700' },
  teaching: { label: 'Teaching', icon: GraduationCap, color: 'bg-purple-100 text-purple-700' }
};

// Special event types for one-time lives
const specialEventTypes = [
  { value: 'battle', label: 'Battle', icon: Swords },
  { value: 'escape_room', label: 'Escape Room', icon: Clock },
  { value: 'sleepover', label: 'Sleepover Party', icon: Moon },
  { value: '24_hour', label: '24 Hour Stream', icon: Clock },
  { value: 'co_host', label: 'Co-Host Session', icon: Users },
  { value: 'box_battle', label: 'Box Battle', icon: LayoutGrid },
  { value: 'special_appearance', label: 'Special Appearance', icon: Sparkles },
  { value: 'other', label: 'Other Special Event', icon: CalendarIcon }
];

export default function LiveSchedule() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [user, setUser] = useState(null);
  const [userTimezone, setUserTimezone] = useState('America/New_York');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [dayFilter, setDayFilter] = useState('today');
  const [selectedLiveTypes, setSelectedLiveTypes] = useState([]);
  const [showMyContent, setShowMyContent] = useState(true); // Default to showing user's content
  const [editingContentItem, setEditingContentItem] = useState(null);
  const [contentFormData, setContentFormData] = useState({
    type: 'live',
    title: '',
    day_of_week: 'Monday',
    time: '12:00',
    is_recurring: true,
    audience: 'all_ages',
    share_to_directory: false,
    specific_date: '',
    live_type: 'regular',
    special_event_type: ''
  });
  const [formData, setFormData] = useState({
    host_username: '',
    recurring_days: [],
    time: '',
    creator_timezone: 'America/New_York',
    live_types: ['regular'],
    custom_type: '',
    uses_tikfinity: false,
    uses_live_studio: false,
    priority: 1,
    is_recurring: true,
    specific_date: '',
    audience_restriction: 'all_ages',
    video_guide_url: '',
    notes: ''
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      const effectiveEmail = getEffectiveUserEmail(userData.email);
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail });
      if (prefs[0]?.user_timezone) {
        setUserTimezone(prefs[0].user_timezone);
      }
    };
    fetchUser();
  }, []);

  // Get effective email for data scoping
  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: schedules = [] } = useQuery({
    queryKey: ['liveSchedules', effectiveEmail],
    queryFn: () => base44.entities.LiveSchedule.filter({ created_by: effectiveEmail }, '-created_date'),
    enabled: !!effectiveEmail,
    initialData: [],
  });

  // Fetch contacts with calendar enabled
  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts', effectiveEmail],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: effectiveEmail }, '-created_date'),
    enabled: !!effectiveEmail,
  });

  const calendarContacts = contacts.filter(c => c.calendar_enabled);

  // Fetch my content calendar items - always fetch so we can show count
  const { data: myContentItems = [] } = useQuery({
    queryKey: ['contentCalendarItems', effectiveEmail],
    queryFn: () => base44.entities.ContentCalendarItem.filter({ created_by: effectiveEmail }),
    enabled: !!effectiveEmail,
  });

  const createContentMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentCalendarItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentCalendarItems'] });
      setEditingContentItem(null);
      setContentFormData({ type: 'live', title: '', day_of_week: 'Monday', time: '12:00', is_recurring: true, audience: 'all_ages', share_to_directory: false, specific_date: '' });
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContentCalendarItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentCalendarItems'] });
      setEditingContentItem(null);
      setContentFormData({ type: 'live', title: '', day_of_week: 'Monday', time: '12:00', is_recurring: true, audience: 'all_ages', share_to_directory: false, specific_date: '' });
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: (id) => base44.entities.ContentCalendarItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contentCalendarItems'] }),
  });

  const handleEditContent = (item) => {
    setEditingContentItem(item);
    setContentFormData({
      type: item.type || 'live',
      title: item.title || '',
      day_of_week: item.day_of_week || 'Monday',
      time: item.time || '12:00',
      is_recurring: item.is_recurring !== false,
      audience: item.audience || 'all_ages',
      share_to_directory: item.share_to_directory || false,
      specific_date: item.specific_date || '',
      live_type: item.live_type || 'regular',
      special_event_type: item.special_event_type || ''
    });
  };

  const handleDuplicateContent = (item) => {
    setEditingContentItem({}); // New item, no ID
    setContentFormData({
      type: item.type || 'live',
      title: item.title ? `${item.title} (copy)` : '',
      day_of_week: item.day_of_week || 'Monday',
      time: item.time || '12:00',
      is_recurring: item.is_recurring !== false,
      audience: item.audience || 'all_ages',
      share_to_directory: item.share_to_directory || false,
      specific_date: '',
      live_type: item.live_type || 'regular',
      special_event_type: ''
    });
  };

  const handleSaveContent = () => {
    if (editingContentItem?.id) {
      updateContentMutation.mutate({ id: editingContentItem.id, data: contentFormData });
    } else {
      createContentMutation.mutate(contentFormData);
    }
  };

  const getMyContentForDay = (day) => {
    return myContentItems.filter(item => item.day_of_week === day && item.type === 'live').sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  const createScheduleMutation = useMutation({
    mutationFn: (data) => base44.entities.LiveSchedule.create(data),
    onSuccess: (newSchedule) => {
      queryClient.invalidateQueries({ queryKey: ['liveSchedules'] });
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
      priority: 1,
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
      uses_tikfinity: schedule.uses_tikfinity || false,
      uses_live_studio: schedule.uses_live_studio || false,
      priority: schedule.priority || 1,
      is_recurring: schedule.is_recurring,
      specific_date: schedule.specific_date || '',
      audience_restriction: schedule.audience_restriction || 'all_ages',
      video_guide_url: schedule.video_guide_url || '',
      notes: schedule.notes || ''
    });
    setShowModal(true);
  };

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
      const date = new Date();
      const isoString = `${date.toISOString().split('T')[0]}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      const creatorTime = new Date(isoString + 'Z');
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
    if (schedule.is_recurring && schedule.recurring_days && schedule.recurring_days.length > 0) {
      const dayMap = { 'Monday': 'MO', 'Tuesday': 'TU', 'Wednesday': 'WE', 'Thursday': 'TH', 'Friday': 'FR', 'Saturday': 'SA', 'Sunday': 'SU' };
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

  // Get current day info
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const currentDayName = today.toLocaleString('en-US', { weekday: 'long' });
  const tomorrowDayName = tomorrow.toLocaleString('en-US', { weekday: 'long' });

  // Filter and sort schedules
  const getFilteredSchedulesForDay = (day) => {
    let filtered = schedules.filter(s => s.is_recurring && s.recurring_days?.includes(day));
    
    // Apply live type filter
    if (selectedLiveTypes.length > 0) {
      filtered = filtered.filter(s =>
        (s.live_types || ['regular']).some(type => selectedLiveTypes.includes(type))
      );
    }
    
    // Sort by time first, then by priority (1 = highest priority)
    return filtered.sort((a, b) => {
      const timeA = convertTo24Hour(a.time);
      const timeB = convertTo24Hour(b.time);
      if (timeA && timeB && timeA !== timeB) return timeA.localeCompare(timeB);
      return (a.priority || 5) - (b.priority || 5);
    });
  };

  // Get days to show based on filter
  const getDaysToShow = () => {
    if (dayFilter === 'today') return [currentDayName];
    if (dayFilter === 'tomorrow') return [tomorrowDayName];
    return daysOfWeek;
  };

  const daysToShow = getDaysToShow();

  // One-time lives
  let oneTimeLives = schedules.filter(s => !s.is_recurring);
  if (dayFilter === 'today') {
    const todayISO = today.toISOString().split('T')[0];
    oneTimeLives = oneTimeLives.filter(s => s.specific_date === todayISO);
  } else if (dayFilter === 'tomorrow') {
    const tomorrowISO = tomorrow.toISOString().split('T')[0];
    oneTimeLives = oneTimeLives.filter(s => s.specific_date === tomorrowISO);
  }
  if (selectedLiveTypes.length > 0) {
    oneTimeLives = oneTimeLives.filter(s =>
      (s.live_types || ['regular']).some(type => selectedLiveTypes.includes(type))
    );
  }
  oneTimeLives = oneTimeLives.sort((a, b) => {
    const timeA = convertTo24Hour(a.time);
    const timeB = convertTo24Hour(b.time);
    if (timeA && timeB && timeA !== timeB) return timeA.localeCompare(timeB);
    return (a.priority || 5) - (b.priority || 5);
  });

  const toggleTypeFilter = (type) => {
    setSelectedLiveTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const { isDark, bgClass, textClass, cardBgClass, subtextClass } = useTheme();

  const ScheduleCard = ({ schedule }) => {
    const liveTypes = schedule.live_types || ['regular'];
    return (
      <div className={`p-2 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition-colors text-sm`}>
        {/* Row 1: Priority, Name, Time */}
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {schedule.priority || 5}
          </span>
          <span
            className={`font-medium cursor-pointer hover:text-purple-600 flex-1 ${textClass}`}
            onClick={() => openTikTok(schedule.host_username)}
          >
            @{schedule.host_username}
          </span>
          {schedule.time && (
            <span className={`text-xs ${subtextClass} flex-shrink-0`}>
              {convertTime(schedule.time, schedule.creator_timezone || 'America/New_York', userTimezone)}
            </span>
          )}
        </div>
        {/* Row 2: Category badges */}
        <div className="flex flex-wrap gap-1 mt-1 ml-7">
          {liveTypes.map(type => {
            const config = liveTypeConfig[type];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <Badge key={type} className={`text-xs px-1.5 py-0 ${config.color}`}>
                <Icon className="w-3 h-3" />
              </Badge>
            );
          })}
          {schedule.uses_tikfinity && (
            <Badge className="text-xs px-1.5 py-0 bg-gray-200 text-gray-700">TF</Badge>
          )}
          {schedule.uses_live_studio && (
            <Badge className="text-xs px-1.5 py-0 bg-gray-200 text-gray-700">LS</Badge>
          )}
        </div>
        {/* Row 3: Action icons */}
        <div className="flex items-center gap-1 mt-1 ml-7">
          {schedule.notes && (
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={() => { setNoteContent(schedule.notes); setShowNoteDialog(true); }}
            >
              <FileText className="w-3 h-3 text-gray-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleEdit(schedule)}>
            <Edit className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => generateCalendarFile(schedule)}>
            <CalendarPlus className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="w-6 h-6 text-red-500" onClick={() => deleteScheduleMutation.mutate(schedule.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${textClass}`}>Creator Calendar</h1>
            <p className={`${subtextClass} text-sm`}>Track your favorite TikTok creators' live schedules</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={showMyContent ? "default" : "outline"}
              onClick={() => setShowMyContent(!showMyContent)}
              className={showMyContent ? "bg-teal-600 hover:bg-teal-700" : "border-teal-300 text-teal-700 hover:bg-teal-50"}
            >
              {showMyContent ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showMyContent ? "Hide My Lives" : "Show My Lives"}
            </Button>
            <Button
              onClick={() => setEditingContentItem({})}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add My Live
            </Button>
            <div className="relative group">
              <Button
                onClick={() => setShowModal(true)}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                + Creator's LIVE
              </Button>
              <div className="absolute top-full left-0 mt-1 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Check Discover Creators first - they may have shared their schedule!
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Contacts Info */}
        {calendarContacts.length > 0 && (
          <Card className={isDark ? 'bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-blue-700' : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'}>
            <CardContent className="p-4">
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <strong>{calendarContacts.length}</strong> contacts marked for calendar tracking. 
                Add their live schedules below!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Day Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={dayFilter === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDayFilter('today')}
            className={dayFilter === 'today' ? 'bg-purple-600' : ''}
          >
            Today ({currentDayName.slice(0, 3)})
          </Button>
          <Button
            variant={dayFilter === 'tomorrow' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDayFilter('tomorrow')}
            className={dayFilter === 'tomorrow' ? 'bg-purple-600' : ''}
          >
            Tomorrow ({tomorrowDayName.slice(0, 3)})
          </Button>
          <Button
            variant={dayFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDayFilter('all')}
            className={dayFilter === 'all' ? 'bg-purple-600' : ''}
          >
            All Days
          </Button>
        </div>

        {/* Live Type Filters */}
        <div className="flex flex-wrap gap-1">
          {Object.entries(liveTypeConfig).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = selectedLiveTypes.includes(key);
            return (
              <Badge
                key={key}
                variant={isSelected ? 'default' : 'outline'}
                className={`cursor-pointer px-2 py-1 text-xs ${isSelected ? 'bg-purple-600 text-white' : 'bg-white'}`}
                onClick={() => toggleTypeFilter(key)}
              >
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            );
          })}
          {selectedLiveTypes.length > 0 && (
            <Badge
              variant="outline"
              className="cursor-pointer px-2 py-1 text-xs text-red-500 border-red-300"
              onClick={() => setSelectedLiveTypes([])}
            >
              Clear
            </Badge>
          )}
        </div>

        {/* Weekly Schedule */}
        <div className={`grid gap-4 ${dayFilter === 'all' ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'md:grid-cols-1 lg:grid-cols-2'}`}>
          {daysToShow.map((day, dayIndex) => {
            const daySchedules = getFilteredSchedulesForDay(day);
            const isToday = day === currentDayName;
            const isTomorrow = day === tomorrowDayName;
            
            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.05 }}
              >
                <Card className={`h-full ${cardBgClass}`}>
                  <CardHeader className={`pb-2 ${isToday ? 'bg-gradient-to-r from-green-500 to-teal-500' : isTomorrow ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'} text-white`}>
                    <CardTitle className="text-base flex items-center gap-2">
                      {day}
                      {isToday && <Badge className="bg-white/20 text-white text-xs">Today</Badge>}
                      {isTomorrow && <Badge className="bg-white/20 text-white text-xs">Tomorrow</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-2 max-h-96 overflow-y-auto">
                    {/* My Content Items */}
                    {showMyContent && getMyContentForDay(day).map((item) => {
                      const liveConfig = liveTypeConfig[item.live_type] || liveTypeConfig.regular;
                      const LiveIcon = liveConfig.icon;
                      return (
                        <div key={`content-${item.id}`} className={`p-2 ${isDark ? 'bg-teal-900/30 border-teal-700' : 'bg-teal-50 border-teal-200'} border rounded-lg text-sm`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${liveConfig.color}`}>
                                <LiveIcon className="w-3 h-3 mr-1" />
                                {liveConfig.label}
                              </Badge>
                              <span className={`text-xs ${subtextClass}`}>
                                {item.time ? `${parseInt(item.time.split(':')[0]) % 12 || 12}:${item.time.split(':')[1]} ${parseInt(item.time.split(':')[0]) >= 12 ? 'PM' : 'AM'}` : ''}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleDuplicateContent(item)} title="Duplicate">
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleEditContent(item)}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-6 h-6 text-red-500" onClick={() => deleteContentMutation.mutate(item.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {item.title && <p className={`text-xs font-medium mt-1 ${textClass}`}>{item.title}</p>}
                          {item.share_to_directory && <Badge className="mt-1 text-xs bg-purple-100 text-purple-700">Shared</Badge>}
                        </div>
                      );
                    })}
                    
                    {daySchedules.length === 0 && (!showMyContent || getMyContentForDay(day).length === 0) ? (
                      <p className={`text-xs ${subtextClass} italic`}>No lives scheduled</p>
                    ) : (
                      daySchedules.map((schedule) => (
                        <ScheduleCard key={schedule.id} schedule={schedule} />
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* One-Time Lives */}
        {oneTimeLives.length > 0 && (
          <div className="space-y-3">
            <h2 className={`text-lg font-bold ${textClass}`}>One-Time Lives</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {oneTimeLives.map((schedule, index) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={cardBgClass}>
                    <CardHeader className="pb-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      <CardTitle className="text-sm">{schedule.specific_date}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <ScheduleCard schedule={schedule} />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{noteContent}</p>
          <DialogFooter>
            <Button onClick={() => setShowNoteDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(liveTypeConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div
                      key={key}
                      onClick={() => toggleLiveType(key)}
                      className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-xs ${
                        formData.live_types.includes(key)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Checkbox checked={formData.live_types.includes(key)} />
                        <Icon className="w-3 h-3" />
                        <span>{config.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority (1=highest, 10=lowest)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
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
              </div>
            </div>

            <div className="flex gap-4">
              <div
                onClick={() => setFormData({ ...formData, uses_tikfinity: !formData.uses_tikfinity })}
                className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 flex-1"
              >
                <Checkbox checked={formData.uses_tikfinity} />
                <span className="text-sm">Uses Tikfinity</span>
              </div>
              <div
                onClick={() => setFormData({ ...formData, uses_live_studio: !formData.uses_live_studio })}
                className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 flex-1"
              >
                <Checkbox checked={formData.uses_live_studio} />
                <span className="text-sm">Uses TikTok LIVE Studio</span>
              </div>
            </div>

            <div
              onClick={() => setFormData({ ...formData, is_recurring: !formData.is_recurring })}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <Checkbox checked={formData.is_recurring} />
              <div>
                <p className="font-medium text-sm">Recurring Weekly</p>
                <p className="text-xs text-gray-500">Same day/time every week</p>
              </div>
            </div>

            {formData.is_recurring ? (
              <div className="space-y-2">
                <Label>Select Days</Label>
                <div className="grid grid-cols-4 gap-2">
                  {daysOfWeek.map(day => (
                    <div
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-xs text-center ${
                        formData.recurring_days.includes(day)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {day.slice(0, 3)}
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
            </div>

            <TimezoneSelector
              label="Creator's Timezone"
              value={formData.creator_timezone}
              onChange={(value) => setFormData({ ...formData, creator_timezone: value })}
            />

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
              {editingSchedule ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Content Item Dialog */}
      <Dialog open={!!editingContentItem} onOpenChange={(open) => {
        if (!open) {
          setEditingContentItem(null);
          setContentFormData({ type: 'live', title: '', day_of_week: 'Monday', time: '12:00', is_recurring: true, audience: 'all_ages', share_to_directory: false, specific_date: '', live_type: 'regular', special_event_type: '' });
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContentItem?.id ? 'Edit My Live' : 'Add My Live'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Live Type */}
            <div className="space-y-2">
              <Label>Type of Live</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(liveTypeConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div
                      key={key}
                      onClick={() => setContentFormData({ ...contentFormData, live_type: key })}
                      className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-xs text-center ${
                        contentFormData.live_type === key
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1" />
                      <span>{config.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                placeholder="e.g., Morning Live, Battle Night"
                value={contentFormData.title}
                onChange={(e) => setContentFormData({ ...contentFormData, title: e.target.value })}
              />
            </div>

            {/* Recurring toggle */}
            <div
              onClick={() => setContentFormData({ ...contentFormData, is_recurring: !contentFormData.is_recurring })}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <Checkbox checked={contentFormData.is_recurring} />
              <div>
                <p className="font-medium text-sm">🔄 Recurring Weekly</p>
                <p className="text-xs text-gray-500">Same day/time every week</p>
              </div>
            </div>

            {contentFormData.is_recurring ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select value={contentFormData.day_of_week} onValueChange={(v) => setContentFormData({ ...contentFormData, day_of_week: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={contentFormData.time}
                    onChange={(e) => setContentFormData({ ...contentFormData, time: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Special Event Type</Label>
                  <Select value={contentFormData.special_event_type} onValueChange={(v) => setContentFormData({ ...contentFormData, special_event_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select event type..." /></SelectTrigger>
                    <SelectContent>
                      {specialEventTypes.map(event => (
                        <SelectItem key={event.value} value={event.value}>
                          <div className="flex items-center gap-2">
                            <event.icon className="w-4 h-4" />
                            {event.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={contentFormData.specific_date}
                      onChange={(e) => setContentFormData({ ...contentFormData, specific_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={contentFormData.time}
                      onChange={(e) => setContentFormData({ ...contentFormData, time: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={contentFormData.audience} onValueChange={(v) => setContentFormData({ ...contentFormData, audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_ages">All Ages</SelectItem>
                  <SelectItem value="18+">18+ Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-purple-50">
              <Checkbox
                checked={contentFormData.share_to_directory}
                onCheckedChange={(c) => setContentFormData({ ...contentFormData, share_to_directory: c })}
              />
              <div>
                <span className="text-sm font-medium">📢 Share to Discover Creators</span>
                <p className="text-xs text-gray-500">Let others see your live schedule</p>
              </div>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContentItem(null)}>Cancel</Button>
            <Button onClick={handleSaveContent} className="bg-teal-600 hover:bg-teal-700">
              {editingContentItem?.id ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}