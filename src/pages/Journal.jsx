import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Calendar, Sparkles, Brain, Shield, ChevronDown, ChevronUp, Search, Plus, X, Eye, EyeOff, Filter, ArrowUpDown, Music, History, Trash2, RotateCcw, ExternalLink, Type, Star } from 'lucide-react';
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
  { value: 'reflection', label: 'Reflection', description: 'Looking back and learning' },
  { value: 'poetry', label: 'Poem / Lyrics', description: 'Express yourself with verse or song' }
];

// Curated Google Fonts
const JOURNAL_FONTS = [
  { name: 'Inter', family: 'sans-serif' },
  { name: 'Dancing Script', family: 'cursive' },
  { name: 'Pacifico', family: 'cursive' },
  { name: 'Caveat', family: 'cursive' },
  { name: 'Shadows Into Light', family: 'cursive' },
  { name: 'Indie Flower', family: 'cursive' },
  { name: 'Kalam', family: 'cursive' },
  { name: 'Sacramento', family: 'cursive' },
  { name: 'Courier Prime', family: 'monospace' },
  { name: 'Special Elite', family: 'cursive' },
  { name: 'Lora', family: 'serif' },
  { name: 'Merriweather', family: 'serif' },
  { name: 'Nunito', family: 'sans-serif' },
  { name: 'Quicksand', family: 'sans-serif' },
  { name: 'Patrick Hand', family: 'cursive' },
  { name: 'Amatic SC', family: 'cursive' },
  { name: 'Architects Daughter', family: 'cursive' },
  { name: 'Playfair Display', family: 'serif' },
  { name: 'Roboto Mono', family: 'monospace' },
  { name: 'Coming Soon', family: 'cursive' },
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
  
  // Sorting and Filtering
  const [showHidden, setShowHidden] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest
  const [filterMood, setFilterMood] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    title: '',
    content: '',
    mood_tag: 'reflective',
    entry_type: 'general',
    ai_reframe_enabled: false,
    is_encrypted: false,
    music_style: '',
    revisions: [],
    font: 'Inter'
  });
  
  const [showRevisions, setShowRevisions] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);
  const [showFontPicker, setShowFontPicker] = useState(false);

  // Load fonts
  React.useEffect(() => {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Architects+Daughter&family=Caveat:wght@400;700&family=Coming+Soon&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@400;700&family=Indie+Flower&family=Kalam:wght@300;400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Pacifico&family=Patrick+Hand&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Quicksand:wght@300..700&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Sacramento&family=Shadows+Into+Light&family=Special+Elite&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

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
        ai_reframe_enabled: preferences?.enable_ai_journaling !== false,
        music_style: '',
        revisions: [],
        font: preferences?.recent_journal_fonts?.[0] || 'Inter'
      });
      setCurrentEntryId(null);
      setShowAIReframe(false);
      setIsAddModalOpen(false);
      setCustomMood('');
      setIsCustomMood(false);
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return await base44.entities.UserPreferences.update(preferences.id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    }
  });

  const toggleFavoriteFont = (fontName) => {
    const favorites = preferences?.favorite_journal_fonts || [];
    let newFavorites;
    if (favorites.includes(fontName)) {
      newFavorites = favorites.filter(f => f !== fontName);
    } else {
      newFavorites = [...favorites, fontName];
    }
    setPreferences(prev => ({ ...prev, favorite_journal_fonts: newFavorites }));
    updatePreferencesMutation.mutate({ favorite_journal_fonts: newFavorites });
  };

  const selectFont = (fontName) => {
    setFormData(prev => ({ ...prev, font: fontName }));
    
    // Update recent fonts
    const recents = preferences?.recent_journal_fonts || [];
    const newRecents = [fontName, ...recents.filter(f => f !== fontName)].slice(0, 5);
    
    // Optimistically update
    setPreferences(prev => ({ ...prev, recent_journal_fonts: newRecents }));
    updatePreferencesMutation.mutate({ recent_journal_fonts: newRecents });
    
    setShowFontPicker(false);
  };

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Fetch current entry to save as revision
      const currentEntry = entries.find(e => e.id === id);
      if (currentEntry) {
        const newRevision = {
          date: new Date().toISOString(),
          content: currentEntry.content,
          title: currentEntry.title,
          music_style: currentEntry.music_style
        };
        const updatedRevisions = [...(currentEntry.revisions || []), newRevision];
        data.revisions = updatedRevisions;
      }
      return await base44.entities.JournalEntry.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });

  const restoreRevisionMutation = useMutation({
    mutationFn: async ({ id, revision }) => {
      return await base44.entities.JournalEntry.update(id, {
        content: revision.content,
        title: revision.title,
        music_style: revision.music_style
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    }
  });

  const deleteRevisionsMutation = useMutation({
    mutationFn: async ({ id, revisionIndex = null, deleteAll = false }) => {
      const entry = entries.find(e => e.id === id);
      if (!entry) return;
      
      let newRevisions = [];
      if (!deleteAll) {
        newRevisions = entry.revisions.filter((_, index) => index !== revisionIndex);
      }
      
      return await base44.entities.JournalEntry.update(id, { revisions: newRevisions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    }
  });

  const handleSubmit = () => {
    if (!formData.content.trim()) return;
    
    const finalMood = isCustomMood ? customMood : formData.mood_tag;
    const submissionData = { ...formData, mood_tag: finalMood };

    if (formData.is_encrypted) {
      setShowEncryptionModal(true);
    } else {
      if (currentEntryId) {
        updateEntryMutation.mutate({ id: currentEntryId, data: submissionData });
        setIsAddModalOpen(false);
      } else {
        createEntryMutation.mutate(submissionData);
      }
    }
  };

  const openEdit = (entry) => {
    setFormData({
      date: entry.date,
      title: entry.title || '',
      content: entry.content,
      mood_tag: entry.mood_tag || 'reflective',
      entry_type: entry.entry_type || 'general',
      ai_reframe_enabled: entry.ai_reframe_enabled,
      is_encrypted: entry.is_encrypted,
      music_style: entry.music_style || '',
      revisions: entry.revisions || [],
      font: entry.font || 'Inter' // Fallback for old entries
    });
    setCurrentEntryId(entry.id);
    setIsAddModalOpen(true);
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
  const isPoetryMode = formData.entry_type === 'poetry';

  const { isDark, bgClass, textClass, cardBgClass, subtextClass } = useTheme();

  // Filter and Sort entries
  const filteredEntries = (entries || [])
    .filter(entry => {
      // Search filter
      const term = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        entry.title?.toLowerCase().includes(term) ||
        entry.content?.toLowerCase().includes(term) ||
        entry.mood_tag?.toLowerCase().includes(term);
        
      // Mood filter
      const matchesMood = filterMood === 'all' || entry.mood_tag === filterMood;
      
      // Type filter
      const matchesType = filterType === 'all' || entry.entry_type === filterType;
      
      // Hidden filter
      const matchesHidden = showHidden ? entry.is_hidden : !entry.is_hidden;
      
      return matchesSearch && matchesMood && matchesType && matchesHidden;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
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
            onClick={() => {
              setFormData({
                date: format(new Date(), 'yyyy-MM-dd'),
                title: '',
                content: '',
                mood_tag: 'reflective',
                entry_type: 'general',
                ai_reframe_enabled: preferences?.enable_ai_journaling !== false,
                music_style: '',
                revisions: [],
                font: preferences?.recent_journal_fonts?.[0] || 'Inter'
              });
              setCurrentEntryId(null);
              setIsAddModalOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>

        {/* Controls Bar: Search, Filter, Sort, View Hidden */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search entries..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-9 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Type Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className={`w-[130px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                  <Filter className="w-3 h-3 mr-2 text-gray-500" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {entryTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Mood Filter */}
              <Select value={filterMood} onValueChange={setFilterMood}>
                <SelectTrigger className={`w-[130px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                  <SelectValue placeholder="Mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moods</SelectItem>
                  {moodTags.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="mr-2">{t.emoji}</span>{t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className={`w-[130px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                  <ArrowUpDown className="w-3 h-3 mr-2 text-gray-500" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>

              {/* Show Hidden Toggle */}
              <Button
                variant={showHidden ? "secondary" : "outline"}
                onClick={() => setShowHidden(!showHidden)}
                className={showHidden ? "bg-purple-100 text-purple-700 border-purple-200" : `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
                title={showHidden ? "Viewing Hidden Entries" : "View Hidden Entries"}
              >
                {showHidden ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                {showHidden ? 'Hidden' : 'Hidden'}
              </Button>
            </div>
          </div>
          
          {showHidden && (
            <Alert className="bg-purple-50 border-purple-200">
              <Eye className="w-4 h-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                You are viewing hidden entries. Toggle "Hidden" off to see your main journal.
              </AlertDescription>
            </Alert>
          )}
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
          <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-900 border-gray-800' : ''}`}>
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <DialogTitle className={`flex items-center gap-2 ${textClass}`}>
                <Sparkles className="w-5 h-5 text-amber-500" />
                {currentEntryId ? 'Edit Entry' : 'New Entry'}
              </DialogTitle>
              
              <div className="flex items-center gap-3 pr-8">
                {/* Font Picker Toggle */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowFontPicker(!showFontPicker)}
                    className="flex items-center gap-2 border border-dashed border-gray-300"
                  >
                    <Type className="w-4 h-4" />
                    <span style={{ fontFamily: formData.font }}>{formData.font}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                  
                  {showFontPicker && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-2 max-h-80 overflow-y-auto">
                      {/* Favorites */}
                      {(preferences?.favorite_journal_fonts || []).length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs font-semibold text-gray-400 px-2 mb-1">Favorites</div>
                          {preferences.favorite_journal_fonts.map(fontName => (
                            <button
                              key={fontName}
                              onClick={() => selectFont(fontName)}
                              className={`w-full text-left px-2 py-1.5 rounded hover:bg-purple-50 flex items-center justify-between group ${formData.font === fontName ? 'bg-purple-50 text-purple-700' : 'text-gray-700'}`}
                            >
                              <span style={{ fontFamily: fontName }}>{fontName}</span>
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" onClick={(e) => { e.stopPropagation(); toggleFavoriteFont(fontName); }} />
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Recent */}
                      {(preferences?.recent_journal_fonts || []).length > 0 && (
                        <div className="mb-2 border-t pt-2">
                          <div className="text-xs font-semibold text-gray-400 px-2 mb-1">Recent</div>
                          {preferences.recent_journal_fonts.filter(f => !(preferences?.favorite_journal_fonts || []).includes(f)).map(fontName => (
                            <button
                              key={fontName}
                              onClick={() => selectFont(fontName)}
                              className={`w-full text-left px-2 py-1.5 rounded hover:bg-purple-50 flex items-center justify-between group ${formData.font === fontName ? 'bg-purple-50 text-purple-700' : 'text-gray-700'}`}
                            >
                              <span style={{ fontFamily: fontName }}>{fontName}</span>
                              <Star className="w-3 h-3 text-gray-300 hover:text-yellow-400 group-hover:block hidden" onClick={(e) => { e.stopPropagation(); toggleFavoriteFont(fontName); }} />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* All Fonts */}
                      <div className="border-t pt-2">
                        <div className="text-xs font-semibold text-gray-400 px-2 mb-1">All Fonts</div>
                        {JOURNAL_FONTS.map(font => (
                          <button
                            key={font.name}
                            onClick={() => selectFont(font.name)}
                            className={`w-full text-left px-2 py-1.5 rounded hover:bg-purple-50 flex items-center justify-between group ${formData.font === font.name ? 'bg-purple-50 text-purple-700' : 'text-gray-700'}`}
                          >
                            <span style={{ fontFamily: font.name }} className="text-base">{font.name}</span>
                            <Star 
                              className={`w-3 h-3 hover:text-yellow-400 ${
                                (preferences?.favorite_journal_fonts || []).includes(font.name) 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300 hidden group-hover:block'
                              }`} 
                              onClick={(e) => { e.stopPropagation(); toggleFavoriteFont(font.name); }} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Encryption Toggle - Moved to Header */}
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                    formData.is_encrypted 
                      ? 'bg-green-100 border-green-200 text-green-800' 
                      : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                  }`}>
                    <Shield className="w-3 h-3" />
                    <Label htmlFor="encrypt-toggle" className="text-xs cursor-pointer font-medium">
                      {formData.is_encrypted ? 'Encrypted' : 'Encrypt'}
                    </Label>
                    <Switch
                      id="encrypt-toggle"
                      checked={formData.is_encrypted}
                      onCheckedChange={(c) => setFormData(prev => ({ ...prev, is_encrypted: c, ai_reframe_enabled: !c && prev.ai_reframe_enabled }))}
                      className="scale-75 origin-right"
                    />
                  </div>
                </div>
              </div>
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

              {isPoetryMode && (
                <Alert className={isDark ? 'bg-pink-900/30 border-pink-700' : 'bg-pink-50 border-pink-200'}>
                  <Music className={`w-4 h-4 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
                  <AlertDescription className={`text-sm ${isDark ? 'text-pink-300' : 'text-pink-800'}`}>
                    <strong>Poetry & Lyrics:</strong> Let your creativity flow! Write a poem, song lyrics, or just play with words. 🎵
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

              {isPoetryMode && (
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${textClass}`}>Music Style (for Suno)</label>
                  <Input
                    placeholder="e.g. Upbeat Pop, Sad Piano Jazz, Heavy Metal..."
                    value={formData.music_style || ''}
                    onChange={(e) => setFormData({...formData, music_style: e.target.value})}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className={`text-sm font-medium ${textClass}`}>
                  {isVentingMode ? "Let it all out... (this is a safe space)" : "Your thoughts..."}
                </label>
                <Textarea
                  placeholder={isVentingMode 
                    ? "Write whatever's on your mind. Don't hold back. No one will judge you here..."
                    : isPoetryMode
                    ? "Roses are red, violets are blue...\nWrite your masterpiece here."
                    : "What's on your mind today?"
                  }
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={12}
                  className={`resize-none ${isDark ? 'bg-gray-700 border-gray-600' : ''} ${isPoetryMode ? 'font-serif italic text-lg leading-relaxed' : ''}`}
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

            <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
              <div className="flex gap-2">
                {currentEntryId && (formData.revisions?.length > 0) && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRevisions(!showRevisions)}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <History className="w-4 h-4 mr-2" />
                    {showRevisions ? 'Hide Revisions' : `View Revisions (${formData.revisions.length})`}
                  </Button>
                )}
                {isPoetryMode && (
                  <a href="https://suno.com/invite/@iamnikolewithak" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50">
                      <Music className="w-4 h-4 mr-2" />
                      Create in Suno
                    </Button>
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.content.trim() || createEntryMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {currentEntryId ? 'Update Entry' : 'Save Entry'}
                </Button>
              </div>
            </DialogFooter>

            {/* Revisions Panel */}
            <AnimatePresence>
              {showRevisions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-200 mt-4 pt-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700">Revision History</h3>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete ALL revisions?')) {
                          deleteRevisionsMutation.mutate({ id: currentEntryId, deleteAll: true });
                          setFormData(prev => ({ ...prev, revisions: [] }));
                        }
                      }}
                    >
                      Delete All
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {formData.revisions?.slice().reverse().map((rev, index) => {
                      const originalIndex = formData.revisions.length - 1 - index;
                      return (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium text-gray-700">
                                {format(new Date(rev.date), 'MMM d, yyyy h:mm a')}
                              </span>
                              {rev.title && <span className="block text-xs text-gray-500">Title: {rev.title}</span>}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-blue-600"
                                title="Restore this version"
                                onClick={() => {
                                  if (confirm('Replace current content with this revision?')) {
                                    setFormData(prev => ({
                                      ...prev,
                                      content: rev.content,
                                      title: rev.title || prev.title,
                                      music_style: rev.music_style || prev.music_style
                                    }));
                                  }
                                }}
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600"
                                title="Delete revision"
                                onClick={() => {
                                  deleteRevisionsMutation.mutate({ id: currentEntryId, revisionIndex: originalIndex });
                                  setFormData(prev => ({
                                    ...prev,
                                    revisions: prev.revisions.filter((_, i) => i !== originalIndex)
                                  }));
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-gray-600 line-clamp-2 italic border-l-2 border-gray-300 pl-2">
                            {rev.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                              <h3 
                                className={`text-lg font-bold ${textClass} line-clamp-1 cursor-pointer hover:underline`}
                                onClick={() => openEdit(entry)}
                              >
                                {entry.title}
                              </h3>
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
                          
                          {/* Hide/Unhide Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-purple-600"
                            title={entry.is_hidden ? "Unhide Entry" : "Hide Entry"}
                            onClick={() => updateEntryMutation.mutate({ 
                              id: entry.id, 
                              data: { is_hidden: !entry.is_hidden } 
                            })}
                          >
                            {entry.is_hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </Button>
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
                          <div 
                            onClick={() => openEdit(entry)} 
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ fontFamily: entry.font || 'Inter' }}
                          >
                            <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap leading-relaxed`}>
                              {entry.content}
                            </p>
                          </div>
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