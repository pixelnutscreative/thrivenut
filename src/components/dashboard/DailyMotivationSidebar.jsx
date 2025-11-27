import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const timeSlots = [
  { id: 'morning_wake', label: 'Morning Wake-up', hour: 6 },
  { id: 'morning_mid', label: 'Mid-Morning', hour: 9 },
  { id: 'midday', label: 'Midday', hour: 12 },
  { id: 'afternoon', label: 'Afternoon', hour: 15 },
  { id: 'evening', label: 'Early Evening', hour: 18 },
  { id: 'night', label: 'Night Wind-down', hour: 20 },
  { id: 'bedtime', label: 'Before Bed', hour: 22 },
];

export default function DailyMotivationSidebar({ 
  greetingType = 'positive_quote', 
  userName = 'Friend',
  struggles = [],
  improvements = [],
  isBibleBeliever = false
}) {
  const [motivations, setMotivations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSlot, setExpandedSlot] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine current time slot
  const currentHour = new Date().getHours();
  const currentSlotIndex = timeSlots.findIndex((slot, idx) => {
    const nextSlot = timeSlots[idx + 1];
    return currentHour >= slot.hour && (!nextSlot || currentHour < nextSlot.hour);
  });

  useEffect(() => {
    generateMotivations();
  }, [greetingType, struggles, improvements]);

  const generateMotivations = async () => {
    setLoading(true);
    
    const contextParts = [];
    if (struggles.length > 0) {
      contextParts.push(`They struggle with: ${struggles.join(', ')}`);
    }
    if (improvements.length > 0) {
      contextParts.push(`They want to improve: ${improvements.join(', ')}`);
    }
    
    const useScripture = isBibleBeliever || greetingType === 'scripture';
    const contentType = useScripture ? 'Bible verses with brief application' : 
                        greetingType === 'affirmation' ? 'personal affirmations' :
                        greetingType === 'motivational' ? 'motivational quotes' : 
                        'positive, uplifting quotes';

    const prompt = `Generate 7 short ${contentType} for someone named ${userName} to read throughout their day.
${contextParts.length > 0 ? contextParts.join('. ') + '.' : ''}

Each should be:
- Very short (1-2 sentences max)
- Relevant to the time of day
- Helpful for their specific struggles/goals if mentioned
- Uplifting and actionable

Times: Morning wake-up, Mid-morning, Midday, Afternoon, Early evening, Night wind-down, Before bed.

${useScripture ? 'Include the Bible reference (book chapter:verse) for each.' : ''}`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            motivations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  reference: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      setMotivations(result.motivations || []);
    } catch (error) {
      console.error('Failed to generate motivations:', error);
      // Fallback motivations
      setMotivations([
        { text: "Today is a fresh start. You've got this!", reference: "" },
        { text: "Take a moment to breathe. You're doing great.", reference: "" },
        { text: "Halfway through the day - celebrate your progress!", reference: "" },
        { text: "Keep going. Your effort matters.", reference: "" },
        { text: "Reflect on what went well today.", reference: "" },
        { text: "You handled today's challenges beautifully.", reference: "" },
        { text: "Rest well. Tomorrow brings new opportunities.", reference: "" },
      ]);
    }
    setLoading(false);
  };

  const getSlotStatus = (index) => {
    if (index < currentSlotIndex) return 'past';
    if (index === currentSlotIndex) return 'current';
    return 'future';
  };

  if (isCollapsed) {
    return (
      <Card className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 w-full text-left"
        >
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-purple-700">Daily Motivation</span>
          <ChevronDown className="w-4 h-4 ml-auto text-purple-400" />
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isBibleBeliever || greetingType === 'scripture' ? (
            <BookOpen className="w-4 h-4 text-purple-500" />
          ) : (
            <Sparkles className="w-4 h-4 text-purple-500" />
          )}
          <span className="text-sm font-semibold text-purple-700">Daily Motivation</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={generateMotivations}
            disabled={loading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="h-6 w-6 p-0"
          >
            <ChevronUp className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {timeSlots.map((slot, index) => {
          const status = getSlotStatus(index);
          const motivation = motivations[index];
          const isExpanded = expandedSlot === slot.id || status === 'current';
          
          return (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-lg transition-all cursor-pointer ${
                status === 'current' 
                  ? 'bg-purple-100 border-2 border-purple-300 shadow-sm' 
                  : status === 'past'
                    ? 'bg-white/50 opacity-60'
                    : 'bg-white/70 hover:bg-white'
              }`}
              onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}
            >
              <div className="p-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    status === 'current' ? 'bg-purple-500 animate-pulse' :
                    status === 'past' ? 'bg-gray-300' : 'bg-purple-200'
                  }`} />
                  <span className={`text-xs font-medium ${
                    status === 'current' ? 'text-purple-700' : 'text-gray-500'
                  }`}>
                    {slot.label}
                  </span>
                  {status === 'current' && (
                    <span className="text-[10px] bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full ml-auto">
                      Now
                    </span>
                  )}
                </div>
                
                <AnimatePresence>
                  {(isExpanded || status === 'current') && motivation && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 overflow-hidden"
                    >
                      <p className={`text-sm leading-relaxed ${
                        status === 'current' ? 'text-purple-800 font-medium' : 'text-gray-600'
                      }`}>
                        {loading ? '...' : motivation.text}
                      </p>
                      {motivation.reference && (
                        <p className="text-xs text-purple-500 mt-1 italic">
                          — {motivation.reference}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}