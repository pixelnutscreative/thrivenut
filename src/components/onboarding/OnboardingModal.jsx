import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { Heart, Target, BookOpen, TrendingUp, Gift, Pill, Brain, Users, PawPrint, Loader2, Info } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import TimezoneSelector from '../shared/TimezoneSelector';

const modules = [
  { id: 'tiktok', name: 'TikTok Content Goals', icon: TrendingUp, description: 'Track posts, lives, engagement', category: 'tiktok' },
  { id: 'gifter', name: 'Gifter Songs', icon: Gift, description: 'Track gifters & thank you songs', category: 'tiktok' },
  { id: 'goals', name: 'Personal Goals', icon: Target, description: 'Goal tracking for all areas', category: 'productivity' },
  { id: 'journal', name: 'Daily Journal', icon: BookOpen, description: 'Reflections & AI reframing', category: 'wellness' },
  { id: 'wellness', name: 'Wellness Tracker', icon: Heart, description: 'Water, sleep, mood & self-care', category: 'wellness' },
  { id: 'supplements', name: 'Supplements', icon: Pill, description: 'Track daily supplements', category: 'wellness' },
  { id: 'medications', name: 'Medications', icon: Pill, description: 'Medication tracking', category: 'wellness' },
  { id: 'mental_health', name: 'Mental Health', icon: Brain, description: 'Mental health support', category: 'wellness' },
  { id: 'people', name: 'My People', icon: Users, description: 'Contacts & birthdays', category: 'personal' },
  { id: 'pets', name: 'Pet Care', icon: PawPrint, description: 'Pet schedules & activities', category: 'personal' },
];

const greetingTypes = [
  { id: 'scripture', name: 'Scripture', description: 'Daily Bible verse' },
  { id: 'positive_quote', name: 'Positive Quote', description: 'Uplifting quotes' },
  { id: 'motivational', name: 'Motivational', description: 'Get pumped up!' },
  { id: 'affirmation', name: 'Daily Affirmation', description: 'Personalized affirmations' }
];

const struggles = [
  { id: 'anxiety', label: 'Anxiety', emoji: '😰' },
  { id: 'depression', label: 'Depression', emoji: '😔' },
  { id: 'adhd', label: 'ADHD / Focus', emoji: '🧠' },
  { id: 'autism', label: 'Autism / Sensory', emoji: '🌈' },
  { id: 'stress', label: 'Stress', emoji: '😫' },
  { id: 'loneliness', label: 'Loneliness', emoji: '💔' },
  { id: 'grief', label: 'Grief', emoji: '🕊️' },
  { id: 'sleep', label: 'Sleep Issues', emoji: '😴' },
];

const improvementGoals = [
  { id: 'self_esteem', label: 'Self-Esteem', emoji: '💪' },
  { id: 'confidence', label: 'Confidence', emoji: '✨' },
  { id: 'boundaries', label: 'Boundaries', emoji: '🚧' },
  { id: 'relationships', label: 'Relationships', emoji: '❤️' },
  { id: 'productivity', label: 'Productivity', emoji: '📈' },
  { id: 'mindfulness', label: 'Mindfulness', emoji: '🧘' },
  { id: 'self_care', label: 'Self-Care', emoji: '🛁' },
  { id: 'motivation', label: 'Motivation', emoji: '🔥' },
];

