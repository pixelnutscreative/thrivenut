import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Heart, Zap, ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function GreetingCard({ userName, user }) {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [generatedGreetings, setGeneratedGreetings] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email }, '-updated_date');
      return prefs[0] || null;
    },
    enabled: !!user?.email,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Fetch mental health profile
  const { data: mentalHealth } = useQuery({
    queryKey: ['mentalHealthProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.MentalHealthProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  // Fetch user goals
  const { data: goals = [] } = useQuery({
    queryKey: ['userGoals', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Goal.filter({ created_by: user.email, status: 'active' }, '-updated_date');
    },
    enabled: !!user?.email,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  // Fetch user habits
  const { data: habits = [] } = useQuery({
    queryKey: ['userHabits', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Habit.filter({ created_by: user.email, status: 'active' }, '-updated_date');
    },
    enabled: !!user?.email,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  // Generate AI greeting with caching
  const generateNewGreetings = async () => {
    setIsGenerating(true);
    try {
      const selectedTypes = preferences?.greeting_types || ['scripture', 'quote', 'affirmation'];
      
      // 🔍 DEBUG: Verify data
      console.log('🔍 AI PROMPT INPUTS:', {
        workingThrough: mentalHealth?.mental_health_struggles,
        improvements: mentalHealth?.improvement_goals,
        goals: goals?.map(g => g.title),
        habits: habits,
        selectedTypes: selectedTypes
      });

      const workingThrough = mentalHealth?.mental_health_struggles?.join(', ') || 'general wellness';
      const improvements = mentalHealth?.improvement_goals?.join(', ') || 'personal growth';
      const goalTitles = goals.slice(0, 5).map(g => g.title).join(', ') || 'life goals';
      const buildingHabits = habits.filter(h => h.goal_type === 'habit' && h.status === 'active').slice(0, 3).map(h => h.title).join(', ') || 'healthy habits';

      const greetings = [];
      
      for (const selectedType of selectedTypes) {
        const prompt = `
Create a personalized daily ${selectedType} for someone who:
- Is working through: ${workingThrough}
- Wants to improve: ${improvements}
- Has goals: ${goalTitles}
- Is building habits: ${buildingHabits}

Make it deeply personal, encouraging, and actionable. Reference their specific struggles and goals directly. Keep it between 1-3 sentences.

Respond ONLY with valid JSON (no markdown, no code blocks): {"text": "...", "type": "${selectedType}", "author": "AI"}
`;

        const response = await base44.functions.invoke('generateAIGreeting', { prompt });
        const greeting = response.data;
        greetings.push(greeting);
      }

      // Cache for 1 hour
      localStorage.setItem('lastGreetingCache', JSON.stringify(greetings));
      localStorage.setItem('lastGreetingTime', Date.now().toString());

      setGeneratedGreetings(greetings);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error generating greeting:', error);
      setGeneratedGreetings([{ text: 'You have the strength to thrive today. Trust yourself.', type: 'affirmation', author: 'ThriveNut' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Load greeting on mount and check cache
  useEffect(() => {
    if (!preferences || !mentalHealth) return;

    const cached = localStorage.getItem('lastGreetingCache');
    const cacheTime = localStorage.getItem('lastGreetingTime');
    const cacheExpired = !cacheTime || (Date.now() - parseInt(cacheTime) >= 3600000);

    if (cached && !cacheExpired) {
      setGeneratedGreetings(JSON.parse(cached));
      setCurrentIndex(0);
    } else {
      generateNewGreetings();
    }
  }, [preferences?.greeting_types, mentalHealth?.mental_health_struggles]);

  // Auto-rotate
  useEffect(() => {
    if (!isAutoPlaying || generatedGreetings.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % generatedGreetings.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, generatedGreetings.length]);

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % generatedGreetings.length);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + generatedGreetings.length) % generatedGreetings.length);
  };

  // Save to social post
  const savePostMutation = useMutation({
    mutationFn: async () => {
      const greeting = generatedGreetings[currentIndex];
      return await base44.entities.ContentCard.create({
        title: `Daily Greeting - ${new Date().toLocaleDateString()}`,
        content: greeting.text,
        content_type: 'text',
        status: 'draft',
        created_by: user.email,
        metadata: {
          template: 'greeting',
          source: 'Daily Greeting Widget',
          type: greeting.type,
          author: greeting.author
        }
      });
    },
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      queryClient.invalidateQueries(['contentCards']);
    }
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getIcon = () => {
    if (!generatedGreetings[currentIndex]) return Sparkles;
    const type = generatedGreetings[currentIndex].type;
    if (type === 'scripture') return Heart;
    if (type === 'quote') return Sparkles;
    return Zap;
  };

  if (generatedGreetings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white border-0 shadow-xl overflow-hidden">
          <CardContent className="p-8 flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-70" />
              <p className="text-white/80">Generating your personalized greeting...</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const Icon = getIcon();
  const message = generatedGreetings[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative group"
    >
      <Card className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white border-0 shadow-xl overflow-hidden relative">
        <CardContent className="p-8 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />

          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white/70 hover:text-white transition-all z-20"
            aria-label="Previous greeting"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white/70 hover:text-white transition-all z-20"
            aria-label="Next greeting"
          >
            <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute top-4 left-4 z-20">
             <Button
               size="sm"
               onClick={() => generateNewGreetings()}
               disabled={isGenerating}
               variant="secondary"
               className="bg-white/20 hover:bg-white/30 text-white border-white/30"
             >
               {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
               {isGenerating ? 'Generating...' : 'Refresh'}
             </Button>
            </div>

            <div className="relative z-10 px-8">
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-6 h-6" />
              <p className="text-xl font-medium opacity-90">{getGreeting()}, {userName}!</p>
            </div>

            <div className="min-h-[140px] flex flex-col justify-center">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <blockquote className="text-2xl md:text-3xl font-bold leading-relaxed mb-3">
                  "{message.text}"
                </blockquote>
                <p className="text-white/80 text-sm">— {message.author} • {message.type}</p>
              </motion.div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-1.5 mt-4 mb-4">
              {generatedGreetings.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                />
              ))}
            </div>

            {/* Save Button */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => savePostMutation.mutate()}
                disabled={savePostMutation.isPending}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {savePostMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <>✅ Saved!</>
                ) : (
                  <><Save className="w-4 h-4 mr-1" /> Save</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}