import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Smile, Sun, Cloud, CloudRain, CloudLightning, Pencil, Heart, 
  Utensils, Moon, Activity, Droplet, BookOpen, Calendar, 
  ChevronLeft, ChevronRight, CheckCircle2, Star, Target, 
  ListTodo, PawPrint, School, RefreshCw, Check
} from 'lucide-react';
import { format, subDays, addDays, isSameDay, parseISO } from 'date-fns';
import { useTheme } from '../components/shared/useTheme';
import Confetti from 'canvas-confetti';

// Import Gratitude Dialog to reuse it
import GratitudeDialog from '../components/quick-actions/GratitudeDialog';

export default function KidsJournal() {
  const queryClient = useQueryClient();
  const { user } = useTheme();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showGratitude, setShowGratitude] = useState(false);
  const [showMoodHistory, setShowMoodHistory] = useState(false);
  
  // Find my family profile (to get favorite color and assigned tasks)
  const { data: familyProfile } = useQuery({
    queryKey: ['myFamilyProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      
      // 1. Check for Parent-initiated Kid Mode
      const kidModeId = sessionStorage.getItem('kid_mode_id');
      if (kidModeId) {
        const members = await base44.entities.FamilyMember.filter({ id: kidModeId });
        return members[0] || null;
      }

      // 2. Check for Linked Child Account
      const members = await base44.entities.FamilyMember.filter({ linked_user_email: user.email });
      return members[0] || null;
    },
    enabled: !!user?.email
  });

  const bgColor = familyProfile?.favorite_color ? `${familyProfile.favorite_color}20` : '#F3E8FF'; // 20 opacity hex or default purple
  const accentColor = familyProfile?.favorite_color || '#9333EA';

  // --- DATA FETCHING ---

  // 1. Journal Entry
  const { data: journalEntry } = useQuery({
    queryKey: ['kidsJournal', date, user?.email, familyProfile?.id],
    queryFn: async () => {
      if (!user?.email) return null;
      
      const filter = { 
        date: date, 
        is_kids_journal: true 
      };

      // If in Kid Mode or using family profile, filter by that member ID preferably
      if (familyProfile?.id) {
        filter.family_member_id = familyProfile.id;
      } else {
        filter.created_by = user.email;
      }

      const entries = await base44.entities.JournalEntry.filter(filter);
      
      // Fallback: check legacy entries created by email if checking by family_id yielded nothing
      if (entries.length === 0 && familyProfile?.id) {
         const legacyEntries = await base44.entities.JournalEntry.filter({ 
            date: date, 
            created_by: user.email, 
            is_kids_journal: true 
         });
         return legacyEntries[0] || null;
      }

      return entries[0] || null;
    },
    enabled: !!user?.email
  });

  // 2. Assigned Tasks (Chores & Homework)
  const { data: tasks = [] } = useQuery({
    queryKey: ['kidsTasks', date, user?.email, familyProfile?.id],
    queryFn: async () => {
      if (!user?.email) return [];
      
      // Fetch tasks assigned to me or created by me
      const myTasks = await base44.entities.Task.filter({ 
        // Logic: assigned to me via family ID OR created by me
        // We can't do complex OR in one filter, so fetch simpler set
        status: ['pending', 'completed']
      });

      return myTasks.filter(t => {
        // Must match date (due date) OR be overdue/pending
        const isForDate = t.due_date === date;
        const isAssignedToMe = familyProfile && t.assigned_to_family_id === familyProfile.id;
        const isCreatedByMe = t.created_by === user.email;
        
        // Show if: (Assigned to me OR Created by me) AND (Due today OR (Pending & Overdue))
        if (!isAssignedToMe && !isCreatedByMe) return false;
        
        if (isForDate) return true;
        if (t.status === 'pending' && t.due_date < date) return true; // Show overdue
        
        return false;
      });
    },
    enabled: !!user?.email
  });

  // 3. Pets
  const { data: pets = [] } = useQuery({
    queryKey: ['activePets'],
    queryFn: () => base44.entities.Pet.filter({ is_active: true }) // Assuming Pet has is_active or just fetch all
  });

  // 4. Daily Bible Verse (Mock for now, or fetch from API if available)
  const bibleVerses = [
    { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
    { text: "Be strong and courageous. Do not be afraid.", ref: "Joshua 1:9" },
    { text: "Trust in the Lord with all your heart.", ref: "Proverbs 3:5" },
    { text: "This is the day the Lord has made; let us rejoice!", ref: "Psalm 118:24" }
  ];
  // Simple rotation based on date
  const dayOfYear = Math.floor((new Date(date) - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const dailyVerse = bibleVerses[dayOfYear % bibleVerses.length];


  // --- STATE ---
  const [entryData, setEntryData] = useState({
    feeling: '',
    weather: '',
    goal_today: '',
    goal_completed: false,
    water_intake: 0,
    sleep_hours: 0,
    activity_desc: '',
    happened_today: '',
    breakfast: '',
    lunch: '',
    dinner: '',
    snacks: ''
  });

  useEffect(() => {
    if (journalEntry) {
      setEntryData({
        feeling: journalEntry.mood || journalEntry.kids_data?.feeling || '',
        weather: journalEntry.kids_data?.weather || '',
        goal_today: journalEntry.kids_data?.goal_today || '',
        goal_completed: journalEntry.kids_data?.goal_completed || false,
        water_intake: journalEntry.kids_data?.water_intake || 0,
        sleep_hours: journalEntry.kids_data?.sleep_hours || 0,
        activity_desc: journalEntry.kids_data?.activity_desc || '',
        happened_today: journalEntry.content?.replace('Kids Journal Entry: ', '') || '',
        breakfast: journalEntry.kids_data?.breakfast || '',
        lunch: journalEntry.kids_data?.lunch || '',
        dinner: journalEntry.kids_data?.dinner || '',
        snacks: journalEntry.kids_data?.snacks || ''
      });
    } else {
      setEntryData({
        feeling: '',
        weather: '',
        goal_today: '',
        goal_completed: false,
        water_intake: 0,
        sleep_hours: 0,
        activity_desc: '',
        happened_today: '',
        breakfast: '',
        lunch: '',
        dinner: '',
        snacks: ''
      });
    }
  }, [journalEntry, date]);

  // --- MUTATIONS ---

  const saveJournalMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        date: date,
        created_by: user.email,
        family_member_id: familyProfile?.id, // Link to family member
        is_kids_journal: true,
        content: `Kids Journal Entry: ${data.happened_today}`,
        mood: data.feeling,
        kids_data: data
      };

      if (journalEntry) {
        return await base44.entities.JournalEntry.update(journalEntry.id, payload);
      } else {
        return await base44.entities.JournalEntry.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['kidsJournal']);
    }
  });

  // Save on auto-save or blur (simplified: save button for now, or effect)
  // Let's use a debounced save or manual save button? 
  // User asked for a "best ever" journal, auto-save is nice. 
  // But let's stick to a big "Save" button for satisfaction + auto-save on specific actions.

  const updateEntry = (field, value) => {
    const newData = { ...entryData, [field]: value };
    setEntryData(newData);
    // Auto save for small interactions
    if (['feeling', 'weather', 'goal_completed', 'water_intake', 'sleep_hours'].includes(field)) {
      saveJournalMutation.mutate(newData);
    }
  };

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }) => {
      await base44.entities.Task.update(taskId, { 
        status: status,
        completed_date: status === 'completed' ? format(new Date(), 'yyyy-MM-dd') : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['kidsTasks']);
      Confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  });

  const pushTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      // Push to next day
      const nextDay = format(addDays(new Date(date), 1), 'yyyy-MM-dd');
      await base44.entities.Task.update(taskId, { due_date: nextDay });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['kidsTasks']);
    }
  });

  // Fetch user preferences for custom moods
  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user?.email
  });

  // Default moods
  const defaultMoodOptions = [
    { emoji: '😄', label: 'Great', value: 'great' },
    { emoji: '🙂', label: 'Good', value: 'good' },
    { emoji: '😐', label: 'Okay', value: 'okay' },
    { emoji: '😔', label: 'Low', value: 'low' },
    { emoji: '😰', label: 'Anxious', value: 'anxious' },
    { emoji: '😡', label: 'Angry', value: 'angry' },
    { emoji: '😢', label: 'Sad', value: 'sad' },
  ];

  // Build full mood list: defaults + custom
  const allMoods = [...defaultMoodOptions, ...(preferences?.custom_mood_options || [])];
  
  // Get top 7 selected moods (or defaults if not configured)
  const topMoodValues = preferences?.top_mood_emojis || defaultMoodOptions.slice(0, 7).map(m => m.value);
  const moods = allMoods.filter(m => topMoodValues.includes(m.value));

  const weatherIcons = [
    { icon: Sun, value: 'sunny', color: 'text-yellow-500' },
    { icon: Cloud, value: 'cloudy', color: 'text-gray-400' },
    { icon: CloudRain, value: 'rainy', color: 'text-blue-400' },
    { icon: CloudLightning, value: 'stormy', color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans transition-colors duration-500" style={{ backgroundColor: bgColor }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* === HEADER (Mobile Only) === */}
        <div className="lg:hidden col-span-1">
          <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            {familyProfile?.nickname || user?.full_name?.split(' ')[0]}'s Journal
          </h1>
        </div>

        {/* === LEFT SIDEBAR === */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. DATE NAVIGATOR */}
          <Card className="border-4 border-white/50 bg-white/80 backdrop-blur shadow-lg rounded-3xl overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setDate(format(subDays(new Date(date), 1), 'yyyy-MM-dd'))}>
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">Viewing</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent font-bold text-lg text-gray-800 outline-none w-36"
                  />
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDate(format(addDays(new Date(date), 1), 'yyyy-MM-dd'))}>
                <ChevronRight className="w-6 h-6" />
              </Button>
            </CardContent>
          </Card>

          {/* 2. SPIRIT & SOUL */}
          <Card className="border-4 border-indigo-100 bg-indigo-50/80 shadow-lg rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Heart className="w-5 h-5" /> Spirit & Soul
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bible Verse */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
                <p className="font-serif italic text-lg text-gray-700">"{dailyVerse.text}"</p>
                <p className="text-right text-xs font-bold text-indigo-400 mt-2">— {dailyVerse.ref}</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => window.location.href = '/PrayerRequests'}
                  className="bg-white hover:bg-indigo-100 text-indigo-600 border border-indigo-200 h-auto py-3 flex-col gap-1"
                >
                  <Heart className="w-6 h-6" />
                  <span className="text-xs">Prayers</span>
                </Button>
                <Button 
                  onClick={() => setShowGratitude(true)}
                  className="bg-white hover:bg-pink-100 text-pink-600 border border-pink-200 h-auto py-3 flex-col gap-1"
                >
                  <Star className="w-6 h-6" />
                  <span className="text-xs">Gratitude</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 3. GOALS */}
          <Card className="border-4 border-yellow-100 bg-yellow-50/80 shadow-lg rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Target className="w-5 h-5" /> My Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-3 rounded-xl border border-yellow-200 shadow-sm">
                <label className="text-xs font-bold text-yellow-600 uppercase mb-1 block">Goal for Today</label>
                <Input 
                  value={entryData.goal_today} 
                  onChange={(e) => updateEntry('goal_today', e.target.value)}
                  className="border-none shadow-none text-lg p-0 h-auto focus-visible:ring-0 placeholder:text-gray-300"
                  placeholder="e.g. Clean my room..."
                />
              </div>
              
              <div 
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                  entryData.goal_completed 
                    ? 'bg-green-100 border-green-300 text-green-700' 
                    : 'bg-white border-dashed border-gray-300 hover:border-yellow-400'
                }`}
                onClick={() => {
                   if (!entryData.goal_completed) Confetti();
                   updateEntry('goal_completed', !entryData.goal_completed);
                }}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  entryData.goal_completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                }`}>
                  {entryData.goal_completed && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="font-bold">{entryData.goal_completed ? 'Goal Achieved! 🎉' : 'I did it!'}</span>
              </div>

              <div className="flex justify-end">
                 <Button 
                    variant="link" 
                    size="sm" 
                    className="text-yellow-600 h-auto p-0"
                    onClick={() => window.location.href = '/Goals'}
                 >
                    Set Future Goals →
                 </Button>
              </div>
            </CardContent>
          </Card>

          {/* 4. TASKS & CHORES */}
          <Card className="border-4 border-blue-100 bg-blue-50/80 shadow-lg rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <ListTodo className="w-5 h-5" /> My Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-gray-400 bg-white/50 rounded-xl border border-dashed border-blue-200">
                  <p>All caught up! 🎉</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 flex items-start gap-3 group">
                    <div 
                       className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                         task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-blue-400'
                       }`}
                       onClick={() => toggleTaskMutation.mutate({ taskId: task.id, status: task.status === 'completed' ? 'pending' : 'completed' })}
                    >
                       {task.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                       <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                         {task.title}
                       </p>
                       {task.due_date < date && task.status !== 'completed' && (
                         <div className="flex items-center gap-2 mt-1">
                           <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded">Overdue</span>
                           <button 
                             onClick={() => pushTaskMutation.mutate(task.id)}
                             className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                           >
                             <RefreshCw className="w-3 h-3" /> Push to Tomorrow
                           </button>
                         </div>
                       )}
                       {task.category === 'pet' && (
                         <span className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                           <PawPrint className="w-3 h-3" /> Pet Care
                         </span>
                       )}
                       {task.category === 'school' && (
                         <span className="text-xs text-indigo-500 flex items-center gap-1 mt-1">
                           <School className="w-3 h-3" /> Homework
                         </span>
                       )}
                    </div>
                  </div>
                ))
              )}
              
              {/* Quick Add Buttons for Categories (Just links for now or simplified adders) */}
              <div className="pt-2 flex gap-2 justify-center">
                 {pets.length > 0 && (
                   <Button variant="ghost" size="sm" className="text-orange-600 bg-orange-50 hover:bg-orange-100">
                      <PawPrint className="w-4 h-4 mr-1" /> Pet
                   </Button>
                 )}
                 <Button variant="ghost" size="sm" className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100">
                    <School className="w-4 h-4 mr-1" /> Homework
                 </Button>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* === RIGHT MAIN CONTENT === */}
        <div className="lg:col-span-8 space-y-6">
           
           {/* 1. MAIN JOURNAL AREA (Replaces Doodle Zone) */}
           <Card className="h-[500px] border-4 border-purple-200 bg-white shadow-xl rounded-3xl flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 bg-purple-100 p-4 border-b border-purple-200 flex justify-between items-center z-10">
                 <h2 className="text-2xl font-bold text-purple-800" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    My Story Today
                 </h2>
                 <Button 
                   onClick={() => saveJournalMutation.mutate(entryData)} 
                   disabled={saveJournalMutation.isPending}
                   className="bg-purple-600 hover:bg-purple-700 rounded-full"
                 >
                   {saveJournalMutation.isPending ? 'Saving...' : 'Save Entry'}
                 </Button>
              </div>
              <CardContent className="p-0 flex-1 pt-16">
                 <Textarea 
                    value={entryData.happened_today}
                    onChange={(e) => updateEntry('happened_today', e.target.value)}
                    className="w-full h-full border-0 resize-none p-6 text-lg leading-loose focus-visible:ring-0"
                    placeholder="Dear Diary, today was..."
                    style={{ backgroundImage: 'linear-gradient(transparent 31px, #E5E7EB 32px)', backgroundSize: '100% 32px', lineHeight: '32px' }}
                 />
              </CardContent>
           </Card>

           {/* 2. HEALTH & WELLNESS SECTION */}
           <Card className="border-4 border-green-100 bg-green-50/80 shadow-lg rounded-3xl">
              <CardHeader className="pb-2">
                 <CardTitle className="flex items-center gap-2 text-green-700">
                    <Activity className="w-5 h-5" /> Health & Wellness
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 
                 {/* Moods & Weather Row */}
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-green-100">
                       <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">My Mood</label>
                          <button onClick={() => setShowMoodHistory(true)} className="text-xs text-green-600 hover:underline">View History</button>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {moods.map(m => (
                             <button
                                key={m.value}
                                onClick={() => updateEntry('feeling', m.value)}
                                className={`text-2xl p-2 rounded-xl transition-all ${entryData.feeling === m.value ? 'bg-green-100 scale-110 shadow-sm ring-2 ring-green-400' : 'hover:bg-gray-50 grayscale hover:grayscale-0'}`}
                                title={m.label}
                             >
                                {m.emoji}
                             </button>
                          ))}
                       </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-blue-100">
                       <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Weather</label>
                       <div className="flex justify-around">
                          {weatherIcons.map(w => (
                             <button
                                key={w.value}
                                onClick={() => updateEntry('weather', w.value)}
                                className={`p-2 rounded-xl transition-all ${entryData.weather === w.value ? 'bg-blue-100 scale-110 shadow-sm ring-2 ring-blue-400' : 'hover:bg-gray-50'}`}
                             >
                                <w.icon className={`w-6 h-6 ${w.color}`} />
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Stats Row */}
                 <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                       <Droplet className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                       <div className="flex items-center justify-center gap-1">
                          <Input 
                             type="number" 
                             value={entryData.water_intake} 
                             onChange={(e) => updateEntry('water_intake', e.target.value)}
                             className="w-12 h-8 text-center bg-white border-blue-200" 
                          />
                          <span className="text-xs text-blue-700">cups</span>
                       </div>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-center">
                       <Moon className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
                       <div className="flex items-center justify-center gap-1">
                          <Input 
                             type="number" 
                             value={entryData.sleep_hours} 
                             onChange={(e) => updateEntry('sleep_hours', e.target.value)}
                             className="w-12 h-8 text-center bg-white border-indigo-200" 
                          />
                          <span className="text-xs text-indigo-700">hours</span>
                       </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                       <Activity className="w-6 h-6 text-green-500 mx-auto mb-1" />
                       <Input 
                          placeholder="Activity..." 
                          value={entryData.activity_desc} 
                          onChange={(e) => updateEntry('activity_desc', e.target.value)}
                          className="h-8 text-center bg-white border-green-200 text-sm" 
                       />
                    </div>
                 </div>

                 {/* Meals */}
                 <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <h3 className="text-sm font-bold text-orange-700 flex items-center gap-2 mb-3">
                       <Utensils className="w-4 h-4" /> Today's Meals
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                       <Input 
                          placeholder="🍳 Breakfast" 
                          value={entryData.breakfast} 
                          onChange={(e) => updateEntry('breakfast', e.target.value)}
                          className="bg-white border-orange-200"
                       />
                       <Input 
                          placeholder="🥪 Lunch" 
                          value={entryData.lunch} 
                          onChange={(e) => updateEntry('lunch', e.target.value)}
                          className="bg-white border-orange-200"
                       />
                       <Input 
                          placeholder="🍝 Dinner" 
                          value={entryData.dinner} 
                          onChange={(e) => updateEntry('dinner', e.target.value)}
                          className="bg-white border-orange-200"
                       />
                       <Input 
                          placeholder="🍎 Snacks" 
                          value={entryData.snacks} 
                          onChange={(e) => updateEntry('snacks', e.target.value)}
                          className="bg-white border-orange-200"
                       />
                    </div>
                 </div>

              </CardContent>
           </Card>

        </div>
      </div>

      {/* DIALOGS */}
      <GratitudeDialog 
        isOpen={showGratitude} 
        onClose={() => setShowGratitude(false)}
        onSave={(data) => {
           // Here we should probably save to a gratitude log entity or append to journal
           // For now, let's append to "happened_today" if simple, or create a separate gratitude log
           // The user requested linking to gratitudes, implying a system.
           // Ideally, we create a GratitudeLog entity. Assuming it exists or JournalEntry handles it.
           // JournalEntry has `kids_data`, we could add `gratitude_list`.
           // Let's just append to `happened_today` for simplicity in this view:
           const text = `\n\nI am grateful for: ${data.gratitude_entry}`;
           updateEntry('happened_today', entryData.happened_today + text);
           setShowGratitude(false);
           Confetti();
        }} 
      />

      <Dialog open={showMoodHistory} onOpenChange={setShowMoodHistory}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Mood History</DialogTitle>
            </DialogHeader>
            <div className="py-4">
               <p className="text-gray-500 text-center italic">Mood history chart coming soon!</p>
               {/* Placeholder for history - in real app would fetch past entries */}
            </div>
            <DialogFooter>
               <Button onClick={() => setShowMoodHistory(false)}>Close</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}