export default function OnboardingModal({ isOpen, user, onComplete }) {
  const [step, setStep] = useState(1);
  const [selectedGreeting, setSelectedGreeting] = useState('positive_quote');
  const [selectedModules, setSelectedModules] = useState(['goals', 'wellness', 'journal']);
  const [selectedStruggles, setSelectedStruggles] = useState([]);
  const [selectedImprovements, setSelectedImprovements] = useState([]);
  const [isBibleBeliever, setIsBibleBeliever] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York');
  const [themeData, setThemeData] = useState({ theme_type: 'clean_white', metal_accent: 'gold' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleModule = (id) => setSelectedModules(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleStruggle = (id) => setSelectedStruggles(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleImprovement = (id) => setSelectedImprovements(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const completeOnboarding = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const existingPrefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      
      const prefsData = {
        user_email: user.email,
        theme_type: themeData.theme_type || 'clean_white',
        metal_accent: themeData.metal_accent || null,
        pastel_color: themeData.pastel_color || null,
        bright_color: themeData.bright_color || null,
        primary_color: themeData.primary_color || null,
        accent_color: themeData.accent_color || null,
        greeting_type: selectedGreeting,
        user_timezone: selectedTimezone,
        enabled_modules: selectedModules,
        mental_health_struggles: selectedStruggles,
        improvement_goals: selectedImprovements,
        is_bible_believer: isBibleBeliever,
        accessibility_mode: 'standard',
        enable_ai_journaling: true,
        show_daily_affirmations: selectedGreeting === 'affirmation',
        onboarding_completed: true
      };
      
      if (existingPrefs && existingPrefs.length > 0) {
        await base44.entities.UserPreferences.update(existingPrefs[0].id, prefsData);
      } else {
        await base44.entities.UserPreferences.create(prefsData);
      }

      onComplete();
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('There was an error. Please try again.');
      setLoading(false);
    }
  };

  const categoryLabels = {
    tiktok: '📱 TikTok',
    productivity: '🎯 Productivity',
    wellness: '💜 Wellness',
    personal: '👥 Personal'
  };

  const groupedModules = modules.reduce((acc, module) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {});

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-center pb-4">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
            alt="ThriveNut" 
            className="w-14 h-14 mx-auto mb-2"
          />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to ThriveNut
          </h2>
          <p className="text-gray-600 text-sm">Let's personalize your experience</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center mb-4">
          {[1, 2, 3, 4, 5].map(num => (
            <div key={num} className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= num ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{num}</div>
              {num < 5 && <div className={`w-6 h-1 mx-1 ${step > num ? 'bg-purple-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Modules */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-lg font-bold mb-3 text-center">What would you like to track?</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {Object.entries(groupedModules).map(([category, categoryModules]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-gray-500 mb-1">{categoryLabels[category]}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryModules.map(module => {
                      const Icon = module.icon;
                      return (
                        <div
                          key={module.id}
                          onClick={() => toggleModule(module.id)}
                          className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                            selectedModules.includes(module.id) ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={selectedModules.includes(module.id)} className="pointer-events-none" />
                            <Icon className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">{module.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => setStep(2)} className="w-full mt-4 bg-purple-600 hover:bg-purple-700">Continue</Button>
          </motion.div>
        )}

        {/* Step 2: Theme */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-lg font-bold mb-3 text-center">Pick your appearance</h3>
            <ThemeSelector themeData={themeData} onChange={setThemeData} />
            <div className="flex gap-3 mt-4">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1">Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1 bg-purple-600 hover:bg-purple-700">Continue</Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Timezone & Bible */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-lg font-bold mb-3 text-center">A few quick settings</h3>
            <div className="space-y-4">
              <TimezoneSelector value={selectedTimezone} onChange={setSelectedTimezone} />
              <div
                onClick={() => setIsBibleBeliever(!isBibleBeliever)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isBibleBeliever ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={isBibleBeliever} className="pointer-events-none" />
                  <div>
                    <span className="font-medium">I'm a Bible believer</span>
                    <p className="text-xs text-gray-500">Show morning & night Bible reading in self-care</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1">Back</Button>
              <Button onClick={() => setStep(4)} className="flex-1 bg-purple-600 hover:bg-purple-700">Continue</Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Mental Health */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-lg font-bold mb-2 text-center">What are you working on?</h3>
            <p className="text-gray-500 text-xs text-center mb-3">This helps personalize your support. 100% private. 💜</p>
            
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-1">Things I'm working through...</h4>
                <div className="flex flex-wrap gap-1">
                  {struggles.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleStruggle(item.id)}
                      className={`px-2 py-1 rounded-full border text-xs transition-all ${
                        selectedStruggles.includes(item.id) ? 'border-purple-500 bg-purple-100 text-purple-800' : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {item.emoji} {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-1">Things I want to improve...</h4>
                <div className="flex flex-wrap gap-1">
                  {improvementGoals.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleImprovement(item.id)}
                      className={`px-2 py-1 rounded-full border text-xs transition-all ${
                        selectedImprovements.includes(item.id) ? 'border-pink-500 bg-pink-100 text-pink-800' : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      {item.emoji} {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={() => setStep(3)} variant="outline" className="flex-1">Back</Button>
              <Button onClick={() => setStep(5)} className="flex-1 bg-purple-600 hover:bg-purple-700">Continue</Button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Greeting */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-lg font-bold mb-3 text-center">How should we greet you?</h3>
            <div className="space-y-2">
              {greetingTypes.map(greeting => (
                <div
                  key={greeting.id}
                  onClick={() => setSelectedGreeting(greeting.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedGreeting === greeting.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedGreeting === greeting.id ? 'border-purple-500' : 'border-gray-300'
                    }`}>
                      {selectedGreeting === greeting.id && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                    </div>
                    <div>
                      <span className="font-medium">{greeting.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{greeting.description}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={() => setStep(4)} variant="outline" className="flex-1">Back</Button>
              <Button 
                onClick={completeOnboarding}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up...</> : "Let's Go! 🎉"}
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}