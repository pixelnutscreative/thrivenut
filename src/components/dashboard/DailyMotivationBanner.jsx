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
  bibleVersion = 'NIV'
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
    
    // Pick ONE random type from the user's selected types
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // Pick ONE random struggle/goal to focus on
    const contextParts = [];
    if (struggles.length > 0) {
      const randomStruggle = struggles[Math.floor(Math.random() * struggles.length)];
      contextParts.push(`Focus on this struggle: ${randomStruggle}`);
    } else if (goals.length > 0) {
      const randomGoal = goals[Math.floor(Math.random() * goals.length)];
      contextParts.push(`Focus on this goal: ${randomGoal}`);
    }

    const contentType = randomType === 'scripture' ? `${bibleVersion} Bible verses with brief application` : 
                        randomType === 'affirmation' ? 'personal affirmations (use "I am", "I can", etc.)' :
                        randomType === 'motivational' ? 'motivational quotes from famous leaders' : 
                        'positive, uplifting quotes';

    const prompt = `Generate 1 short ${contentType} for the ${getTimeSlotLabel().toLowerCase()} hours.
${contextParts.length > 0 ? contextParts.join('. ') + '.' : ''}

Requirements:
- Very short (1-2 sentences max)
- Relevant to ${getTimeSlotLabel().toLowerCase()} time of day
${contextParts.length > 0 ? '- Specifically address the focus area mentioned above' : ''}
- Uplifting and actionable
- DO NOT include any person's name - make it universal so it can be shared as a quote/post on social media
- Use generic language like "you", "we", or no pronouns at all

${randomType === 'scripture' ? `Include the Bible reference (book chapter:verse) from the ${bibleVersion} translation.` : ''}`;

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
      
      setMotivations([{
        text: result.text,
        reference: result.reference || '',
        type: randomType
      }]);
    } catch (error) {
      console.error('Failed to generate motivation:', error);
      setMotivations([{
        text: "You're doing amazing. Keep going!",
        reference: '',
        type: randomType
      }]);
    }
    
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

        {/* Compact Motivation Content */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {currentMotivation && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
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


      </div>
    </Card>
  );
}