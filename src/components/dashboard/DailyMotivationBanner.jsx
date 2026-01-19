import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookOpen, RefreshCw, ChevronLeft, ChevronRight, Heart, Bookmark, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../../utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock } from 'lucide-react';

const greetingTypeLabels = {
  scripture: { label: 'Scripture', icon: BookOpen, color: 'bg-purple-100 text-purple-700' },
  positive_quote: { label: 'Quote', icon: Sparkles, color: 'bg-blue-100 text-blue-700' },
  motivational: { label: 'Motivation', icon: Sparkles, color: 'bg-amber-100 text-amber-700' },
  affirmation: { label: 'Affirmation', icon: Heart, color: 'bg-pink-100 text-pink-700' },
};

const timeOfDayGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
};

export default function DailyMotivationBanner({ 
  greetingTypes = ['positive_quote'],
  userName = 'Friend',
  struggles = [],
  goals = [],
  isBibleBeliever = false,
  userEmail,
  bibleVersion = 'NIV',
  motivationTone = 'uplifting',
  primaryColor = '#1fd2ea',
  accentColor = '#bd84f5',
  preferences
}) {
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const [motivations, setMotivations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedId, setSavedId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const logGeneration = async (items) => {
    if (userEmail) {
      try {
        const logs = items.map(m => ({
          content: m.text,
          type: m.type,
          tone: Array.isArray(preferences?.content_tone) ? preferences.content_tone.join(', ') : (preferences?.content_tone || 'humorous'),
          reference: m.reference || '',
          created_by: userEmail
        }));
        await Promise.all(logs.map(l => base44.entities.ContentGenerationLog.create(l)));
      } catch (e) {
        console.error("Failed to log history", e);
      }
    }
  };

  // Season and month context for relevant content
  const getSeasonContext = () => {
    const month = new Date().getMonth();
    const season = month >= 2 && month <= 4 ? 'spring' :
                   month >= 5 && month <= 7 ? 'summer' :
                   month >= 8 && month <= 10 ? 'fall' : 'winter';
    return season;
  };

  const generateMotivations = async () => {
    setLoading(true);
    
    const types = greetingTypes.length > 0 ? greetingTypes : ['positive_quote'];
    
    // Generate one motivation for EACH selected type
    const newMotivations = [];
    
    // If Bible is enabled, always put scripture first
    let sortedTypes = [...types];
    if (isBibleBeliever && sortedTypes.includes('scripture')) {
      sortedTypes = ['scripture', ...sortedTypes.filter(t => t !== 'scripture')];
    }
    
    // Get tone from preferences
    const selectedTones = preferences?.content_tone || ['humorous'];
    const toneString = Array.isArray(selectedTones) ? selectedTones.join(' and ') : selectedTones;
    const customVoice = preferences?.custom_brand_voice ? `Custom Voice Details: "${preferences.custom_brand_voice}"` : '';
    
    // Check for edgy/disrespectful with Bible believer
    let toneInstruction = toneString;
    if (isBibleBeliever && (toneString.includes('disrespectful') || toneString.includes('edgy') || toneString.includes('sassy'))) {
      toneInstruction += " (Keep it fun but respectful of faith - no blasphemy)";
    }

    for (const type of sortedTypes) {
      // Pick ONE random struggle/goal to focus on
      const contextParts = [];
      if (struggles.length > 0) {
        const randomStruggle = struggles[Math.floor(Math.random() * struggles.length)];
        contextParts.push(`Focus on this struggle: ${randomStruggle}`);
      } else if (goals.length > 0) {
        const randomGoal = goals[Math.floor(Math.random() * goals.length)];
        contextParts.push(`Focus on this goal: ${randomGoal}`);
      }

      const contentType = type === 'scripture' ? `accurate ${bibleVersion} Bible verse (EXACT wording, no paraphrasing)` : 
                          type === 'affirmation' ? 'personal biblical affirmation (use "I am", "I can", etc.)' :
                          type === 'motivational' ? 'motivational message' : 
                          'positive, uplifting quote';

      const bibleAlignedNote = isBibleBeliever 
        ? '\n- CRITICAL: Content must align with Biblical principles. NO channeling, witchcraft, New Age spirituality, spirit communication, mediums, or anything conflicting with the Bible. Focus on Biblical principles, godly wisdom, and Christ-centered encouragement.'
        : '';

      const season = getSeasonContext();
      const seasonNote = `We're in ${season} season - you can optionally make content seasonally relevant if natural, but it's not required.`;

      const prompt = `Generate 1 short ${contentType}.
${contextParts.length > 0 ? contextParts.join('. ') + '.' : ''}

Requirements:
- Tone: ${toneInstruction} ${customVoice}
- Very short (1-2 sentences max for quotes/affirmations)
${contextParts.length > 0 ? '- Specifically address the focus area mentioned above' : ''}
- Actionable (if applicable)
- DO NOT mention time of day (morning, evening, etc.) unless the scripture itself mentions it
- DO NOT include any person's name - make it universal so it can be shared as a quote/post on social media
- Use generic language like "you", "we", or no pronouns at all
- ${seasonNote}${bibleAlignedNote}

${type === 'scripture' 
  ? `CRITICAL: Provide the EXACT scripture text word-for-word from ${bibleVersion}. Include the Bible reference (book chapter:verse).` 
  : type === 'motivational' || type === 'positive_quote' || type === 'affirmation'
    ? `IMPORTANT: You may use Biblical principles and wisdom as inspiration, but DO NOT include ANY scripture references in the reference field unless the quote IS an actual scripture. For motivational/quote/affirmation types, if they are based on Biblical wisdom, leave the reference field BLANK. Only populate reference if it's an actual Bible verse citation.`
    : ''
}`;

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              text: { type: "string" },
              reference: { type: "string" }
            }
          }
        });
        
        newMotivations.push({
          text: result.text,
          reference: result.reference || '',
          type: type
        });
      } catch (error) {
        console.error('Failed to generate motivation:', error);
        newMotivations.push({
          text: "You're doing amazing. Keep going!",
          reference: '',
          type: type
        });
      }
    }
    
    setMotivations(newMotivations);
    setCurrentIndex(0);
    setLoading(false);
    logGeneration(newMotivations);
  };

  useEffect(() => {
    generateMotivations();
  }, []);

  const saveMotivationMutation = useMutation({
    mutationFn: async (motivation) => {
      return await base44.entities.SavedMotivation.create({
        content: motivation.text,
        reference: motivation.reference,
        type: motivation.type,
        category: 'Uncategorized'
      });
    },
    onSuccess: (_, variables) => {
      setSavedId(variables.text);
      setTimeout(() => setSavedId(null), 2000);
      queryClient.invalidateQueries({ queryKey: ['savedMotivations'] });
    },
  });

  const scroll = (direction) => {
    const newIndex = direction === 'left' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(motivations.length - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
  };

  const currentMotivation = motivations[currentIndex];
  const typeConfig = currentMotivation ? greetingTypeLabels[currentMotivation.type] : null;
  const TypeIcon = typeConfig?.icon || Sparkles;

  return (
    <Card 
      className="overflow-hidden text-white shadow-xl"
      style={{ backgroundImage: `linear-gradient(to bottom right, ${primaryColor}, ${accentColor})` }}
    >
      <div className="p-3">
        {/* Compact Header - Type badge and controls only */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {typeConfig && (
              <Badge className={`${typeConfig.color} text-xs`}>
                <TypeIcon className="w-3 h-3 mr-1" />
                {typeConfig.label}
              </Badge>
            )}
            {currentMotivation && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => saveMotivationMutation.mutate(currentMotivation)}
                  disabled={saveMotivationMutation.isPending || savedId === currentMotivation.text}
                  className="text-white/80 hover:text-white hover:bg-white/20 h-6 px-2 text-xs"
                >
                  {savedId === currentMotivation.text ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Heart className="w-3 h-3 mr-1" />
                  )}
                  {savedId === currentMotivation.text ? 'Saved' : 'Save'}
                </Button>
                <a
                  href={createPageUrl ? createPageUrl('SavedMotivations') : '/SavedMotivations'}
                  className="text-white/80 hover:text-white hover:bg-white/20 h-6 px-2 text-xs rounded flex items-center transition-colors"
                >
                  <Bookmark className="w-3 h-3 mr-1" />
                  View Saved
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(true)}
                  className="text-white/80 hover:text-white hover:bg-white/20 h-6 px-2 text-xs"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  History
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={generateMotivations}
              disabled={loading}
              className="text-white hover:bg-white/20 h-6 w-6 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Compact Motivation Content */}
        <div className="relative">
          <div className="flex-1 overflow-hidden px-1">
            <AnimatePresence mode="wait">
              {currentMotivation && (
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = offset.x;

                    if (swipe < -50) {
                      scroll('right');
                    } else if (swipe > 50) {
                      scroll('left');
                    }
                  }}
                  className="cursor-grab active:cursor-grabbing touch-pan-y"
                >
                  <p className="text-sm font-medium leading-snug select-none">
                    {loading ? '...' : `"${currentMotivation.text}"`}
                  </p>
                  {currentMotivation.reference && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(currentMotivation.reference);
                      }}
                      className="text-white/70 hover:text-white text-xs mt-1 flex items-center gap-1 transition-colors select-none"
                      title="View Scripture Reference"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span className="italic">Scripture Reference</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Navigation Arrows and Dots */}
        {motivations.length > 1 && (
          <div className="flex items-center justify-center gap-3 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('left')}
              disabled={currentIndex === 0}
              className="text-white bg-black/10 hover:bg-black/20 h-8 w-8 p-0 rounded-full backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center justify-center gap-1">
              {motivations.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? 'bg-white w-4' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('right')}
              disabled={currentIndex === motivations.length - 1}
              className="text-white bg-black/10 hover:bg-black/20 h-8 w-8 p-0 rounded-full backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* History Modal */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" />
                Generated History
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <HistoryList userEmail={userEmail} />
              </div>
            </div>
          </DialogContent>
        </Dialog>


      </div>
    </Card>
  );
}

function HistoryList({ userEmail }) {
  const queryClient = useQueryClient();
  const [savedIds, setSavedIds] = useState(new Set());

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['generationHistory', userEmail],
    queryFn: () => base44.entities.ContentGenerationLog.filter({ created_by: userEmail }, '-created_date', 50),
    enabled: !!userEmail,
    staleTime: 0
  });

  const saveMutation = useMutation({
    mutationFn: async (log) => {
       await base44.entities.SavedMotivation.create({
        content: log.content,
        reference: log.reference,
        type: log.type,
        category: 'Content Ideas'
      });
      return log.id;
    },
    onSuccess: (logId) => {
       setSavedIds(prev => new Set(prev).add(logId));
       queryClient.invalidateQueries({ queryKey: ['savedMotivations'] });
    }
  });

  if (isLoading) return <div className="flex justify-center p-4"><RefreshCw className="w-6 h-6 animate-spin text-purple-500" /></div>;

  if (logs.length === 0) return <p className="text-center text-gray-500">No history yet.</p>;

  return (
    <div className="space-y-3">
      {logs.map(log => (
        <div key={log.id} className="p-3 bg-gray-50 rounded-lg text-sm border hover:border-purple-200 transition-colors">
          <p className="font-medium text-gray-800">"{log.content}"</p>
          {log.reference && <p className="text-xs text-gray-500 mt-1 italic">— {log.reference}</p>}
          
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
               <span className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-medium ${
                 greetingTypeLabels[log.type]?.color || 'bg-gray-200 text-gray-700'
               }`}>
                 {log.type?.replace('_', ' ') || 'Quote'}
               </span>
               <span>{new Date(log.created_date).toLocaleDateString()}</span>
            </div>
            
            <Button 
              size="sm" 
              variant="ghost" 
              className={`h-7 px-2 text-xs ${savedIds.has(log.id) ? 'text-green-600 bg-green-50' : 'text-purple-600 hover:bg-purple-50'}`}
              onClick={() => saveMutation.mutate(log)}
              disabled={savedIds.has(log.id) || saveMutation.isPending}
            >
              {savedIds.has(log.id) ? (
                <>
                  <Check className="w-3 h-3 mr-1" /> Saved
                </>
              ) : (
                <>
                  <Heart className="w-3 h-3 mr-1" /> Save
                </>
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}