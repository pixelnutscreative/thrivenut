import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookOpen, RefreshCw, ChevronLeft, ChevronRight, Heart, Bookmark, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  motivationTone = 'uplifting'
}) {
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const [motivations, setMotivations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedId, setSavedId] = useState(null);

  // Season and month context for relevant content
  const getSeasonContext = () => {
    const month = new Date().getMonth();
    const season = month >= 2 && month <= 4 ? 'spring' :
                   month >= 5 && month <= 7 ? 'summer' :
                   month >= 8 && month <= 10 ? 'fall' : 'winter';
    return season;
  };

  useEffect(() => {
    generateMotivations();
  }, [greetingTypes, struggles, goals]);

  const generateMotivations = async () => {
    setLoading(true);
    
    const types = greetingTypes.length > 0 ? greetingTypes : ['positive_quote'];
    
    // Generate one motivation for EACH selected type
    const newMotivations = [];
    
    // If Bible is enabled, always put scripture first
    const sortedTypes = isBibleBeliever && types.includes('scripture')
      ? ['scripture', ...types.filter(t => t !== 'scripture')]
      : types;
    
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
- Tone: ${motivationTone}
- Very short (1-2 sentences max for quotes/affirmations)
${contextParts.length > 0 ? '- Specifically address the focus area mentioned above' : ''}
- Actionable (if applicable)
- DO NOT mention time of day (morning, evening, etc.) unless the scripture itself mentions it
- DO NOT include any person's name - make it universal so it can be shared as a quote/post on social media
- Use generic language like "you", "we", or no pronouns at all
- ${seasonNote}${bibleAlignedNote}

${type === 'scripture' 
  ? `CRITICAL: Provide the EXACT scripture text word-for-word from ${bibleVersion}. Include the Bible reference (book chapter:verse).` 
  : type === 'motivational' 
    ? `If inspired by a scripture, you can mention it in the reference field with "Inspired by [Book Chapter:Verse]" but the main text should be your own motivational message, not the actual scripture.`
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
  };

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
    <Card className="overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-xl">
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

        {/* Compact Motivation Content with Navigation */}
        <div className="relative flex items-center gap-2">
          {motivations.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('left')}
              disabled={currentIndex === 0}
              className="text-white hover:bg-white/20 h-6 w-6 p-0 flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {currentMotivation && (
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm font-medium leading-snug">
                    {loading ? '...' : `"${currentMotivation.text}"`}
                  </p>
                  {currentMotivation.reference && (
                    <p className="text-white/70 text-xs mt-0.5 italic">
                      — {currentMotivation.reference}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {motivations.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('right')}
              disabled={currentIndex === motivations.length - 1}
              className="text-white hover:bg-white/20 h-6 w-6 p-0 flex-shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Type indicator dots */}
        {motivations.length > 1 && (
          <div className="flex items-center justify-center gap-1 mt-2">
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
        )}


      </div>
    </Card>
  );
}