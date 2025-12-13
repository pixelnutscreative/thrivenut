
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Sun, Moon, Coffee, Utensils, Droplet, Pill, Heart, BookOpen, 
  Dumbbell, ShowerHead, Sparkles, Check, Pencil, X, List, Grid3X3,
  ChevronDown, ChevronUp, PawPrint, Bell, Clock, Video, Users, 
  MessageSquare, SkipForward, ArrowRight, Loader2,
  Bed, Smile, NotebookPen, GripVertical, ExternalLink, Target, Columns,
  Calendar, History, Settings, Eye, EyeOff, CalendarDays, Trash2,
  Plus, Filter, MoreHorizontal, AlertTriangle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format } from 'date-fns';
import DailyMotivationSidebar from './DailyMotivationSidebar';
import CarryoverTasksModal from './CarryoverTasksModal';
import TaskHistoryModal from './TaskHistoryModal';
import TaskOptionsMenu from './TaskOptionsMenu';
import AddManualEventModal from './AddManualEventModal';
import CompactGoalsScroll from './CompactGoalsScroll';

// Time category mapping to time slots
const timeSlotOrder = {
  'upon_awakening': 1,
  'empty_stomach_morning': 2,
  'with_breakfast': 3,
  'morning_snack': 4,
  '30_min_before_lunch': 5,
  'with_lunch': 6,
  'afternoon_snack': 7,
  'with_dinner': 8,
  'empty_stomach_evening': 9,
  'before_bed': 10,
  'other': 11
};

const timeSlotToTimeOfDay = {
  'upon_awakening': 'morning',
  'empty_stomach_morning': 'morning',
  'with_breakfast': 'morning',
  'morning_snack': 'morning',
  '30_min_before_lunch': 'midday',
  'with_lunch': 'midday',
  'afternoon_snack': 'afternoon',
  'with_dinner': 'evening',
  'empty_stomach_evening': 'evening',
  'before_bed': 'night',
  'other': 'anytime'
};

const timeSlotLabels = {
  'upon_awakening': 'Upon awakening',
  'empty_stomach_morning': 'Empty stomach (AM)',
  'with_breakfast': 'With breakfast',
  'morning_snack': 'Morning snack',
  '30_min_before_lunch': '30 min before lunch',
  'with_lunch': 'With lunch',
  'afternoon_snack': 'Afternoon snack',
  'with_dinner': 'With dinner',
  'empty_stomach_evening': 'Empty stomach (PM)',
  'before_bed': 'Before bed',
  'other': 'Other time'
};

const getMealLabels = (gender) => {
  const isFemale = gender === 'female';
  return {
    breakfast: isFemale ? '👑 Eat like a queen' : '👑 Eat like a king',
    lunch: isFemale ? '👸 Eat like a princess' : '🤴 Eat like a prince', 
    dinner: '🥄 Eat like a pauper'
  };
};

