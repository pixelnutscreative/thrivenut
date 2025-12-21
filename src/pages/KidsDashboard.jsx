import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Sun, Lock, Unlock, Save, Plus, X, Calendar, Smile, BookOpen, CheckCircle2, ChevronLeft, LogOut } from 'lucide-react';
import { format } from 'date-fns';

// Simple Weather Widget Mock
const WeatherWidget = () => (
  <div className="bg-gradient-to-br from-blue-400 to-blue-300 p-4 rounded-2xl text-white shadow-lg flex items-center justify-between">
    <div>
      <h3 className="text-lg font-bold">Today's Weather</h3>
      <p className="text-3xl font-bold">75°F</p>
    </div>
    <Sun className="w-12 h-12 text-yellow-300 animate-pulse" />
  </div>
);

export default function KidsDashboard() {
  const [kidProfile, setKidProfile] = useState(null);
  const [activeSection, setActiveSection] = useState('home'); // home, journal, tasks, profile
  const [pinInput, setPinInput] = useState('');
  const [isLocked, setIsLocked] = useState(false); // For journal lock
  
  useEffect(() => {
    // Check if we are in "Kid Mode" via session storage
    const kidId = sessionStorage.getItem('kid_mode_id');
    if (kidId) {
      base44.entities.FamilyMember.filter({ id: kidId }).then(res => {
        if (res.length > 0) setKidProfile(res[0]);
      });
    } else {
      // Redirect to family select or home if not in kid mode
      window.location.href = '/FamilyMembers';
    }
  }, []);

  const handleExit = () => {
    if (confirm("Exit Kid Mode?")) {
      sessionStorage.removeItem('kid_mode_id');
      window.location.href = '/FamilyMembers';
    }
  };

  if (!kidProfile) return <div className="min-h-screen bg-yellow-50 flex items-center justify-center text-2xl font-bold text-yellow-600">Loading your world... 🚀</div>;

  return (
    <div className="min-h-screen bg-yellow-50 font-sans pb-20">
      {/* KID HEADER */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between border-b-4 border-yellow-200">
        <div className="flex items-center gap-3">
           {kidProfile.profile_image_url ? (
            <img src={kidProfile.profile_image_url} className="w-12 h-12 rounded-full border-2 border-yellow-400" />
           ) : (
            <div className="w-12 h-12 rounded-full bg-yellow-200 flex items-center justify-center text-2xl">😊</div>
           )}
           <div>
             <h1 className="text-xl font-black text-gray-800">Hi, {kidProfile.nickname || kidProfile.name}! 👋</h1>
             <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Let's have a great day!</p>
           </div>
        </div>
        <Button variant="ghost" onClick={handleExit} className="text-red-400 hover:text-red-600">
          <LogOut className="w-6 h-6" />
        </Button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="p-4 max-w-md mx-auto space-y-6">
        
        {activeSection === 'home' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <WeatherWidget />
            
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setActiveSection('tasks')} className="bg-green-100 p-6 rounded-2xl border-b-4 border-green-300 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
                <span className="font-bold text-green-800">My Tasks</span>
              </button>
              <button onClick={() => setActiveSection('journal')} className="bg-purple-100 p-6 rounded-2xl border-b-4 border-purple-300 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center gap-2">
                <BookOpen className="w-10 h-10 text-purple-600" />
                <span className="font-bold text-purple-800">My Journal</span>
              </button>
              <button onClick={() => setActiveSection('profile')} className="bg-pink-100 p-6 rounded-2xl border-b-4 border-pink-300 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center gap-2">
                <Smile className="w-10 h-10 text-pink-600" />
                <span className="font-bold text-pink-800">My Stuff</span>
              </button>
              <button className="bg-blue-100 p-6 rounded-2xl border-b-4 border-blue-300 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                <Cloud className="w-10 h-10 text-blue-600" />
                <span className="font-bold text-blue-800">Games (Soon)</span>
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                Today's Habits
              </h3>
              <KidsHabitList kidId={kidProfile.id} />
            </div>
          </motion.div>
        )}

        {activeSection === 'journal' && (
          <KidsJournalSection kidId={kidProfile.id} onBack={() => setActiveSection('home')} />
        )}

        {activeSection === 'tasks' && (
          <KidsTaskSection kidId={kidProfile.id} onBack={() => setActiveSection('home')} />
        )}

        {activeSection === 'profile' && (
          <KidsProfileSection profile={kidProfile} onBack={() => setActiveSection('home')} />
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function KidsHabitList({ kidId }) {
  // Mock habits for now - in real app, fetch from Habit entity filtered by assigned_to
  const habits = [
    { id: 1, title: "Brush Teeth", icon: "🦷", done: false },
    { id: 2, title: "Make Bed", icon: "🛏️", done: true },
    { id: 3, title: "Drink Water", icon: "💧", done: false },
  ];
  return (
    <div className="space-y-3">
      {habits.map(h => (
        <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{h.icon}</span>
            <span className={`font-bold ${h.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{h.title}</span>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${h.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
            {h.done && <CheckCircle2 className="w-5 h-5" />}
          </div>
        </div>
      ))}
    </div>
  );
}

function KidsJournalSection({ kidId, onBack }) {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [mood, setMood] = useState('happy');

  // Query entries specifically for this kid
  const { data: journalEntries, refetch } = useQuery({
    queryKey: ['kidJournal', kidId],
    queryFn: () => base44.entities.JournalEntry.filter({ family_member_id: kidId }, '-date'),
  });

  const createEntryMutation = useMutation({
    mutationFn: (data) => base44.entities.JournalEntry.create({
      ...data,
      family_member_id: kidId,
      is_private: true, // Default to private!
      date: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => {
      setNewEntry('');
      refetch();
    }
  });

  const moods = [
    { id: 'happy', icon: '😄', label: 'Happy' },
    { id: 'sad', icon: '😢', label: 'Sad' },
    { id: 'excited', icon: '🤩', label: 'Excited' },
    { id: 'mad', icon: '😠', label: 'Mad' },
    { id: 'tired', icon: '😴', label: 'Tired' },
  ];

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button size="icon" variant="ghost" onClick={onBack}><ChevronLeft /></Button>
        <h2 className="text-2xl font-black text-purple-800">My Secret Journal 🤫</h2>
      </div>

      <Card className="border-2 border-purple-200 shadow-purple-100">
        <CardContent className="p-4 space-y-4">
          <Label className="text-purple-700 font-bold">How are you feeling?</Label>
          <div className="flex justify-between">
            {moods.map(m => (
              <button 
                key={m.id}
                onClick={() => setMood(m.id)}
                className={`flex flex-col items-center gap-1 transition-all ${mood === m.id ? 'scale-125' : 'opacity-60'}`}
              >
                <span className="text-3xl">{m.icon}</span>
                <span className="text-[10px] font-bold uppercase">{m.label}</span>
              </button>
            ))}
          </div>

          <Textarea 
            placeholder="Write about your day... (Parents can't see this!)" 
            className="min-h-[150px] border-purple-200 focus:border-purple-400 text-lg"
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
          />

          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700 font-bold text-lg h-12 rounded-xl"
            onClick={() => createEntryMutation.mutate({ content: newEntry, mood_tag: mood, title: 'My Entry' })}
            disabled={!newEntry.trim()}
          >
            Save to My Journal 🔒
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {journalEntries?.map(entry => (
          <div key={entry.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-gray-400 text-xs">{format(new Date(entry.created_date), 'MMM d, h:mm a')}</span>
              <span className="text-xl">{moods.find(m => m.id === entry.mood_tag)?.icon}</span>
            </div>
            <p className="text-gray-800">{entry.content}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function KidsTaskSection({ kidId, onBack }) {
  const { data: tasks, refetch } = useQuery({
    queryKey: ['kidTasks', kidId],
    queryFn: () => base44.entities.Task.filter({ assigned_to_family_id: kidId, status: 'pending' }),
  });

  const completeTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.update(id, { status: 'completed', completed_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => refetch()
  });

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button size="icon" variant="ghost" onClick={onBack}><ChevronLeft /></Button>
        <h2 className="text-2xl font-black text-green-800">My Missions 🚀</h2>
      </div>

      {(!tasks || tasks.length === 0) ? (
        <div className="text-center py-10 opacity-50">
          <div className="text-6xl mb-4">🎉</div>
          <p className="font-bold">No missions right now!</p>
          <p>You're all caught up.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task.id} className="bg-white p-4 rounded-2xl border-b-4 border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{task.title}</h3>
                {task.priority === 'high' && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">Important!</span>}
              </div>
              <Button 
                onClick={() => completeTaskMutation.mutate(task.id)}
                className="bg-green-500 hover:bg-green-600 rounded-full w-12 h-12 flex items-center justify-center p-0"
              >
                <CheckCircle2 className="w-6 h-6 text-white" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function KidsProfileSection({ profile, onBack }) {
  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button size="icon" variant="ghost" onClick={onBack}><ChevronLeft /></Button>
        <h2 className="text-2xl font-black text-pink-800">My Stuff ✨</h2>
      </div>

      <div className="bg-white rounded-2xl p-6 text-center space-y-4 shadow-sm">
        {profile.profile_image_url ? (
          <img src={profile.profile_image_url} className="w-24 h-24 rounded-full mx-auto border-4 border-pink-200" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-pink-100 mx-auto flex items-center justify-center text-4xl">😎</div>
        )}
        <div>
          <h3 className="text-2xl font-bold">{profile.name}</h3>
          <p className="text-gray-500">{profile.age} years old</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader><CardTitle className="text-orange-800 text-sm">Interests</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{profile.interests || 'No interests added yet!'}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader><CardTitle className="text-blue-800 text-sm">Fav Color</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: profile.favorite_color || 'gray' }}></div>
              <span className="text-sm">{profile.favorite_color || 'None'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Gift className="w-4 h-4" /> My Wishlist</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {profile.wish_list?.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-pink-500">•</span>
                <span>{item.item}</span>
              </li>
            ))}
            {(!profile.wish_list || profile.wish_list.length === 0) && <p className="text-gray-400 italic">No wishes yet!</p>}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}