import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Smile, Sun, Cloud, CloudRain, CloudLightning, Pencil, Heart, Utensils, Moon, Activity, Droplet } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '../components/shared/useTheme';

export default function KidsJournal() {
  const queryClient = useQueryClient();
  const { user } = useTheme();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [journalData, setJournalData] = useState({
    feeling: '',
    weather: '',
    grateful_for: '',
    prayer_requests: '',
    goal_today: '',
    bible_verse: '',
    breakfast: '',
    lunch: '',
    dinner: '',
    snacks: '',
    water_intake: 0,
    sleep_hours: 0,
    activity_desc: '',
    happened_today: '',
    doodle_url: '' // Placeholder for doodle
  });

  // Load existing entry
  const { data: existingEntry } = useQuery({
    queryKey: ['kidsJournal', date, user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const entries = await base44.entities.JournalEntry.filter({ 
        date: date, 
        created_by: user.email, 
        is_kids_journal: true 
      });
      return entries[0] || null;
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    if (existingEntry) {
      setJournalData(existingEntry.kids_data || {});
    } else {
      setJournalData({
        feeling: '',
        weather: '',
        grateful_for: '',
        prayer_requests: '',
        goal_today: '',
        bible_verse: '',
        breakfast: '',
        lunch: '',
        dinner: '',
        snacks: '',
        water_intake: 0,
        sleep_hours: 0,
        activity_desc: '',
        happened_today: '',
        doodle_url: ''
      });
    }
  }, [existingEntry, date]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingEntry) {
        return await base44.entities.JournalEntry.update(existingEntry.id, {
          kids_data: data,
          content: `Kids Journal Entry: ${data.happened_today}`, // Sync to main content for searchability
          mood: data.feeling
        });
      } else {
        return await base44.entities.JournalEntry.create({
          date: date,
          created_by: user.email,
          is_kids_journal: true,
          kids_data: data,
          content: `Kids Journal Entry: ${data.happened_today}`,
          mood: data.feeling
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['kidsJournal']);
      alert('Saved!');
    }
  });

  const moods = [
    { icon: '😃', value: 'happy' },
    { icon: '🙂', value: 'good' },
    { icon: '😐', value: 'okay' },
    { icon: '😕', value: 'confused' },
    { icon: '😢', value: 'sad' },
    { icon: '😠', value: 'mad' },
    { icon: '😴', value: 'tired' },
    { icon: '😎', value: 'cool' },
  ];

  const weatherIcons = [
    { icon: Sun, value: 'sunny', color: 'text-yellow-500' },
    { icon: Cloud, value: 'cloudy', color: 'text-gray-400' },
    { icon: CloudRain, value: 'rainy', color: 'text-blue-400' },
    { icon: CloudLightning, value: 'stormy', color: 'text-purple-500' },
  ];

  const updateField = (field, value) => {
    setJournalData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-purple-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-purple-200">
        {/* Header */}
        <div className="bg-purple-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-4xl font-handwriting text-purple-800" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            {user?.full_name?.split(' ')[0] || 'My'}'s Journal
          </h1>
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2">
            <span className="text-purple-600 font-bold">Date:</span>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="outline-none text-purple-800 font-medium"
            />
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Feelings */}
            <div className="bg-purple-50 p-4 rounded-2xl border-2 border-purple-100">
              <h3 className="font-handwriting text-xl text-purple-800 mb-2">My feelings today...</h3>
              <div className="grid grid-cols-4 gap-2">
                {moods.map(m => (
                  <button
                    key={m.value}
                    onClick={() => updateField('feeling', m.value)}
                    className={`text-3xl p-2 rounded-xl transition-all ${journalData.feeling === m.value ? 'bg-white shadow-md scale-110' : 'hover:bg-purple-100'}`}
                  >
                    {m.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Weather */}
            <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100">
              <h3 className="font-handwriting text-xl text-blue-800 mb-2">Weather</h3>
              <div className="flex justify-around">
                {weatherIcons.map(w => (
                  <button
                    key={w.value}
                    onClick={() => updateField('weather', w.value)}
                    className={`p-2 rounded-xl transition-all ${journalData.weather === w.value ? 'bg-white shadow-md scale-110' : 'hover:bg-blue-100'}`}
                  >
                    <w.icon className={`w-8 h-8 ${w.color}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Grateful */}
            <div className="bg-pink-50 p-4 rounded-2xl border-2 border-pink-100">
              <h3 className="font-handwriting text-xl text-pink-800 mb-2">I am grateful for...</h3>
              <Textarea 
                value={journalData.grateful_for}
                onChange={(e) => updateField('grateful_for', e.target.value)}
                className="bg-white border-pink-200 min-h-[80px]"
                placeholder="Write something..."
              />
            </div>

            {/* Prayer */}
            <div className="bg-green-50 p-4 rounded-2xl border-2 border-green-100">
              <h3 className="font-handwriting text-xl text-green-800 mb-2">Prayer Requests</h3>
              <Textarea 
                value={journalData.prayer_requests}
                onChange={(e) => updateField('prayer_requests', e.target.value)}
                className="bg-white border-green-200 min-h-[80px]"
                placeholder="Dear God..."
              />
            </div>
          </div>

          {/* Middle Column - Doodle & Writing */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-200 h-[400px] relative">
              <h3 className="font-handwriting text-xl text-gray-800 mb-2 absolute top-4 left-4">Doodle Zone</h3>
              <div className="w-full h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-white">
                <span className="text-sm">Draw on paper and upload, or use a drawing tool (Coming Soon!)</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Goals */}
              <div className="bg-yellow-50 p-4 rounded-2xl border-2 border-yellow-100">
                <h3 className="font-handwriting text-xl text-yellow-800 mb-2">My goal today is...</h3>
                <Input 
                  value={journalData.goal_today}
                  onChange={(e) => updateField('goal_today', e.target.value)}
                  className="bg-white border-yellow-200"
                />
              </div>

              {/* Bible Verse */}
              <div className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100">
                <h3 className="font-handwriting text-xl text-indigo-800 mb-2">Daily Bible Verse</h3>
                <Textarea 
                  value={journalData.bible_verse}
                  onChange={(e) => updateField('bible_verse', e.target.value)}
                  className="bg-white border-indigo-200 min-h-[60px]"
                  placeholder="Verse of the day..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Food & Summary */}
        <div className="p-6 bg-purple-50 border-t-4 border-purple-200">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Meals */}
            <div className="space-y-3">
              <h3 className="font-handwriting text-2xl text-purple-800 flex items-center gap-2">
                <Utensils className="w-6 h-6" /> Meals
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-20 font-bold text-purple-700">Breakfast:</span>
                  <Input value={journalData.breakfast} onChange={(e) => updateField('breakfast', e.target.value)} className="bg-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 font-bold text-purple-700">Lunch:</span>
                  <Input value={journalData.lunch} onChange={(e) => updateField('lunch', e.target.value)} className="bg-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 font-bold text-purple-700">Dinner:</span>
                  <Input value={journalData.dinner} onChange={(e) => updateField('dinner', e.target.value)} className="bg-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 font-bold text-purple-700">Snacks:</span>
                  <Input value={journalData.snacks} onChange={(e) => updateField('snacks', e.target.value)} className="bg-white" />
                </div>
              </div>
            </div>

            {/* Health & Summary */}
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-purple-100">
                <div className="text-center">
                  <Droplet className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number" 
                      value={journalData.water_intake} 
                      onChange={(e) => updateField('water_intake', e.target.value)}
                      className="w-12 h-8 text-center" 
                    />
                    <span className="text-xs">cups</span>
                  </div>
                </div>
                <div className="text-center">
                  <Moon className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number" 
                      value={journalData.sleep_hours} 
                      onChange={(e) => updateField('sleep_hours', e.target.value)}
                      className="w-12 h-8 text-center" 
                    />
                    <span className="text-xs">hrs</span>
                  </div>
                </div>
                <div className="text-center flex-1 ml-4">
                  <Activity className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <Input 
                    placeholder="Activity/Play" 
                    value={journalData.activity_desc} 
                    onChange={(e) => updateField('activity_desc', e.target.value)}
                    className="h-8 text-center" 
                  />
                </div>
              </div>

              <div>
                <h3 className="font-handwriting text-xl text-purple-800 mb-2">This is what happened today...</h3>
                <Textarea 
                  value={journalData.happened_today}
                  onChange={(e) => updateField('happened_today', e.target.value)}
                  className="bg-white min-h-[100px]"
                  placeholder="Tell your story..."
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              onClick={() => saveMutation.mutate(journalData)} 
              className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 rounded-full font-handwriting"
            >
              Save My Day
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}