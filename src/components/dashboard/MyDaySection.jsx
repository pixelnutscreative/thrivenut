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
  MessageSquare, SkipForward, ArrowRight, Loader2, ArrowUp, ArrowDown,
  Bed, Smile, NotebookPen, GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format } from 'date-fns';

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
  anytime: { label: 'Anytime', icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50' }
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
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDayName = format(new Date(), 'EEEE');
  const userEmail = preferences?.user_email;
  
  const [editingMeal, setEditingMeal] = useState(null);
  const [mealNoteInput, setMealNoteInput] = useState('');
  const [expandedSections, setExpandedSections] = useState(['morning', 'midday', 'afternoon', 'evening', 'night', 'anytime']);
  const [localViewMode, setLocalViewMode] = useState(viewMode);
  const [skippedTasks, setSkippedTasks] = useState([]);
  
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
      tasks.push({ id: 'bible_reading_morning', type: 'selfcare', label: 'Morning Bible reading', icon: BookOpen, color: 'text-amber-600', timeOfDay: 'morning', order: 1 });
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
    tasks.push({ id: 'physical_activity', type: 'selfcare', label: 'Physical activity', icon: Dumbbell, color: 'text-red-500', timeOfDay: 'afternoon', order: 70 });
    
    // Dinner
    tasks.push({ id: 'dinner_completed', type: 'selfcare', label: 'Dinner', sublabel: mealLabels.dinner, icon: Utensils, color: 'text-purple-500', timeOfDay: 'evening', order: 80, hasMealNote: true });
    
    // Night tasks
    tasks.push({ id: 'brushed_teeth_night', type: 'selfcare', label: 'Brush teeth (PM)', icon: Sparkles, color: 'text-indigo-500', timeOfDay: 'night', order: 90 });
    if (preferences?.is_bible_believer) {
      tasks.push({ id: 'bible_reading_night', type: 'selfcare', label: 'Night Bible reading', icon: BookOpen, color: 'text-indigo-600', timeOfDay: 'night', order: 95 });
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
      // Scheduled posts
      (contentGoal.scheduled_posts || []).forEach((post, idx) => {
        if (post.day_of_week === todayDayName) {
          const timeOfDay = getTimeOfDayFromTimeString(post.time);
          tasks.push({
            id: `content_post_${idx}`,
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
        if (live.day_of_week === todayDayName) {
          const timeOfDay = getTimeOfDayFromTimeString(live.time);
          tasks.push({
            id: `content_live_${idx}`,
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
        if (eng.day_of_week === todayDayName) {
          const timeOfDay = getTimeOfDayFromTimeString(eng.time);
          tasks.push({
            id: `content_engagement_${idx}`,
            type: 'content',
            field: 'scheduled_engagement',
            index: idx,
            label: 'Engagement time',
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

    // Sort by timeOfDay then order
    const timeOrder = { morning: 1, midday: 2, afternoon: 3, evening: 4, night: 5, anytime: 6 };
    return tasks.sort((a, b) => {
      const timeCompare = (timeOrder[a.timeOfDay] || 6) - (timeOrder[b.timeOfDay] || 6);
      if (timeCompare !== 0) return timeCompare;
      return (a.order || 50) - (b.order || 50);
    });
  }, [medications, supplements, pets, careReminders, contentGoal, liveSchedules, preferences, todayDayName, mealLabels]);

  // Helper functions
  function getTimeOfDayFromTimeString(timeStr) {
    if (!timeStr) return 'anytime';
    const hour = parseInt(timeStr.split(':')[0]) || parseInt(timeStr) || 12;
    if (hour < 10) return 'morning';
    if (hour < 12) return 'midday';
    if (hour < 17) return 'afternoon';
    if (hour < 20) return 'evening';
    return 'night';
  }

  function getOrderFromTimeString(timeStr) {
    if (!timeStr) return 50;
    const parts = timeStr.split(':');
    const hour = parseInt(parts[0]) || 12;
    const min = parseInt(parts[1]) || 0;
    return hour * 10 + min / 6;
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

  const handleToggleTask = (task) => {
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

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-teal-50 to-cyan-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-6 h-6 text-amber-500" />
            My Day
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocalViewMode('compact')} className="h-8">
              <Grid3X3 className="w-4 h-4 mr-1" /> Compact
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
      
      <CardContent className="space-y-4">
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
                    {visibleTasks.map((task) => {
                      const Icon = task.icon;
                      const isComplete = isTaskComplete(task);
                      const mealNoteKey = task.hasMealNote ? getMealNoteKey(task.id) : null;
                      
                      return (
                        <div key={task.id}>
                          <div
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                              isComplete 
                                ? 'bg-green-100 border-2 border-green-300' 
                                : 'bg-white border-2 border-gray-100 hover:border-teal-300'
                            }`}
                          >
                            <div 
                              className="flex items-center gap-3 flex-1 cursor-pointer"
                              onClick={() => handleToggleTask(task)}
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
                            <div className="flex items-center gap-1">
                              {task.hasMealNote && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditMeal(task.id); }}
                                  className="p-2 hover:bg-gray-100 rounded-lg"
                                  title="Log what you ate"
                                >
                                  <Pencil className="w-4 h-4 text-gray-400" />
                                </button>
                              )}
                              
                              {!isComplete && task.type !== 'selfcare' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSkipTask(task.id); }}
                                  className="p-2 hover:bg-gray-100 rounded-lg"
                                  title="Skip for today"
                                >
                                  <SkipForward className="w-4 h-4 text-gray-400" />
                                </button>
                              )}
                            </div>
                          </div>
                          
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
      </CardContent>
    </Card>
  );
}