const timeLabels = {
  morning: { label: 'Morning', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50' },
  midday: { label: 'Midday', icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  afternoon: { label: 'Afternoon', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50' },
  evening: { label: 'Evening', icon: Moon, color: 'text-purple-500', bg: 'bg-purple-50' },
  night: { label: 'Night', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  anytime: { label: 'As Needed', icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50' }
};

const frequencyDoses = {
  once_daily: 1,
  twice_daily: 2,
  three_times_daily: 3,
  as_needed: 0,
  weekly: 1
};

export default function MyDaySection({ 
  selfCareLog, 
  onToggleTask, 
  onUpdateMealNotes,
  preferences,
  viewMode = 'detailed',
  showGoogleCalendar = false,
  showCreatorCalendarEvents = true,
  onToggleGoogleCalendar,
  onToggleCreatorCalendar
}) {
  const [layoutMode, setLayoutMode] = useState('single');
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDayName = format(new Date(), 'EEEE');
  const userEmail = preferences?.user_email;
  
  const [editingMeal, setEditingMeal] = useState(null);
  const [mealNoteInput, setMealNoteInput] = useState('');
  const [expandedSections, setExpandedSections] = useState(['morning', 'midday', 'afternoon', 'evening', 'night', 'anytime']);
  const [localViewMode, setLocalViewMode] = useState('compact');
  const [skippedTasks, setSkippedTasks] = useState([]);
  const [isReordering, setIsReordering] = useState(false);
  const [localTaskOrder, setLocalTaskOrder] = useState(preferences?.my_day_task_order || []);
  const [sleepForm, setSleepForm] = useState({ hours: '', quality: '' });
  const [showSleepForm, setShowSleepForm] = useState(false);
  const [showCarryoverModal, setShowCarryoverModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState(preferences?.dashboard_collapsed_sections || []);
  const [pausedTasks, setPausedTasks] = useState({});
  const [compactDetailModal, setCompactDetailModal] = useState(null);
  const [compactModalNote, setCompactModalNote] = useState('');
  const [compactSleepForm, setCompactSleepForm] = useState({ hours: '', quality: '' });
  
  const mealLabels = getMealLabels(preferences?.gender);
  const displayMode = preferences?.completed_tasks_display || 'show_checked';

  // Fetch medications
  const { data: medications = [] } = useQuery({
    queryKey: ['activeMedications', userEmail],
    queryFn: () => base44.entities.Medication.filter({ is_active: true, created_by: userEmail }),
    enabled: !!userEmail,
  });

  // Fetch medication logs
  const { data: medicationLogs = [] } = useQuery({
    queryKey: ['medicationLogs', today, userEmail],
    queryFn: () => base44.entities.MedicationLog.filter({ date: today, created_by: userEmail }),
    enabled: !!userEmail,
  });

  // Fetch supplements
  const { data: supplements = [] } = useQuery({
    queryKey: ['activeSupplements', userEmail],
    queryFn: () => base44.entities.Supplement.filter({ is_active: true, created_by: userEmail }),
    enabled: !!userEmail,
  });

  // Fetch supplement logs
  const { data: supplementLogs = [] } = useQuery({
    queryKey: ['supplementLogs', today, userEmail],
    queryFn: () => base44.entities.SupplementLog.filter({ date: today, created_by: userEmail }),
    enabled: !!userEmail,
  });

  // Fetch pets
  const { data: pets = [] } = useQuery({
    queryKey: ['pets', userEmail],
    queryFn: () => base44.entities.Pet.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  // Fetch pet activity logs
  const { data: petLogs = [] } = useQuery({
    queryKey: ['petActivityLogs', today, userEmail],
    queryFn: () => base44.entities.PetActivityLog.filter({ date: today, created_by: userEmail }),
    enabled: !!userEmail,
  });

  // Fetch care reminders
  const { data: careReminders = [] } = useQuery({
    queryKey: ['careReminders', userEmail],
    queryFn: () => base44.entities.CareReminder.filter({ is_active: true, created_by: userEmail }),
    enabled: !!userEmail,
  });

  // Fetch content calendar items (recurring schedule)
  const { data: contentCalendarItems = [] } = useQuery({
    queryKey: ['contentCalendarItems', userEmail],
    queryFn: () => base44.entities.ContentCalendarItem.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  // Fetch live schedules to visit
  const { data: liveSchedules = [] } = useQuery({
    queryKey: ['liveSchedules', userEmail],
    queryFn: () => base44.entities.LiveSchedule.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  // Fetch active goals
  const { data: goals = [] } = useQuery({
    queryKey: ['activeGoals', userEmail],
    queryFn: () => base44.entities.Goal.filter({ status: 'active', created_by: userEmail }),
    enabled: !!userEmail,
  });

  // Fetch Google Calendar events - only if user has connected THEIR OWN calendar
  // Note: Google Calendar connector is per-user via OAuth, so each user gets their own
  const { data: googleCalendarData, error: googleCalError } = useQuery({
    queryKey: ['googleCalendar', today, userEmail],
    queryFn: async () => {
      const response = await base44.functions.invoke('fetchGoogleCalendar', {});
      return response.data;
    },
    enabled: !!userEmail && preferences?.show_google_calendar && preferences?.google_calendar_connected,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Fetch carryover tasks
  const { data: carryoverTasks = [] } = useQuery({
    queryKey: ['carryoverTasks', userEmail],
    queryFn: () => base44.entities.CarryoverTask.filter({ 
      status: 'pending',
      created_by: userEmail 
    }),
    enabled: !!userEmail,
  });

  // Fetch TikTok contacts with engagement enabled for today
  const { data: engagementContacts = [] } = useQuery({
    queryKey: ['engagementContacts', userEmail, todayDayName],
    queryFn: async () => {
      const contacts = await base44.entities.TikTokContact.filter({ 
        engagement_enabled: true,
        created_by: userEmail 
      });
      return contacts.filter(c => {
        if (c.engagement_frequency === 'daily') return true;
        if (c.engagement_frequency === 'multiple_per_week' && c.engagement_days?.includes(todayDayName)) return true;
        if (c.engagement_frequency === 'monthly') {
          const dayOfMonth = new Date().getDate();
          return c.engagement_day_of_month === dayOfMonth;
        }
        return false;
      });
    },
    enabled: !!userEmail,
  });

  // Fetch creator calendar events (lives from contacts with calendar_enabled)
  const { data: creatorCalendarContacts = [] } = useQuery({
    queryKey: ['creatorCalendarContacts', userEmail],
    queryFn: () => base44.entities.TikTokContact.filter({ 
      calendar_enabled: true,
      created_by: userEmail 
    }),
    enabled: !!userEmail && preferences?.show_creator_calendar_events !== false,
  });

  const { data: manualEvents = [] } = useQuery({
    queryKey: ['manualEventsToday', today, userEmail],
    queryFn: async () => {
      return await base44.entities.ExternalEvent.filter({ date: today, created_by: userEmail });
    },
    enabled: !!userEmail
  });

  const { data: creatorEvents = [] } = useQuery({
    queryKey: ['creatorEventsToday', today],
    queryFn: async () => {
      // Logic to fetch creator events... placeholder for now if entity doesn't exist
      // Assuming 'LiveSchedule' entity exists or similar
      try {
        // Fetch public lives for today
        // const lives = await base44.entities.LiveSchedule.filter({ specific_date: today });
        return []; 
      } catch (e) {
        return [];
      }
    },
    enabled: preferences?.show_creator_calendar_events
  });

  // Show carryover modal if there are pending tasks
  useEffect(() => {
    if (carryoverTasks.length > 0) {
      setShowCarryoverModal(true);
    }
  }, [carryoverTasks.length]);

  // Fetch today's sleep log
  const { data: todaysSleep } = useQuery({
    queryKey: ['sleepToday', today, userEmail],
    queryFn: async () => {
      const logs = await base44.entities.SleepLog.filter({ date: today, created_by: userEmail });
      return logs[0] || null;
    },
    enabled: !!userEmail,
  });

  // Sleep mutation
  const sleepMutation = useMutation({
    mutationFn: async (sleepData) => {
      if (todaysSleep) {
        return await base44.entities.SleepLog.update(todaysSleep.id, sleepData);
      } else {
        return await base44.entities.SleepLog.create({ date: today, ...sleepData });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sleepToday'] }),
  });

  // Mutations
  const medicationLogMutation = useMutation({
    mutationFn: async ({ medicationId, doseNumber }) => {
      const existingLog = medicationLogs.find(l => l.medication_id === medicationId);
      if (existingLog) {
        const doses = existingLog.doses_taken || [];
        if (doses.includes(doseNumber)) {
          return base44.entities.MedicationLog.update(existingLog.id, {
            doses_taken: doses.filter(d => d !== doseNumber)
          });
        } else {
          return base44.entities.MedicationLog.update(existingLog.id, {
            doses_taken: [...doses, doseNumber]
          });
        }
      } else {
        return base44.entities.MedicationLog.create({
          medication_id: medicationId,
          date: today,
          doses_taken: [doseNumber]
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medicationLogs'] }),
  });

  const supplementLogMutation = useMutation({
    mutationFn: async ({ supplementId, doseNumber }) => {
      const existingLog = supplementLogs.find(l => l.supplement_id === supplementId);
      if (existingLog) {
        const doses = existingLog.doses_taken || [];
        if (doses.includes(doseNumber)) {
          return base44.entities.SupplementLog.update(existingLog.id, {
            doses_taken: doses.filter(d => d !== doseNumber)
          });
        } else {
          return base44.entities.SupplementLog.update(existingLog.id, {
            doses_taken: [...doses, doseNumber]
          });
        }
      } else {
        return base44.entities.SupplementLog.create({
          supplement_id: supplementId,
          date: today,
          doses_taken: [doseNumber]
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplementLogs'] }),
  });

  const petLogMutation = useMutation({
    mutationFn: async ({ petId, taskKey }) => {
      const existingLog = petLogs.find(l => l.pet_id === petId);
      if (existingLog) {
        const tasks = existingLog.completed_tasks || [];
        if (tasks.includes(taskKey)) {
          return base44.entities.PetActivityLog.update(existingLog.id, {
            completed_tasks: tasks.filter(t => t !== taskKey)
          });
        } else {
          return base44.entities.PetActivityLog.update(existingLog.id, {
            completed_tasks: [...tasks, taskKey]
          });
        }
      } else {
        return base44.entities.PetActivityLog.create({
          pet_id: petId,
          date: today,
          completed_tasks: [taskKey]
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['petActivityLogs'] }),
  });



  // Build unified task list
  const allTasks = useMemo(() => {
    const tasks = [];
    
    // Core self-care tasks
    if (preferences?.enable_bible_options !== false) {
      if (preferences?.enable_morning_reading !== false && preferences?.enable_daily_reading !== false) {
        tasks.push({ id: 'bible_reading_morning', type: 'selfcare', label: 'Morning Bible Reading', icon: BookOpen, color: 'text-amber-600', timeOfDay: 'morning', order: 1, externalLink: 'https://www.bible.com/reading-plans' });
      }
      if (preferences?.enable_morning_prayer) {
        tasks.push({ id: 'prayer_morning', type: 'selfcare', label: 'War Room (Prayer)', icon: Heart, color: 'text-pink-600', timeOfDay: 'morning', order: 1.1, isLink: true, linkTo: 'PrayerRequests' });
      }
    }
    tasks.push({ id: 'drank_water', type: 'selfcare', label: 'Drink water', sublabel: 'Start hydrated', icon: Droplet, color: 'text-sky-500', timeOfDay: 'morning', order: 2 });
    tasks.push({ id: 'shower_completed', type: 'selfcare', label: 'Take a shower', icon: ShowerHead, color: 'text-blue-500', timeOfDay: 'morning', order: 3 });
    tasks.push({ id: 'brushed_teeth_morning', type: 'selfcare', label: 'Brush teeth (AM)', icon: Sparkles, color: 'text-cyan-500', timeOfDay: 'morning', order: 4 });
    tasks.push({ id: 'breakfast_completed', type: 'selfcare', label: 'Breakfast', sublabel: mealLabels.breakfast, icon: Coffee, color: 'text-orange-500', timeOfDay: 'morning', order: 10, hasMealNote: true });
    
    // Medications - grouped by time_category
    medications.forEach(med => {
      const timeOfDay = timeSlotToTimeOfDay[med.time_category] || 'morning';
      const orderBase = (timeSlotOrder[med.time_category] || 3) * 10;
      const numDoses = frequencyDoses[med.frequency] || 1;
      
      for (let dose = 1; dose <= numDoses; dose++) {
        tasks.push({
          id: `med_${med.id}_${dose}`,
          type: 'medication',
          medicationId: med.id,
          doseNumber: dose,
          label: med.name,
          sublabel: `${med.dosage}${numDoses > 1 ? ` (Dose ${dose})` : ''} • ${timeSlotLabels[med.time_category] || ''}`,
          icon: Pill,
          color: 'text-pink-500',
          timeOfDay,
          order: orderBase + 0.1,
        });
      }
    });

    // Supplements - grouped by time_category
    supplements.forEach(supp => {
      const timeOfDay = timeSlotToTimeOfDay[supp.time_category] || 'morning';
      const orderBase = (timeSlotOrder[supp.time_category] || 3) * 10;
      const numDoses = frequencyDoses[supp.frequency] || 1;
      
      for (let dose = 1; dose <= numDoses; dose++) {
        tasks.push({
          id: `supp_${supp.id}_${dose}`,
          type: 'supplement',
          supplementId: supp.id,
          doseNumber: dose,
          label: supp.name,
          sublabel: `${supp.dosage}${numDoses > 1 ? ` (Dose ${dose})` : ''} • ${timeSlotLabels[supp.time_category] || ''}`,
          icon: Pill,
          color: 'text-amber-500',
          timeOfDay,
          order: orderBase + 0.2,
        });
      }
    });

    // Water check-ins
    if (preferences?.enable_water_reminders !== false) {
      tasks.push({ id: 'water_midday', type: 'selfcare', label: 'Midday water', icon: Droplet, color: 'text-sky-500', timeOfDay: 'midday', order: 55 });
      tasks.push({ id: 'water_afternoon', type: 'selfcare', label: 'Afternoon water', icon: Droplet, color: 'text-sky-500', timeOfDay: 'afternoon', order: 75 });
      tasks.push({ id: 'water_evening', type: 'selfcare', label: 'Evening water', icon: Droplet, color: 'text-sky-500', timeOfDay: 'evening', order: 85 });
    }

    // Lunch
    tasks.push({ id: 'lunch_completed', type: 'selfcare', label: 'Lunch', sublabel: mealLabels.lunch, icon: Utensils, color: 'text-green-500', timeOfDay: 'midday', order: 60, hasMealNote: true });
    
    // Physical activity
    tasks.push({ id: 'physical_activity', type: 'selfcare', label: 'Physical activity', icon: Dumbbell, color: 'text-red-500', timeOfDay: 'afternoon', order: 70, canSkip: true });
    
    // Dinner
    tasks.push({ id: 'dinner_completed', type: 'selfcare', label: 'Dinner', sublabel: mealLabels.dinner, icon: Utensils, color: 'text-purple-500', timeOfDay: 'evening', order: 80, hasMealNote: true, canSkip: true });
    
    // Night tasks
    tasks.push({ id: 'brushed_teeth_night', type: 'selfcare', label: 'Brush teeth (PM)', icon: Sparkles, color: 'text-indigo-500', timeOfDay: 'night', order: 90 });
    if (preferences?.enable_bible_options !== false) {
      if (preferences?.enable_night_reading) {
        tasks.push({ id: 'bible_reading_night', type: 'selfcare', label: 'Night Bible Reading', icon: BookOpen, color: 'text-indigo-600', timeOfDay: 'night', order: 95, externalLink: 'https://www.bible.com/reading-plans' });
      }
      if (preferences?.enable_night_prayer) {
        tasks.push({ id: 'prayer_night', type: 'selfcare', label: 'War Room (Prayer)', icon: Heart, color: 'text-pink-600', timeOfDay: 'night', order: 95.1, isLink: true, linkTo: 'PrayerRequests' });
      }
    }

    // Sleep log - first thing in morning (inline)
    tasks.push({ 
      id: 'sleep_log', 
      type: 'sleep', 
      label: 'Log last night\'s sleep', 
      sublabel: 'How did you sleep?',
      icon: Bed, 
      color: 'text-indigo-500', 
      timeOfDay: 'morning', 
      order: 0
    });

    // Journal reminder - based on user preference
    const journalTime = preferences?.journal_reminder_time || 'night';
    const journalOrder = { morning: 15, lunch: 65, evening: 88, night: 96 };
    tasks.push({ 
      id: 'journal_entry', 
      type: 'selfcare', 
      label: 'Write in journal', 
      sublabel: 'Reflect on your day',
      icon: NotebookPen, 
      color: 'text-purple-500', 
      timeOfDay: journalTime === 'lunch' ? 'midday' : journalTime,
      order: journalOrder[journalTime] || 96,
      isLink: true,
      linkTo: 'Journal'
    });

    // Mood check-ins - in anytime section
    if (preferences?.enable_mood_checkins !== false) {
      tasks.push({ 
        id: 'mood_checkin', 
        type: 'selfcare', 
        label: 'Log your mood', 
        sublabel: 'How are you feeling?',
        icon: Smile, 
        color: 'text-pink-500', 
        timeOfDay: 'anytime',
        order: 10,
        isLink: true,
        linkTo: 'Wellness'
      });
    }

    // Pet care tasks
    pets.forEach(pet => {
      // Feeding
      (pet.feeding_schedule || []).forEach((feeding, idx) => {
        const timeOfDay = getTimeOfDayFromTimeString(feeding.time);
        tasks.push({
          id: `pet_${pet.id}_feeding_${idx}`,
          type: 'pet',
          petId: pet.id,
          taskKey: `feeding_${idx}`,
          label: `Feed ${pet.name}`,
          sublabel: `${feeding.food_type || 'Food'} - ${feeding.amount || ''} @ ${feeding.time || 'scheduled'}`,
          icon: PawPrint,
          color: 'text-orange-500',
          timeOfDay,
          order: getOrderFromTimeString(feeding.time),
        });
      });
      
      // Activities
      (pet.activity_schedule || []).forEach((activity, idx) => {
        const timeOfDay = getTimeOfDayFromTimeString(activity.preferred_time);
        for (let i = 0; i < (activity.times_per_day || 1); i++) {
          tasks.push({
            id: `pet_${pet.id}_activity_${idx}_${i}`,
            type: 'pet',
            petId: pet.id,
            taskKey: `activity_${idx}_${i}`,
            label: `${activity.activity_type === 'walk' ? '🚶 Walk' : activity.activity_type} ${pet.name}`,
            sublabel: activity.duration_minutes ? `${activity.duration_minutes} min` : '',
            icon: PawPrint,
            color: 'text-green-500',
            timeOfDay,
            order: getOrderFromTimeString(activity.preferred_time) + i * 0.1,
          });
        }
      });
    });

    // Care reminders for today
    careReminders.filter(r => r.days?.includes(todayDayName) || r.days?.length === 0).forEach(reminder => {
      const timeOfDay = getTimeOfDayFromTimeString(reminder.time);
      tasks.push({
        id: `reminder_${reminder.id}`,
        type: 'reminder',
        reminderId: reminder.id,
        label: reminder.title,
        sublabel: `${reminder.person_name} • ${reminder.time || ''}`,
        icon: Bell,
        color: 'text-purple-500',
        timeOfDay,
        order: getOrderFromTimeString(reminder.time),
      });
    });

    // Content Calendar Items (Posts, Lives, Engagement)
    contentCalendarItems.forEach(item => {
      // Check if scheduled for today
      let isToday = false;
      if (item.is_recurring !== false) {
        isToday = item.day_of_week === todayDayName;
      } else {
        isToday = item.specific_date === today;
      }

      if (isToday) {
        const timeOfDay = getTimeOfDayFromTimeString(item.time);
        
        let icon = Video;
        let color = 'text-blue-500';
        let label = item.title;
        let sublabel = '';

        if (item.type === 'live') {
          icon = Video;
          color = 'text-red-500';
          label = item.title || 'Go LIVE';
          sublabel = `🔴 Live @ ${item.time}`;
        } else if (item.type === 'engagement') {
          icon = Users;
          color = 'text-teal-500';
          label = item.title || 'Engagement Time';
          sublabel = `💬 Engage @ ${item.time}`;
        } else {
          // Post
          icon = Video; // Or another icon
          color = 'text-blue-500';
          label = item.title || 'Create/Post Content';
          sublabel = `📱 Post @ ${item.time}`;
        }

        tasks.push({
          id: `content_${item.id}`,
          type: 'content',
          contentId: item.id,
          label,
          sublabel,
          icon,
          color,
          timeOfDay,
          order: getOrderFromTimeString(item.time),
          // Completion tracked via selfCareLog
        });
      }
    });

    // Live schedules to visit today
    liveSchedules.filter(s => s.recurring_days?.includes(todayDayName)).forEach(schedule => {
      const timeOfDay = getTimeOfDayFromTimeString(schedule.time);
      tasks.push({
        id: `visit_live_${schedule.id}`,
        type: 'visit_live',
        scheduleId: schedule.id,
        label: `Visit @${schedule.host_username}'s live`,
        sublabel: `📺 @ ${schedule.time}`,
        icon: Video,
        color: 'text-pink-500',
        timeOfDay,
        order: getOrderFromTimeString(schedule.time),
      });
    });

    // Active goals - add to anytime section or with specific time if set
    goals.forEach(goal => {
      // For habit goals with daily frequency, show them
      const isDaily = goal.goal_type === 'habit' && goal.frequency === 'daily';
      // For other goals, always show as a reminder
      
      if (isDaily || goal.goal_type !== 'habit') {
        tasks.push({
          id: `goal_${goal.id}`,
          type: 'goal',
          goalId: goal.id,
          label: goal.title,
          sublabel: `🎯 ${goal.category} goal${goal.target_value ? ` • ${goal.current_value || 0}/${goal.target_value}` : ''}`,
          icon: Target,
          color: 'text-purple-500',
          timeOfDay: 'anytime',
          order: 20,
          isLink: true,
          linkTo: 'Goals',
          canSkip: true,
        });
      }
    });

    // Google Calendar events
    if (googleCalendarData?.events && preferences?.show_google_calendar) {
      googleCalendarData.events.forEach(event => {
        const timeOfDay = getTimeOfDayFromTimeString(event.sortTime);
        tasks.push({
          id: `gcal_${event.id}`,
          type: 'calendar',
          label: event.title,
          sublabel: `📅 ${event.displayTime}${event.location ? ` • ${event.location}` : ''}`,
          icon: Calendar,
          color: 'text-blue-500',
          timeOfDay: event.isAllDay ? 'morning' : timeOfDay,
          order: event.isAllDay ? 5 : getOrderFromTimeString(event.sortTime),
          externalLink: event.htmlLink,
          isCalendarEvent: true,
        });
      });
    }

    // Note: Engagement contacts and creator calendar reminders removed - 
    // users can access those from their dedicated pages

    // Sort by custom order first, then by timeOfDay, then default order
    const timeOrder = { morning: 1, midday: 2, afternoon: 3, evening: 4, night: 5, anytime: 6 };
    const customOrder = localTaskOrder.length > 0 ? localTaskOrder : (preferences?.my_day_task_order || []);
    
    return tasks.sort((a, b) => {
      // If custom order exists, use it first
      if (customOrder.length > 0) {
        const aCustomIdx = customOrder.indexOf(a.id);
        const bCustomIdx = customOrder.indexOf(b.id);
        if (aCustomIdx !== -1 && bCustomIdx !== -1) return aCustomIdx - bCustomIdx;
        if (aCustomIdx !== -1) return -1;
        if (bCustomIdx !== -1) return 1;
      }
      
      const timeCompare = (timeOrder[a.timeOfDay] || 6) - (timeOrder[b.timeOfDay] || 6);
      if (timeCompare !== 0) return timeCompare;
      return (a.order || 50) - (b.order || 50);
    });
  }, [medications, supplements, pets, careReminders, contentCalendarItems, liveSchedules, goals, preferences, todayDayName, mealLabels, localTaskOrder, googleCalendarData, engagementContacts, creatorCalendarContacts, today]);

  // Helper functions
  function parseTimeString(timeStr) {
    if (!timeStr) return null;
    
    // Handle formats like "10:00 PM", "10 PM", "10pm"
    const pmMatch = timeStr.toLowerCase().includes('pm');
    const amMatch = timeStr.toLowerCase().includes('am');
    
    // Extract hours and minutes
    const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]) || 0;
      const min = parseInt(timeMatch[2]) || 0;
      
      // Convert to 24-hour format
      if (pmMatch && hour < 12) hour += 12;
      if (amMatch && hour === 12) hour = 0;
      
      return { hour, min };
    }
    
    // Handle HH:MM format (24-hour) without AM/PM
    if (timeStr.includes(':') && !pmMatch && !amMatch) {
      const parts = timeStr.split(':');
      let hour = parseInt(parts[0]) || 0;
      const min = parseInt(parts[1]) || 0;
      return { hour, min };
    }
    
    return null;
  }

  function getTimeOfDayFromTimeString(timeStr) {
    const parsed = parseTimeString(timeStr);
    if (!parsed) return 'anytime';
    
    const { hour } = parsed;
    if (hour < 10) return 'morning';
    if (hour < 12) return 'midday';
    if (hour < 17) return 'afternoon';
    if (hour < 20) return 'evening';
    return 'night';
  }

  function getOrderFromTimeString(timeStr) {
    const parsed = parseTimeString(timeStr);
    if (!parsed) return 50;
    return parsed.hour * 10 + parsed.min / 6;
  }

  const getMealNoteKey = (taskId) => taskId.replace('_completed', '_notes');
  
  const handleEditMeal = (taskId) => {
    const noteKey = getMealNoteKey(taskId);
    setMealNoteInput(selfCareLog?.[noteKey] || '');
    setEditingMeal(taskId);
  };
  
  const handleSaveMealNote = () => {
    if (editingMeal && onUpdateMealNotes) {
      const noteKey = getMealNoteKey(editingMeal);
      onUpdateMealNotes(noteKey, mealNoteInput);
    }
    setEditingMeal(null);
    setMealNoteInput('');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isTaskComplete = (task) => {
    if (task.type === 'selfcare') return selfCareLog?.[task.id];
    if (task.type === 'sleep') return !!todaysSleep;
    if (task.type === 'medication') {
      const log = medicationLogs.find(l => l.medication_id === task.medicationId);
      return log?.doses_taken?.includes(task.doseNumber);
    }
    if (task.type === 'supplement') {
      const log = supplementLogs.find(l => l.supplement_id === task.supplementId);
      return log?.doses_taken?.includes(task.doseNumber);
    }
    if (task.type === 'pet') {
      const log = petLogs.find(l => l.pet_id === task.petId);
      return log?.completed_tasks?.includes(task.taskKey);
    }
    if (task.type === 'reminder') {
      return selfCareLog?.completed_care_reminders?.includes(task.reminderId);
    }
    if (task.type === 'content') {
      return selfCareLog?.[task.id];
    }
    if (task.type === 'visit_live') {
      return selfCareLog?.[`visited_${task.scheduleId}`];
    }
    if (task.type === 'calendar') {
      return selfCareLog?.[`calendar_${task.id}`];
    }
    if (task.type === 'engagement') {
      return task.completed;
    }
    return false;
  };

  const toggleSectionCollapse = (sectionId) => {
    setCollapsedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const saveSectionVisibility = async () => {
    if (preferences?.id) {
      await base44.entities.UserPreferences.update(preferences.id, { 
        dashboard_collapsed_sections: collapsedSections 
      });
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    }
  };

  // Save collapsed sections when they change
  useEffect(() => {
    if (preferences?.id && collapsedSections.length !== (preferences?.dashboard_collapsed_sections?.length || 0)) {
      saveSectionVisibility();
    }
  }, [collapsedSections]);

  const handleSaveSleep = () => {
    if (sleepForm.hours && sleepForm.quality) {
      sleepMutation.mutate({ hours: parseFloat(sleepForm.hours), quality: sleepForm.quality });
      setShowSleepForm(false);
      setSleepForm({ hours: '', quality: '' });
    }
  };

  const handleToggleTask = (task) => {
    // For compact view, check if task needs details
    if (localViewMode === 'compact') {
      const mealTasks = ['breakfast_completed', 'lunch_completed', 'dinner_completed'];
      const needsDetail = mealTasks.includes(task.id) || task.type === 'sleep';
      
      if (needsDetail) {
        setCompactDetailModal(task);
        setCompactModalNote('');
        setCompactSleepForm({ hours: '', quality: '' });
        return;
      }
    }

    if (task.type === 'sleep') {
      if (!todaysSleep) {
        setShowSleepForm(true);
      }
      return;
    }
    if (task.type === 'selfcare' || task.type === 'visit_live') {
      const taskId = task.type === 'visit_live' ? `visited_${task.scheduleId}` : task.id;
      onToggleTask(taskId, !isTaskComplete(task));
    } else if (task.type === 'medication') {
      medicationLogMutation.mutate({ medicationId: task.medicationId, doseNumber: task.doseNumber });
    } else if (task.type === 'supplement') {
      supplementLogMutation.mutate({ supplementId: task.supplementId, doseNumber: task.doseNumber });
    } else if (task.type === 'pet') {
      petLogMutation.mutate({ petId: task.petId, taskKey: task.taskKey });
    } else if (task.type === 'reminder') {
      const current = selfCareLog?.completed_care_reminders || [];
      const updated = current.includes(task.reminderId) 
        ? current.filter(id => id !== task.reminderId)
        : [...current, task.reminderId];
      onToggleTask('completed_care_reminders', updated);
    } else if (task.type === 'content') {
      onToggleTask(task.id, !isTaskComplete(task));
    } else if (task.type === 'calendar') {
      const taskId = `calendar_${task.id}`;
      onToggleTask(taskId, !isTaskComplete(task));
    }
  };

  const handleCompactDetailSubmit = async () => {
    const task = compactDetailModal;
    if (!task) return;

    // Handle meal logging
    if (['breakfast_completed', 'lunch_completed', 'dinner_completed'].includes(task.id)) {
      const noteKey = getMealNoteKey(task.id);
      await onUpdateMealNotes(noteKey, compactModalNote);
      await onToggleTask(task.id, true);
    } 
    // Handle sleep logging
    else if (task.type === 'sleep') {
      if (compactSleepForm.hours && compactSleepForm.quality) {
        await sleepMutation.mutateAsync({ 
          hours: parseFloat(compactSleepForm.hours), 
          quality: compactSleepForm.quality 
        });
      }
    }

    setCompactDetailModal(null);
    setCompactModalNote('');
    setCompactSleepForm({ hours: '', quality: '' });
  };

  const handleSkipTask = (taskId) => {
    setSkippedTasks(prev => [...prev, taskId]);
  };

  const handlePushToNextDay = async (taskId, date) => {
    // Create a carryover task for the next day
    await base44.entities.CarryoverTask.create({
      original_date: today,
      task_type: 'reminder',
      task_id: taskId,
      task_label: allTasks.find(t => t.id === taskId)?.label || taskId,
      rescheduled_to: date,
      status: 'rescheduled'
    });
    setSkippedTasks(prev => [...prev, taskId]);
    queryClient.invalidateQueries({ queryKey: ['carryoverTasks'] });
  };

  const handlePushToDate = async (taskId, date) => {
    await base44.entities.CarryoverTask.create({
      original_date: today,
      task_type: 'reminder',
      task_id: taskId,
      task_label: allTasks.find(t => t.id === taskId)?.label || taskId,
      rescheduled_to: date,
      status: 'rescheduled'
    });
    setSkippedTasks(prev => [...prev, taskId]);
    queryClient.invalidateQueries({ queryKey: ['carryoverTasks'] });
  };

  const handlePauseTask = (taskId, days, resumeDate) => {
    setPausedTasks(prev => ({ ...prev, [taskId]: resumeDate }));
    setSkippedTasks(prev => [...prev, taskId]);
    // Store in localStorage for persistence
    const stored = JSON.parse(localStorage.getItem('pausedTasks') || '{}');
    stored[taskId] = resumeDate;
    localStorage.setItem('pausedTasks', JSON.stringify(stored));
  };

  // Load paused tasks from localStorage on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('pausedTasks') || '{}');
    const stillPaused = {};
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    Object.entries(stored).forEach(([taskId, resumeDate]) => {
      if (resumeDate > todayStr) {
        stillPaused[taskId] = resumeDate;
      }
    });
    setPausedTasks(stillPaused);
    localStorage.setItem('pausedTasks', JSON.stringify(stillPaused));
  }, []);

  // Reorder tasks
  const moveTaskUp = (taskId) => {
    const currentOrder = localTaskOrder.length > 0 ? [...localTaskOrder] : allTasks.map(t => t.id);
    const idx = currentOrder.indexOf(taskId);
    if (idx > 0) {
      [currentOrder[idx - 1], currentOrder[idx]] = [currentOrder[idx], currentOrder[idx - 1]];
      setLocalTaskOrder(currentOrder);
    }
  };

  const moveTaskDown = (taskId) => {
    const currentOrder = localTaskOrder.length > 0 ? [...localTaskOrder] : allTasks.map(t => t.id);
    const idx = currentOrder.indexOf(taskId);
    if (idx < currentOrder.length - 1) {
      [currentOrder[idx], currentOrder[idx + 1]] = [currentOrder[idx + 1], currentOrder[idx]];
      setLocalTaskOrder(currentOrder);
    }
  };

  const saveTaskOrder = async () => {
    if (preferences?.id) {
      await base44.entities.UserPreferences.update(preferences.id, { my_day_task_order: localTaskOrder });
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    }
    setIsReordering(false);
  };

  const getVisibleTasks = (sectionTasks) => {
    let filtered = sectionTasks.filter(t => !skippedTasks.includes(t.id) && !pausedTasks[t.id]);
    if (displayMode === 'hide') {
      filtered = filtered.filter(t => !isTaskComplete(t));
    }
    if (displayMode === 'move_to_bottom') {
      const incomplete = filtered.filter(t => !isTaskComplete(t));
      const complete = filtered.filter(t => isTaskComplete(t));
      return [...incomplete, ...complete];
    }
    return filtered;
  };

  const completedCount = allTasks.filter(t => isTaskComplete(t)).length;
  const totalCount = allTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group tasks by timeOfDay
  const tasksByTime = {};
  allTasks.forEach(task => {
    if (!tasksByTime[task.timeOfDay]) tasksByTime[task.timeOfDay] = [];
    tasksByTime[task.timeOfDay].push(task);
  });

  // Check if all meds/supps are taken for auto-check of parent task
  const allMedsTaken = medications.every(med => {
    const numDoses = frequencyDoses[med.frequency] || 1;
    if (numDoses === 0) return true; // as_needed
    const log = medicationLogs.find(l => l.medication_id === med.id);
    return log?.doses_taken?.length >= numDoses;
  });

  const allSuppsTaken = supplements.every(supp => {
    const numDoses = frequencyDoses[supp.frequency] || 1;
    if (numDoses === 0) return true;
    const log = supplementLogs.find(l => l.supplement_id === supp.id);
    return log?.doses_taken?.length >= numDoses;
  });

  if (localViewMode === 'compact') {
    return (
      <>
        <Card className="shadow-lg border-0 bg-gradient-to-br from-teal-400 via-blue-400 to-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <Sun className="w-6 h-6" />
                My Day
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setLocalViewMode('detailed')} className="h-8 text-white hover:bg-white/20">
                  <List className="w-4 h-4 mr-1" /> Detailed
                </Button>
                <Badge variant={completedCount === totalCount ? "default" : "secondary"} 
                       className={completedCount === totalCount ? "bg-white text-teal-600" : "bg-white/20 text-white"}>
                  {progressPercent}%
                </Badge>
              </div>
            </div>

            {/* Compact Goals Scroll */}
            <CompactGoalsScroll userEmail={preferences?.user_email} />
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
            <div className="flex flex-wrap gap-2">
              {allTasks.filter(t => !skippedTasks.includes(t.id)).map((task) => {
                const Icon = task.icon;
                const isComplete = isTaskComplete(task);
                if (displayMode === 'hide' && isComplete) return null;
                
                return (
                  <button
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className={`p-2.5 rounded-xl border-2 transition-all ${
                      isComplete 
                        ? 'border-green-400 bg-green-100' 
                        : 'border-gray-200 bg-white hover:border-teal-300'
                    }`}
                    title={task.label}
                  >
                    <Icon className={`w-5 h-5 ${isComplete ? 'text-green-500' : task.color}`} />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Compact Detail Modal */}
        <AnimatePresence>
          {compactDetailModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setCompactDetailModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
              >
                <h3 className="text-lg font-semibold mb-4">
                  {compactDetailModal.id === 'breakfast_completed' && '🍳 What did you have for breakfast?'}
                  {compactDetailModal.id === 'lunch_completed' && '🍽️ What did you have for lunch?'}
                  {compactDetailModal.id === 'dinner_completed' && '🍕 What did you have for dinner?'}
                  {compactDetailModal.type === 'sleep' && '😴 How did you sleep?'}
                </h3>
                
                {['breakfast_completed', 'lunch_completed', 'dinner_completed'].includes(compactDetailModal.id) && (
                  <Input
                    value={compactModalNote}
                    onChange={(e) => setCompactModalNote(e.target.value)}
                    placeholder="What did you eat?"
                    className="mb-4"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCompactDetailSubmit();
                      if (e.key === 'Escape') setCompactDetailModal(null);
                    }}
                  />
                )}

                {compactDetailModal.type === 'sleep' && (
                  <div className="space-y-3 mb-4">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Hours</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        placeholder="7.5"
                        value={compactSleepForm.hours}
                        onChange={(e) => setCompactSleepForm({...compactSleepForm, hours: e.target.value})}
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Quality</Label>
                      <Select 
                        value={compactSleepForm.quality} 
                        onValueChange={(v) => setCompactSleepForm({...compactSleepForm, quality: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="How was it?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">😴 Excellent</SelectItem>
                          <SelectItem value="good">🙂 Good</SelectItem>
                          <SelectItem value="fair">😐 Fair</SelectItem>
                          <SelectItem value="poor">😫 Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setCompactDetailModal(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCompactDetailSubmit}
                    disabled={
                      (compactDetailModal.type === 'sleep' && (!compactSleepForm.hours || !compactSleepForm.quality)) ||
                      (['breakfast_completed', 'lunch_completed', 'dinner_completed'].includes(compactDetailModal.id) && !compactModalNote.trim())
                    }
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                  >
                    Save
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <CarryoverTasksModal
          isOpen={showCarryoverModal}
          onClose={() => setShowCarryoverModal(false)}
          carryoverTasks={carryoverTasks}
          userEmail={userEmail}
        />

        <TaskHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          userEmail={userEmail}
        />

        <AddManualEventModal
          isOpen={showAddEventModal}
          onClose={() => setShowAddEventModal(false)}
          userEmail={userEmail}
        />
      </>
    );
  }

  // Detailed view - show full detailed layout with all tasks
  return (
    <>
      <Card className="shadow-lg border-0 bg-gradient-to-br from-teal-400 via-blue-400 to-purple-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <Sun className="w-6 h-6" />
              My Day
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="ghost"
                size="sm" 
                onClick={() => setLocalViewMode('compact')} 
                className="h-7 text-xs text-white hover:bg-white/20"
              >
                <Grid3X3 className="w-3 h-3 mr-1" /> Compact
              </Button>
              <Badge className="bg-white/20 text-white border-white/30">
                {completedCount}/{totalCount} • {progressPercent}%
              </Badge>
            </div>
          </div>
          <CompactGoalsScroll userEmail={preferences?.user_email} />
        </CardHeader>
        <CardContent className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
          <p className="text-sm text-gray-600">Detailed view coming soon. For now, use Compact view above.</p>
        </CardContent>
      </Card>

      <CarryoverTasksModal
        isOpen={showCarryoverModal}
        onClose={() => setShowCarryoverModal(false)}
        carryoverTasks={carryoverTasks}
        userEmail={userEmail}
      />

      <TaskHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        userEmail={userEmail}
      />

      <AddManualEventModal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        userEmail={userEmail}
      />
    </>
  );
}
