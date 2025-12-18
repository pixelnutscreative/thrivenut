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
import { BookOpen, Calendar, Sparkles, Brain, Shield, ChevronDown, ChevronUp, Search, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import AIReframingCard from '../components/journal/AIReframingCard';
import EncryptionModal from '../components/journal/EncryptionModal';
import { useTheme } from '../components/shared/useTheme';
import CryptoJS from 'crypto-js';

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
  { value: 'reflection', label: 'Reflection', description: 'Looking back and learning' }
];

export default function Journal() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [showAIReframe, setShowAIReframe] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState({});
  
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState({}); // { id: content }
  const [unlockingId, setUnlockingId] = useState(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customMood, setCustomMood] = useState('');
  const [isCustomMood, setIsCustomMood] = useState(false);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    title: '',
    content: '',
    mood_tag: 'reflective',
    entry_type: 'general',
    ai_reframe_enabled: false,
    is_encrypted: false
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
    queryKey: ['journalEntries', user?.email],
    queryFn: async () => {
      return await base44.entities.JournalEntry.filter({ created_by: user.email }, '-date', 20);
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
      setIsAddModalOpen(false);
      setCustomMood('');
      setIsCustomMood(false);
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
    
    const finalMood = isCustomMood ? customMood : formData.mood_tag;
    const submissionData = { ...formData, mood_tag: finalMood };

    if (formData.is_encrypted) {
      setShowEncryptionModal(true);
    } else {
      createEntryMutation.mutate(submissionData);
    }
  };

  const handleEncryptionComplete = (key) => {
    const finalMood = isCustomMood ? customMood : formData.mood_tag;
    const encryptedContent = CryptoJS.AES.encrypt(formData.content, key).toString();
    createEntryMutation.mutate({
      ...formData,
      mood_tag: finalMood,
      content: encryptedContent,
      is_encrypted: true
    });
  };

  const handleUnlockEntry = (key) => {
    try {
      const entry = entries.find(e => e.id === unlockingId);
      if (!entry) return;
      
      const bytes = CryptoJS.AES.decrypt(entry.content, key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!originalText) throw new Error('Invalid key');
      
      setDecryptedContent(prev => ({ ...prev, [unlockingId]: originalText }));
      setUnlockingId(null);
    } catch (e) {
      alert('Incorrect key. Unable to decrypt.');
    }
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

  const { isDark, bgClass, textClass, cardBgClass, subtextClass } = useTheme();

  // Filter entries
  const filteredEntries = (entries || []).filter(entry => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      entry.title?.toLowerCase().includes(term) ||
      entry.content?.toLowerCase().includes(term) ||
      entry.mood_tag?.toLowerCase().includes(term)
    );
  });

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-purple-600" />
              My Journal
            </h1>
            <p className={subtextClass}>Your private space for thoughts, reflections, and healing</p>
          </motion.div>
          
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search entries..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-9 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
          />
        </div>

        {/* Disclaimer */}
        <Alert className={isDark ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'}>
          <Shield className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <AlertDescription className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
            Your journal is completely private. AI suggestions are supportive tools, not professional mental health advice.
            If you're in crisis, please reach out to a mental health professional.
          </AlertDescription>
        </Alert>

        {/* Entry Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-900 border-gray-800' : ''}`}>
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-2 ${textClass}`}>
                <Sparkles className="w-5 h-5 text-amber-500" />
                New Entry
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Entry Type Selection */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${textClass}`}>What kind of entry is this?</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {entryTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({...formData, entry_type: type.value})}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        formData.entry_type === type.value
                          ? `border-purple-500 ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`
                          : `${isDark ? 'border-gray-600 hover:border-purple-400' : 'border-gray-200 hover:border-purple-300'}`
                      }`}
                    >
                      <div className={`font-medium text-sm ${textClass}`}>{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {isVentingMode && (
                <Alert className={isDark ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-200'}>
                  <Brain className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <AlertDescription className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                    <strong>Venting Mode:</strong> Let it all out! After you write, AI can help you 
                    gain perspective and reframe negative thoughts. This is a safe space. 💜
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${textClass}`}>Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-medium ${textClass}`}>Mood</label>
                  <div className="flex gap-2">
                    {!isCustomMood ? (
                      <Select 
                        value={formData.mood_tag} 
                        onValueChange={(val) => {
                          if (val === 'custom') {
                            setIsCustomMood(true);
                          } else {
                            setFormData({...formData, mood_tag: val});
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select mood..." />
                        </SelectTrigger>
                        <SelectContent>
                          {moodTags.map(tag => (
                            <SelectItem key={tag.value} value={tag.value}>
                              <span className="mr-2">{tag.emoji}</span>
                              {tag.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">✨ Custom Mood...</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <Input 
                          placeholder="How are you feeling?"
                          value={customMood}
                          onChange={(e) => setCustomMood(e.target.value)}
                          className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                          autoFocus
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setIsCustomMood(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium ${textClass}`}>Title (Optional)</label>
                <Input
                  placeholder="Give your entry a title..."
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium ${textClass}`}>
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
                  className={`resize-none ${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
                />
              </div>

              {/* Encryption Toggle */}
              <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-lg`}>
                <div className="flex items-center gap-3">
                  <Shield className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                  <div>
                    <Label className={`font-medium ${textClass}`}>Encrypt Entry</Label>
                    <p className={`text-sm ${subtextClass}`}>
                      Lock with a private key. Only you can read this.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.is_encrypted}
                  onCheckedChange={(c) => setFormData(prev => ({ ...prev, is_encrypted: c, ai_reframe_enabled: !c && prev.ai_reframe_enabled }))}
                />
              </div>

              {/* AI Reframe Toggle (Disabled if Encrypted) */}
              {preferences?.enable_ai_journaling !== false && !formData.is_encrypted && (
                <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'} rounded-lg`}>
                  <div className="flex items-center gap-3">
                    <Brain className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <div>
                      <Label className={`font-medium ${textClass}`}>Get AI Perspective & Reframing</Label>
                      <p className={`text-sm ${subtextClass}`}>
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
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.content.trim() || createEntryMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Save Entry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Previous Entries */}
        <div className="space-y-4">
          <h2 className={`text-2xl font-bold ${textClass} flex items-center gap-2`}>
            <Calendar className="w-6 h-6" />
            Previous Entries
          </h2>

          {filteredEntries && filteredEntries.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((entry, index) => {
                const moodTag = moodTags.find(tag => tag.value === entry.mood_tag);
                const entryType = entryTypes.find(t => t.value === entry.entry_type);
                const isExpanded = expandedEntries[entry.id];
                const hasAISuggestions = entry.ai_suggestions;
                
                // If it's a custom mood not in the list
                const displayMood = moodTag || (entry.mood_tag ? { 
                  label: entry.mood_tag, 
                  emoji: '✨', 
                  color: 'bg-indigo-100 text-indigo-800' 
                } : null);

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`shadow-md hover:shadow-lg transition-shadow h-full ${cardBgClass}`}>
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className={`text-sm ${subtextClass} mb-1`}>
                              {format(new Date(entry.date), 'MMM d, yyyy')}
                            </p>
                            {entry.title && (
                              <h3 className={`text-lg font-bold ${textClass} line-clamp-1`}>{entry.title}</h3>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {entryType && entryType.value !== 'general' && (
                              <Badge variant="outline" className="text-[10px]">{entryType.label}</Badge>
                            )}
                            {displayMood && (
                              <Badge className={`${displayMood.color} border-0 text-[10px]`}>
                                <span className="mr-1">{displayMood.emoji}</span>
                                {displayMood.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {entry.is_encrypted ? (
                          decryptedContent[entry.id] ? (
                            <div className="relative">
                              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap leading-relaxed`}>
                                {decryptedContent[entry.id]}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute -top-8 right-0 text-xs text-gray-400"
                                onClick={() => setDecryptedContent(prev => {
                                  const next = {...prev};
                                  delete next[entry.id];
                                  return next;
                                })}
                              >
                                Lock
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                              <Shield className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500 mb-3">This entry is encrypted.</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setUnlockingId(entry.id);
                                  setShowEncryptionModal(true);
                                }}
                              >
                                Unlock to Read
                              </Button>
                            </div>
                          )
                        ) : (
                          <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap leading-relaxed`}>
                            {entry.content}
                          </p>
                        )}

                        {/* Show AI suggestions if they exist */}
                        {hasAISuggestions && (
                          <div className="mt-4">
                            <button
                              onClick={() => toggleEntryExpand(entry.id)}
                              className={`flex items-center gap-2 ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} text-sm font-medium`}
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
                                  className={`mt-3 p-4 ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'} rounded-lg`}
                                >
                                  <pre className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>
                                    {JSON.parse(entry.ai_suggestions).validation}
                                  </pre>
                                  {entry.user_reflection && (
                                    <div className={`mt-3 p-3 ${isDark ? 'bg-gray-700' : 'bg-white'} rounded-lg`}>
                                      <p className={`text-sm font-medium ${subtextClass} mb-1`}>My Reflection:</p>
                                      <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{entry.user_reflection}</p>
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
            <Card className={`shadow-md ${cardBgClass}`}>
              <CardContent className="p-12 text-center">
                <BookOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`${subtextClass} text-lg`}>No journal entries yet</p>
                <p className={subtextClass}>Start writing to capture your thoughts and memories</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EncryptionModal 
        isOpen={showEncryptionModal}
        onClose={() => {
          setShowEncryptionModal(false);
          setUnlockingId(null);
        }}
        onEncrypt={handleEncryptionComplete}
        onUnlock={handleUnlockEntry}
        isSettingKey={!unlockingId}
      />
    </div>
  );
}