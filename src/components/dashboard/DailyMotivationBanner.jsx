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
  userEmail
}) {
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const [motivations, setMotivations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedId, setSavedId] = useState(null);

  // Current time slot
  const currentHour = new Date().getHours();
  const getTimeSlotLabel = () => {
    if (currentHour < 6) return 'Early Hours';
    if (currentHour < 9) return 'Morning';
    if (currentHour < 12) return 'Mid-Morning';
    if (currentHour < 15) return 'Afternoon';
    if (currentHour < 18) return 'Late Afternoon';
    if (currentHour < 21) return 'Evening';
    return 'Night';
  };

  useEffect(() => {
    generateMotivations();
  }, [greetingTypes, struggles, goals]);

  const generateMotivations = async () => {
    setLoading(true);
    
    const types = greetingTypes.length > 0 ? greetingTypes : ['positive_quote'];
    const allMotivations = [];

    for (const type of types) {
      const contextParts = [];
      if (struggles.length > 0) {
        contextParts.push(`They struggle with: ${struggles.join(', ')}`);
      }
      if (goals.length > 0) {
        contextParts.push(`They're working toward: ${goals.slice(0, 3).join(', ')}`);
      }

      const contentType = type === 'scripture' ? 'Bible verses with brief application' : 
                          type === 'affirmation' ? 'personal affirmations (use "I am", "I can", etc.)' :
                          type === 'motivational' ? 'motivational quotes from famous leaders' : 
                          'positive, uplifting quotes';

      const prompt = `Generate 1 short ${contentType} for the ${getTimeSlotLabel().toLowerCase()} hours.
${contextParts.length > 0 ? contextParts.join('. ') + '.' : ''}

Requirements:
- Very short (1-2 sentences max)
- Relevant to ${getTimeSlotLabel().toLowerCase()} time of day
- Helpful for their specific struggles/goals if mentioned
- Uplifting and actionable
- DO NOT include any person's name - make it universal so it can be shared as a quote/post on social media
- Use generic language like "you", "we", or no pronouns at all

${type === 'scripture' ? 'Include the Bible reference (book chapter:verse).' : ''}`;

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
        
        allMotivations.push({
          text: result.text,
          reference: result.reference || '',
          type
        });
      } catch (error) {
        console.error('Failed to generate motivation:', error);
        allMotivations.push({
          text: "You're doing amazing. Keep going!",
          reference: '',
          type
        });
      }
    }
    
    setMotivations(allMotivations);
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
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-4 h-4" />
            <div>
              <h2 className="text-base font-bold leading-tight">{timeOfDayGreeting()}!</h2>
              <p className="text-white/70 text-xs">{getTimeSlotLabel()} Inspiration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {greetingTypes.length > 1 && (
              <div className="flex gap-1">
                {greetingTypes.map((type, idx) => (
                  <div 
                    key={type}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentIndex ? 'bg-white scale-125' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
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
          {motivations.length > 1 && currentIndex > 0 && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <AnimatePresence mode="wait">
            {currentMotivation && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-8"
              >
                {typeConfig && (
                 <Badge className={`${typeConfig.color} mb-1 text-xs`}>
                   {typeConfig.label}
                 </Badge>
                )}
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

          {motivations.length > 1 && currentIndex < motivations.length - 1 && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Compact Save Button */}
        {currentMotivation && (
          <div className="flex justify-end mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveMotivationMutation.mutate(currentMotivation)}
              disabled={saveMotivationMutation.isPending || savedId === currentMotivation.text}
              className="text-white/80 hover:text-white hover:bg-white/20 h-6 text-xs"
            >
              {savedId === currentMotivation.text ? (
                <><Check className="w-3 h-3 mr-1" /> Saved!</>
              ) : (
                <><Bookmark className="w-3 h-3 mr-1" /> Save</>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}