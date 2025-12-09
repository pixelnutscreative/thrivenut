import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, RefreshCw, ChevronDown, ChevronUp, X } from 'lucide-react';
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
  customTopics = [],
  isBibleBeliever = true
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
  }, [greetingType, struggles, improvements, customTopics]);

  const generateMotivations = async () => {
    setLoading(true);
    
    const contextParts = [];
    if (struggles.length > 0) {
      contextParts.push(`They struggle with: ${struggles.join(', ')}`);
    }
    if (improvements.length > 0) {
      contextParts.push(`They want to improve: ${improvements.join(', ')}`);
    }
    if (customTopics.length > 0) {
      contextParts.push(`Custom topics they care about: ${customTopics.join(', ')}`);
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
      <Card className="p-2 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 w-full text-left"
        >
          <Sparkles className="w-3 h-3 text-purple-500" />
          <span className="text-xs font-medium text-purple-700">Daily Motivation</span>
          <ChevronDown className="w-3 h-3 ml-auto text-purple-400" />
        </button>
      </Card>
    );
  }

  // Only show current time slot by default
  const currentSlot = timeSlots[currentSlotIndex];
  const currentMotivation = motivations[currentSlotIndex];

  return (
    <Card className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isBibleBeliever || greetingType === 'scripture' ? (
            <BookOpen className="w-3 h-3 text-purple-500" />
          ) : (
            <Sparkles className="w-3 h-3 text-purple-500" />
          )}
          <span className="text-xs font-semibold text-purple-700">Daily Motivation</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={generateMotivations}
            disabled={loading}
            className="h-5 w-5 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedSlot(expandedSlot ? null : 'all')}
            className="h-5 w-5 p-0"
            title={expandedSlot === 'all' ? 'Show current only' : 'Show all'}
          >
            {expandedSlot === 'all' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="h-5 w-5 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {expandedSlot === 'all' ? (
        <div className="space-y-1">
          {timeSlots.map((slot, index) => {
            const status = getSlotStatus(index);
            const motivation = motivations[index];
            
            return (
              <div
                key={slot.id}
                className={`rounded p-1.5 text-xs ${
                  status === 'current' 
                    ? 'bg-purple-100 border border-purple-300' 
                    : 'bg-white/50 opacity-70'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    status === 'current' ? 'bg-purple-500 animate-pulse' : 'bg-gray-300'
                  }`} />
                  <span className="font-medium text-gray-600">{slot.label}</span>
                </div>
                {motivation && (
                  <p className="text-xs text-gray-600 leading-snug">
                    {loading ? '...' : motivation.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        currentSlot && currentMotivation && (
          <div className="bg-purple-100 border border-purple-300 rounded-lg p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-medium text-purple-700">{currentSlot.label}</span>
              <span className="text-[10px] bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full ml-auto">
                Now
              </span>
            </div>
            <p className="text-xs text-purple-800 leading-relaxed">
              {loading ? '...' : currentMotivation.text}
            </p>
            {currentMotivation.reference && (
              <p className="text-[10px] text-purple-500 mt-1 italic">
                — {currentMotivation.reference}
              </p>
            )}
          </div>
        )
      )}
    </Card>
  );
}