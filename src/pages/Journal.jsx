import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Calendar, Sparkles, Brain, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import AIReframingCard from '../components/journal/AIReframingCard';

const moodTags = [
  { value: 'grateful', label: 'Grateful', emoji: '🙏', color: 'bg-green-100 text-green-800' },
  { value: 'reflective', label: 'Reflective', emoji: '🤔', color: 'bg-purple-100 text-purple-800' },
  { value: 'excited', label: 'Excited', emoji: '🎉', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', color: 'bg-orange-100 text-orange-800' },
  { value: 'peaceful', label: 'Peaceful', emoji: '☮️', color: 'bg-blue-100 text-blue-800' },
  { value: 'motivated', label: 'Motivated', emoji: '💪', color: 'bg-red-100 text-red-800' },
  { value: 'tired', label: 'Tired', emoji: '😴', color: 'bg-gray-100 text-gray-800' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤', color: 'bg-rose-100 text-rose-800' },
  { value: 'sad', label: 'Sad', emoji: '😢', color: 'bg-slate-100 text-slate-800' },
  { value: 'angry', label: 'Angry', emoji: '😠', color: 'bg-red-100 text-red-800' }
];

const entryTypes = [
  { value: 'general', label: 'General', description: 'Regular journal entry' },
  { value: 'venting', label: 'Venting', description: 'Let it all out - AI can help reframe' },
  { value: 'gratitude', label: 'Gratitude', description: 'What are you thankful for?' },
  { value: 'reflection', label: 'Reflection', description: 'Looking back and learning' },
  { value: 'goal_setting', label: 'Goal Setting', description: 'Planning and dreaming' }
];

export default function Journal() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [showAIReframe, setShowAIReframe] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState({});
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    title: '',
    content: '',
    mood_tag: 'reflective',
    entry_type: 'general',
    ai_reframe_enabled: false
  });

  React.useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const prefs = await base44.entities.UserPreferences.filter({ user_email: userData.email });
      if (prefs[0]) {
        setPreferences(prefs[0]);
        setFormData(prev => ({
          ...prev,
          ai_reframe_enabled: prefs[0].enable_ai_journaling !== false
        }));
      }
    };
    loadUser();
  }, []);

  const { data: entries } = useQuery({
    queryKey: ['journalEntries'],
    queryFn: async () => {
      return await base44.entities.JournalEntry.list('-date', 20);
    },
    enabled: !!user,
  });

  const createEntryMutation = useMutation({
    mutationFn: async (entryData) => {
      return await base44.entities.JournalEntry.create(entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        title: '',
        content: '',
        mood_tag: 'reflective',
        entry_type: 'general',
        ai_reframe_enabled: preferences?.enable_ai_journaling !== false
      });
      setShowAIReframe(false);
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.JournalEntry.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });

  const handleSubmit = () => {
    if (!formData.content.trim()) return;
    createEntryMutation.mutate(formData);
  };

  const handleSaveAISuggestions = (suggestions) => {
    setFormData(prev => ({ ...prev, ai_suggestions: suggestions }));
  };

  const handleSaveReflection = (reflection) => {
    setFormData(prev => ({ ...prev, user_reflection: reflection }));
  };

  const toggleEntryExpand = (id) => {
    setExpandedEntries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isVentingMode = formData.entry_type === 'venting';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-purple-600" />
            My Journal
          </h1>
          <p className="text-gray-600">Your private space for thoughts, reflections, and healing</p>
        </motion.div>

        {/* Disclaimer */}
        <Alert className="bg-purple-50 border-purple-200">
          <Shield className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-sm text-purple-800">
            Your journal is completely private. AI suggestions are supportive tools, not professional mental health advice.
            If you're in crisis, please reach out to a mental health professional.
          </AlertDescription>
        </Alert>

        {/* New Entry Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                New Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Entry Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">What kind of entry is this?</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {entryTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({...formData, entry_type: type.value})}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        formData.entry_type === type.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {isVentingMode && (
                <Alert className="bg-amber-50 border-amber-200">
                  <Brain className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-800">
                    <strong>Venting Mode:</strong> Let it all out! After you write, AI can help you 
                    gain perspective and reframe negative thoughts. This is a safe space. 💜
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mood</label>
                  <Select value={formData.mood_tag} onValueChange={(val) => setFormData({...formData, mood_tag: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {moodTags.map(tag => (
                        <SelectItem key={tag.value} value={tag.value}>
                          <span className="mr-2">{tag.emoji}</span>
                          {tag.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Title (Optional)</label>
                <Input
                  placeholder="Give your entry a title..."
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isVentingMode ? "Let it all out... (this is a safe space)" : "Your thoughts..."}
                </label>
                <Textarea
                  placeholder={isVentingMode 
                    ? "Write whatever's on your mind. Don't hold back. No one will judge you here..."
                    : "What's on your mind today?"
                  }
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={8}
                  className="resize-none"
                />
              </div>

              {/* AI Reframe Toggle */}
              {preferences?.enable_ai_journaling !== false && (
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-indigo-600" />
                    <div>
                      <Label className="font-medium">Get AI Perspective & Reframing</Label>
                      <p className="text-sm text-gray-600">
                        Helpful questions and alternative viewpoints
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={showAIReframe}
                    onCheckedChange={setShowAIReframe}
                  />
                </div>
              )}

              {/* AI Reframing Card */}
              <AnimatePresence>
                {showAIReframe && formData.content.length > 20 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <AIReframingCard
                      journalContent={formData.content}
                      onSaveSuggestions={handleSaveAISuggestions}
                      onSaveReflection={handleSaveReflection}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Button 
                onClick={handleSubmit}
                disabled={!formData.content.trim() || createEntryMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-lg"
              >
                Save Entry
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Previous Entries */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Previous Entries
          </h2>

          {entries && entries.length > 0 ? (
            <div className="space-y-4">
              {entries.map((entry, index) => {
                const moodTag = moodTags.find(tag => tag.value === entry.mood_tag);
                const entryType = entryTypes.find(t => t.value === entry.entry_type);
                const isExpanded = expandedEntries[entry.id];
                const hasAISuggestions = entry.ai_suggestions;
                
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              {format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}
                            </p>
                            {entry.title && (
                              <h3 className="text-xl font-bold text-gray-800">{entry.title}</h3>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {entryType && entryType.value !== 'general' && (
                              <Badge variant="outline">{entryType.label}</Badge>
                            )}
                            {moodTag && (
                              <Badge className={`${moodTag.color} border-0`}>
                                <span className="mr-1">{moodTag.emoji}</span>
                                {moodTag.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {entry.content}
                        </p>

                        {/* Show AI suggestions if they exist */}
                        {hasAISuggestions && (
                          <div className="mt-4">
                            <button
                              onClick={() => toggleEntryExpand(entry.id)}
                              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                            >
                              <Brain className="w-4 h-4" />
                              {isExpanded ? 'Hide' : 'Show'} AI Insights
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 p-4 bg-indigo-50 rounded-lg"
                                >
                                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {JSON.parse(entry.ai_suggestions).validation}
                                  </pre>
                                  {entry.user_reflection && (
                                    <div className="mt-3 p-3 bg-white rounded-lg">
                                      <p className="text-sm font-medium text-gray-600 mb-1">My Reflection:</p>
                                      <p className="text-gray-700">{entry.user_reflection}</p>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="shadow-md">
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">No journal entries yet</p>
                <p className="text-gray-400">Start writing to capture your thoughts and memories</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}