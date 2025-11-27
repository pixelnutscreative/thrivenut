import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Sun, Moon, Coffee, Utensils, Droplet, Pill, Heart, BookOpen, 
  Dumbbell, ShowerHead, Sparkles, Check, Pencil, X, List, Grid3X3,
  ChevronDown, ChevronUp, PawPrint, Bell, Clock, Video, Users, 
  MessageSquare, SkipForward, ArrowRight, Loader2,
  Bed, Smile, NotebookPen, GripVertical, ExternalLink, Target, Columns
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format } from 'date-fns';
import DailyMotivationSidebar from './DailyMotivationSidebar';

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
  viewMode = 'detailed'
}) {
  const [layoutMode, setLayoutMode] = useState('two-column'); // 'single' or 'two-column'
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDayName = format(new Date(), 'EEEE');
  const userEmail = preferences?.user_email;
  
  const [editingMeal, setEditingMeal] = useState(null);
  const [mealNoteInput, setMealNoteInput] = useState('');
  const [expandedSections, setExpandedSections] = useState(['morning', 'midday', 'afternoon', 'evening', 'night', 'anytime']);
  const [localViewMode, setLocalViewMode] = useState(viewMode);
  const [skippedTasks, setSkippedTasks] = useState([]);
  const [isReordering, setIsReordering] = useState(false);
  const [localTaskOrder, setLocalTaskOrder] = useState(preferences?.my_day_task_order || []);
  const [sleepForm, setSleepForm] = useState({ hours: '', quality: '' });
  const [showSleepForm, setShowSleepForm] = useState(false);
  
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

  // Fetch content goals for today
  const { data: contentGoal } = useQuery({
    queryKey: ['contentGoal', userEmail],
    queryFn: async () => {
      const weekStart = format(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)), 'yyyy-MM-dd');
      const goals = await base44.entities.ContentGoal.filter({ week_starting: weekStart, created_by: userEmail });
      return goals[0] || null;
    },
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

  const contentGoalMutation = useMutation({
    mutationFn: async ({ field, index }) => {
      if (!contentGoal) return;
      const items = [...(contentGoal[field] || [])];
      items[index] = { ...items[index], completed: !items[index].completed };
      return base44.entities.ContentGoal.update(contentGoal.id, { [field]: items });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contentGoal'] }),
  });

  // Build unified task list
  const allTasks = useMemo(() => {
    const tasks = [];
    
    // Core self-care tasks
    if (preferences?.is_bible_believer) {
      tasks.push({ id: 'bible_reading_morning', type: 'selfcare', label: 'Morning Bible reading', icon: BookOpen, color: 'text-amber-600', timeOfDay: 'morning', order: 1, externalLink: 'https://www.bible.com/reading-plans' });
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
    if (preferences?.is_bible_believer) {
      tasks.push({ id: 'bible_reading_night', type: 'selfcare', label: 'Night Bible reading', icon: BookOpen, color: 'text-indigo-600', timeOfDay: 'night', order: 95, externalLink: 'https://www.bible.com/reading-plans' });
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

    // Content goals for today
    if (contentGoal) {
      // Helper to check if schedule applies to today
      const isScheduledForToday = (schedule) => {
        // Check new days array format first
        if (schedule.days && schedule.days.length > 0) {
          return schedule.days.includes(todayDayName);
        }
        // Fallback to old single day format
        return schedule.day_of_week === todayDayName;
      };

      // Scheduled posts
      (contentGoal.scheduled_posts || []).forEach((post, idx) => {
        if (isScheduledForToday(post)) {
          const timeOfDay = getTimeOfDayFromTimeString(post.time);
          tasks.push({
            id: `content_post_${idx}_${todayDayName}`,
            type: 'content',
            field: 'scheduled_posts',
            index: idx,
            label: post.title || 'Create content',
            sublabel: `📱 Post @ ${post.time}`,
            icon: Video,
            color: 'text-blue-500',
            timeOfDay,
            order: getOrderFromTimeString(post.time),
            completed: post.completed,
          });
        }
      });

      // Scheduled lives
      (contentGoal.scheduled_lives || []).forEach((live, idx) => {
        if (isScheduledForToday(live)) {
          const timeOfDay = getTimeOfDayFromTimeString(live.time);
          tasks.push({
            id: `content_live_${idx}_${todayDayName}`,
            type: 'content',
            field: 'scheduled_lives',
            index: idx,
            label: live.title || 'Go LIVE',
            sublabel: `🔴 Live @ ${live.time}`,
            icon: Video,
            color: 'text-red-500',
            timeOfDay,
            order: getOrderFromTimeString(live.time),
            completed: live.completed,
          });
        }
      });

      // Scheduled engagement
      (contentGoal.scheduled_engagement || []).forEach((eng, idx) => {
        if (isScheduledForToday(eng)) {
          const timeOfDay = getTimeOfDayFromTimeString(eng.time);
          tasks.push({
            id: `content_engagement_${idx}_${todayDayName}`,
            type: 'content',
            field: 'scheduled_engagement',
            index: idx,
            label: 'Engage on besties\' posts',
            sublabel: `💬 @ ${eng.time}`,
            icon: Users,
            color: 'text-teal-500',
            timeOfDay,
            order: getOrderFromTimeString(eng.time),
            completed: eng.completed,
          });
        }
      });
    }

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
  }, [medications, supplements, pets, careReminders, contentGoal, liveSchedules, goals, preferences, todayDayName, mealLabels, localTaskOrder]);

  // Helper functions
  function parseTimeString(timeStr) {
    if (!timeStr) return null;
    
    // Handle HH:MM format (24-hour)
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      let hour = parseInt(parts[0]) || 0;
      const min = parseInt(parts[1]) || 0;
      return { hour, min };
    }
    
    // Handle formats like "10pm", "10 PM", "10:00 PM"
    const pmMatch = timeStr.toLowerCase().includes('pm');
    const amMatch = timeStr.toLowerCase().includes('am');
    const numMatch = timeStr.match(/(\d+)/);
    
    if (numMatch) {
      let hour = parseInt(numMatch[1]) || 12;
      if (pmMatch && hour < 12) hour += 12;
      if (amMatch && hour === 12) hour = 0;
      return { hour, min: 0 };
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
      return task.completed;
    }
    if (task.type === 'visit_live') {
      return selfCareLog?.[`visited_${task.scheduleId}`];
    }
    return false;
  };

  const handleSaveSleep = () => {
    if (sleepForm.hours && sleepForm.quality) {
      sleepMutation.mutate({ hours: parseFloat(sleepForm.hours), quality: sleepForm.quality });
      setShowSleepForm(false);
      setSleepForm({ hours: '', quality: '' });
    }
  };

  const handleToggleTask = (task) => {
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
      contentGoalMutation.mutate({ field: task.field, index: task.index });
    }
  };

  const handleSkipTask = (taskId) => {
    setSkippedTasks(prev => [...prev, taskId]);
  };

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
    let filtered = sectionTasks.filter(t => !skippedTasks.includes(t.id));
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
      <Card className="shadow-lg border-0 bg-gradient-to-br from-teal-50 to-cyan-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-6 h-6 text-amber-500" />
              My Day
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setLocalViewMode('detailed')} className="h-8">
                <List className="w-4 h-4 mr-1" /> Detailed
              </Button>
              <Badge variant={completedCount === totalCount ? "default" : "secondary"} 
                     className={completedCount === totalCount ? "bg-green-500" : ""}>
                {progressPercent}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
    );
  }

  // Separate tasks into variable/anytime vs scheduled/timed
  const variableTasks = allTasks.filter(t => t.timeOfDay === 'anytime');
  const scheduledTasks = allTasks.filter(t => t.timeOfDay !== 'anytime');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Main task card - takes 3 columns on large screens */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-teal-50 to-cyan-50 lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-6 h-6 text-amber-500" />
              My Day
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant={layoutMode === 'two-column' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setLayoutMode(layoutMode === 'two-column' ? 'single' : 'two-column')} 
                className="h-7 text-xs"
              >
                <Columns className="w-3 h-3 mr-1" /> {layoutMode === 'two-column' ? '2-Col' : '1-Col'}
              </Button>
              {isReordering ? (
                <Button size="sm" onClick={saveTaskOrder} className="bg-green-500 hover:bg-green-600 h-7 text-xs">
                  <Check className="w-3 h-3 mr-1" /> Done
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => {
                  setLocalTaskOrder(allTasks.map(t => t.id));
                  setIsReordering(true);
                }} className="h-7 text-xs">
                  <GripVertical className="w-3 h-3 mr-1" /> Reorder
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setLocalViewMode('compact')} className="h-7 text-xs">
                <Grid3X3 className="w-3 h-3 mr-1" /> Compact
              </Button>
              <Badge variant={completedCount === totalCount ? "default" : "secondary"} 
                     className={completedCount === totalCount ? "bg-green-500" : ""}>
                {completedCount}/{totalCount} • {progressPercent}%
              </Badge>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <motion.div 
              className="bg-gradient-to-r from-teal-500 to-green-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Auto-complete indicators */}
          {medications.length > 0 && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Pill className="w-4 h-4 text-pink-500" />
              <span className={allMedsTaken ? 'text-green-600' : 'text-gray-500'}>
                Medications: {allMedsTaken ? '✓ All taken' : `${medicationLogs.reduce((sum, l) => sum + (l.doses_taken?.length || 0), 0)} doses logged`}
              </span>
            </div>
          )}
          {supplements.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Pill className="w-4 h-4 text-amber-500" />
              <span className={allSuppsTaken ? 'text-green-600' : 'text-gray-500'}>
                Supplements: {allSuppsTaken ? '✓ All taken' : `${supplementLogs.reduce((sum, l) => sum + (l.doses_taken?.length || 0), 0)} doses logged`}
              </span>
            </div>
          )}
        </CardHeader>
      
      <CardContent>
        {layoutMode === 'two-column' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left column: Variable/As-Needed tasks */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-600">Flexible / As Needed</span>
              </div>
              {variableTasks.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No flexible tasks</p>
              ) : (
                getVisibleTasks(variableTasks).map(task => {
                  const Icon = task.icon;
                  const isComplete = isTaskComplete(task);
                  return (
                    <div
                      key={task.id}
                      onClick={() => !isReordering && (task.isLink ? null : handleToggleTask(task))}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                        isComplete 
                          ? 'bg-green-100 border border-green-300' 
                          : 'bg-white border border-gray-100 hover:border-teal-300'
                      }`}
                    >
                      <Checkbox checked={isComplete} className="pointer-events-none" />
                      <Icon className={`w-4 h-4 ${isComplete ? 'text-green-500' : task.color}`} />
                      <span className={`text-sm flex-1 ${isComplete ? 'line-through text-gray-400' : ''}`}>{task.label}</span>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Right column: Scheduled/Timed tasks */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-gray-600">Scheduled</span>
              </div>
              {['morning', 'midday', 'afternoon', 'evening', 'night'].map((time) => {
                const sectionTasks = tasksByTime[time] || [];
                if (sectionTasks.length === 0) return null;
                const visibleTasks = getVisibleTasks(sectionTasks);
                if (visibleTasks.length === 0) return null;
                const timeInfo = timeLabels[time];
                
                return (
                  <div key={time} className="mb-3">
                    <div className="flex items-center gap-1 mb-1">
                      <timeInfo.icon className={`w-3 h-3 ${timeInfo.color}`} />
                      <span className="text-xs font-medium text-gray-500">{timeInfo.label}</span>
                    </div>
                    <div className="space-y-1">
                      {visibleTasks.map(task => {
                        const Icon = task.icon;
                        const isComplete = isTaskComplete(task);
                        return (
                          <div
                            key={task.id}
                            onClick={() => !isReordering && (task.isLink ? null : handleToggleTask(task))}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                              isComplete 
                                ? 'bg-green-100 border border-green-300' 
                                : 'bg-white border border-gray-100 hover:border-teal-300'
                            }`}
                          >
                            <Checkbox checked={isComplete} className="pointer-events-none" />
                            <Icon className={`w-4 h-4 ${isComplete ? 'text-green-500' : task.color}`} />
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm ${isComplete ? 'line-through text-gray-400' : ''}`}>{task.label}</span>
                              {task.sublabel && <p className="text-xs text-gray-400 truncate">{task.sublabel}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Single column layout */
          <div className="space-y-4">
        {['morning', 'midday', 'afternoon', 'evening', 'night', 'anytime'].map((time) => {
          const sectionTasks = tasksByTime[time] || [];
          if (sectionTasks.length === 0) return null;
          
          const timeInfo = timeLabels[time];
          const TimeIcon = timeInfo.icon;
          const visibleTasks = getVisibleTasks(sectionTasks);
          const sectionComplete = sectionTasks.every(t => isTaskComplete(t) || skippedTasks.includes(t.id));
          const isExpanded = expandedSections.includes(time);
          
          if (visibleTasks.length === 0) return null;
          
          return (
            <div key={time} className={`rounded-xl ${timeInfo.bg} overflow-hidden`}>
              <button
                onClick={() => toggleSection(time)}
                className="w-full p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <TimeIcon className={`w-5 h-5 ${timeInfo.color}`} />
                  <span className="font-semibold text-gray-700">{timeInfo.label}</span>
                  <span className="text-xs text-gray-500">({visibleTasks.filter(t => isTaskComplete(t)).length}/{visibleTasks.length})</span>
                  {sectionComplete && <Check className="w-4 h-4 text-green-500" />}
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-3 pb-3 space-y-2"
                  >
                    {visibleTasks.map((task, taskIdx) => {
                      const Icon = task.icon;
                      const isComplete = isTaskComplete(task);
                      const mealNoteKey = task.hasMealNote ? getMealNoteKey(task.id) : null;
                      
                      const TaskContent = (
                        <div
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                            isComplete 
                              ? 'bg-green-100 border-2 border-green-300' 
                              : 'bg-white border-2 border-gray-100 hover:border-teal-300'
                          }`}
                        >
                          {/* Reorder handle */}
                          {isReordering && (
                            <div 
                              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
                              title="Drag to reorder"
                            >
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          
                          <div 
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => !isReordering && (task.isLink ? null : handleToggleTask(task))}
                          >
                            <Checkbox checked={isComplete} className="pointer-events-none" />
                            <Icon className={`w-5 h-5 ${isComplete ? 'text-green-500' : task.color}`} />
                            <div className="flex-1">
                              <span className={`font-medium ${isComplete ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                                {task.label}
                              </span>
                              {task.sublabel && (
                                <p className="text-xs text-gray-500">{task.sublabel}</p>
                              )}
                              {mealNoteKey && selfCareLog?.[mealNoteKey] && editingMeal !== task.id && (
                                <p className="text-sm text-gray-500 italic mt-1">
                                  📝 {selfCareLog[mealNoteKey]}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          {!isReordering && (
                            <div className="flex items-center gap-1">
                              {task.externalLink && (
                                <a
                                  href={task.externalLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 hover:bg-gray-100 rounded-lg"
                                  title="Open reading plan"
                                >
                                  <ExternalLink className="w-4 h-4 text-gray-400" />
                                </a>
                              )}
                              
                              {task.hasMealNote && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditMeal(task.id); }}
                                  className="p-2 hover:bg-gray-100 rounded-lg"
                                  title="Log what you ate"
                                >
                                  <Pencil className="w-4 h-4 text-gray-400" />
                                </button>
                              )}
                              
                              {!isComplete && (task.canSkip || (task.type !== 'selfcare' && task.type !== 'sleep')) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSkipTask(task.id); }}
                                  className="p-2 hover:bg-gray-100 rounded-lg"
                                  title="Skip for today"
                                >
                                  <SkipForward className="w-4 h-4 text-gray-400" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                      
                      return (
                        <div key={task.id}>
                          {TaskContent}
                          
                          {/* Inline sleep form */}
                          {task.type === 'sleep' && showSleepForm && !todaysSleep && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2 p-3 bg-white rounded-xl border-2 border-indigo-200"
                            >
                              <div className="flex flex-wrap gap-3 items-end">
                                <div className="flex-1 min-w-[100px]">
                                  <label className="text-xs text-gray-500 mb-1 block">Hours</label>
                                  <Input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="24"
                                    placeholder="7"
                                    value={sleepForm.hours}
                                    onChange={(e) => setSleepForm({...sleepForm, hours: e.target.value})}
                                    className="h-9"
                                  />
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                  <label className="text-xs text-gray-500 mb-1 block">Quality</label>
                                  <Select value={sleepForm.quality} onValueChange={(v) => setSleepForm({...sleepForm, quality: v})}>
                                    <SelectTrigger className="h-9">
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
                                <Button size="sm" onClick={handleSaveSleep} className="bg-indigo-500 hover:bg-indigo-600 h-9">
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setShowSleepForm(false)} className="h-9">
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </motion.div>
                          )}
                          
                          {/* Show logged sleep info */}
                          {task.type === 'sleep' && todaysSleep && (
                            <div className="mt-1 ml-11 text-xs text-gray-500">
                              ✓ {todaysSleep.hours}h • {todaysSleep.quality}
                            </div>
                          )}
                          
                          {/* Meal note input */}
                          <AnimatePresence>
                            {editingMeal === task.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 overflow-hidden"
                              >
                                <div className="flex gap-2 p-3 bg-white rounded-xl border-2 border-gray-200">
                                  <Input
                                    placeholder="What did you eat?"
                                    value={mealNoteInput}
                                    onChange={(e) => setMealNoteInput(e.target.value)}
                                    className="flex-1"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveMealNote();
                                      if (e.key === 'Escape') setEditingMeal(null);
                                    }}
                                  />
                                  <Button size="sm" onClick={handleSaveMealNote} className="bg-green-500 hover:bg-green-600">
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingMeal(null)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Skipped tasks recovery */}
        {skippedTasks.length > 0 && (
          <div className="p-3 bg-gray-100 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">Skipped today ({skippedTasks.length})</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSkippedTasks([])}
                className="text-xs"
              >
                Restore all
              </Button>
            </div>
          </div>
        )}
          </div>
        )}
      </CardContent>
    </Card>
      
      {/* Motivation sidebar - takes 1 column on large screens */}
      <div className="lg:col-span-1">
        <DailyMotivationSidebar
          greetingType={preferences?.greeting_type}
          userName={preferences?.user_email?.split('@')[0] || 'Friend'}
          struggles={preferences?.mental_health_struggles || []}
          improvements={preferences?.improvement_goals || []}
          isBibleBeliever={preferences?.is_bible_believer}
        />
      </div>
    </div>
  );
}