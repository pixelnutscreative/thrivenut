import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { Heart, Target, BookOpen, TrendingUp, Gift, Pill, Brain, Users, PawPrint, Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ThemeSelector from '../components/onboarding/ThemeSelector';
import TimezoneSelector from '../components/shared/TimezoneSelector';

const modules = [
  { id: 'tiktok', name: 'TikTok Content Goals', icon: TrendingUp, description: 'Track posts, lives, engagement & discovery', category: 'tiktok' },
  { id: 'gifter', name: 'Gifter Songs & Thank Yous', icon: Gift, description: 'Track gifters & generate thank you songs', category: 'tiktok' },
  { id: 'goals', name: 'Personal Goals', icon: Target, description: 'Goal tracking for all areas of life', category: 'productivity' },
  { id: 'journal', name: 'Daily Journal', icon: BookOpen, description: 'Reflections, venting & AI reframing', category: 'wellness' },
  { id: 'wellness', name: 'Wellness Tracker', icon: Heart, description: 'Water, sleep, mood & self-care', category: 'wellness' },
  { id: 'supplements', name: 'Supplements & Vitamins', icon: Pill, description: 'Track daily supplements', category: 'wellness' },
  { id: 'medications', name: 'Medications', icon: Pill, description: 'Medication tracking & reminders', category: 'wellness' },
  { id: 'mental_health', name: 'Mental Health', icon: Brain, description: 'Mental health profile & support', category: 'wellness' },
  { id: 'people', name: 'My People', icon: Users, description: 'Track birthdays, contacts & relationships', category: 'personal' },
  { id: 'pets', name: 'Pet Care', icon: PawPrint, description: 'Pet schedules, feeding & activities', category: 'personal' },
  { id: 'care_reminders', name: 'Care Reminders', icon: Heart, description: 'Reminders for caring for others', category: 'personal' },
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
  { id: 'stress', label: 'Stress / Overwhelm', emoji: '😫' },
  { id: 'loneliness', label: 'Loneliness', emoji: '💔' },
  { id: 'grief', label: 'Grief / Loss', emoji: '🕊️' },
  { id: 'trauma', label: 'Trauma / PTSD', emoji: '💜' },
  { id: 'anger', label: 'Anger Management', emoji: '😤' },
  { id: 'sleep', label: 'Sleep Issues', emoji: '😴' },
];

const improvementGoals = [
  { id: 'self_esteem', label: 'Self-Esteem', emoji: '💪' },
  { id: 'confidence', label: 'Confidence', emoji: '✨' },
  { id: 'boundaries', label: 'Setting Boundaries', emoji: '🚧' },
  { id: 'relationships', label: 'Relationships', emoji: '❤️' },
  { id: 'productivity', label: 'Productivity', emoji: '📈' },
  { id: 'mindfulness', label: 'Mindfulness', emoji: '🧘' },
  { id: 'self_care', label: 'Self-Care', emoji: '🛁' },
  { id: 'emotional_regulation', label: 'Emotional Regulation', emoji: '🎭' },
  { id: 'motivation', label: 'Motivation', emoji: '🔥' },
  { id: 'gratitude', label: 'Gratitude', emoji: '🙏' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedGreeting, setSelectedGreeting] = useState('positive_quote');
  const [selectedModules, setSelectedModules] = useState(['tiktok', 'goals', 'wellness', 'journal']);
  const [selectedStruggles, setSelectedStruggles] = useState([]);
  const [selectedImprovements, setSelectedImprovements] = useState([]);
  const [selectedTimezone, setSelectedTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York');
  const [themeData, setThemeData] = useState({
    theme_type: 'clean_white',
    metal_accent: 'gold'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleModule = (moduleId) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const toggleStruggle = (id) => {
    setSelectedStruggles(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleImprovement = (id) => {
    setSelectedImprovements(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const completeOnboarding = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await base44.auth.me();
      
      // Check if preferences already exist
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
        accessibility_mode: 'standard',
        use_text_to_speech: false,
        enable_self_care_gating: false,
        required_self_care_tasks: [],
        gated_modules: [],
        enable_ai_journaling: true,
        show_daily_affirmations: selectedGreeting === 'affirmation',
        use_simplified_interface: false,
        reduce_animations: false,
        use_checklists: false,
        onboarding_completed: true
      };
      
      if (existingPrefs && existingPrefs.length > 0) {
        await base44.entities.UserPreferences.update(existingPrefs[0].id, prefsData);
      } else {
        await base44.entities.UserPreferences.create(prefsData);
      }

      window.location.href = createPageUrl('Dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('There was an error setting up your account. Please try again.');
      setLoading(false);
    }
  };

  const categoryLabels = {
    tiktok: '📱 TikTok & Creator Tools',
    productivity: '🎯 Productivity',
    wellness: '💜 Wellness & Health',
    personal: '👥 Personal & Relationships'
  };

  const groupedModules = modules.reduce((acc, module) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-6 pt-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
                alt="ThriveNut Logo" 
                className="w-16 h-16 mx-auto mb-3"
              />
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Welcome to ThriveNut
              </CardTitle>
              <p className="text-gray-600 mt-1">Let's personalize your experience</p>
            </motion.div>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            {/* Progress indicator */}
            <div className="flex justify-center mb-6">
              {[1, 2, 3, 4, 5].map(num => (
                <div key={num} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    step >= num ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {num}
                  </div>
                  {num < 5 && <div className={`w-8 h-1 mx-1 ${step > num ? 'bg-purple-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {error && (
              <Alert className="mb-4 bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Choose Modules */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-xl font-bold mb-2 text-center">What would you like to track?</h3>
                <p className="text-gray-500 text-sm text-center mb-4">Select all that interest you - you can change these anytime in Settings</p>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {Object.entries(groupedModules).map(([category, categoryModules]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">{categoryLabels[category]}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryModules.map(module => {
                          const Icon = module.icon;
                          return (
                            <div
                              key={module.id}
                              onClick={() => toggleModule(module.id)}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedModules.includes(module.id)
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox checked={selectedModules.includes(module.id)} className="pointer-events-none" />
                                <Icon className="w-4 h-4 text-purple-500" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm">{module.name}</h4>
                                  <p className="text-xs text-gray-500 truncate">{module.description}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <Info className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-800">
                    You can add or remove features anytime in Settings
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={() => setStep(2)} 
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700 h-11"
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Step 2: Choose Theme */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-xl font-bold mb-4 text-center">Pick your appearance</h3>
                <ThemeSelector themeData={themeData} onChange={setThemeData} />
                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={() => setStep(1)} 
                    variant="outline"
                    className="flex-1 h-11"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep(3)} 
                    className="flex-1 bg-purple-600 hover:bg-purple-700 h-11"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Choose Timezone */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-xl font-bold mb-4 text-center">What's your timezone?</h3>
                <p className="text-gray-600 text-center mb-4 text-sm">
                  We'll show all times in your timezone
                </p>
                <TimezoneSelector 
                  value={selectedTimezone}
                  onChange={setSelectedTimezone}
                />
                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={() => setStep(2)} 
                    variant="outline"
                    className="flex-1 h-11"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep(4)} 
                    className="flex-1 bg-purple-600 hover:bg-purple-700 h-11"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Mental Health Focus */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-xl font-bold mb-2 text-center">What are you working on?</h3>
                <p className="text-gray-500 text-sm text-center mb-4">
                  This helps us personalize your affirmations and support. 100% private. 💜
                </p>
                
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Things I'm working through...</h4>
                    <div className="flex flex-wrap gap-2">
                      {struggles.map(item => (
                        <button
                          key={item.id}
                          onClick={() => toggleStruggle(item.id)}
                          className={`px-3 py-2 rounded-full border-2 text-sm transition-all ${
                            selectedStruggles.includes(item.id)
                              ? 'border-purple-500 bg-purple-100 text-purple-800'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <span className="mr-1">{item.emoji}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Things I want to improve...</h4>
                    <div className="flex flex-wrap gap-2">
                      {improvementGoals.map(item => (
                        <button
                          key={item.id}
                          onClick={() => toggleImprovement(item.id)}
                          className={`px-3 py-2 rounded-full border-2 text-sm transition-all ${
                            selectedImprovements.includes(item.id)
                              ? 'border-pink-500 bg-pink-100 text-pink-800'
                              : 'border-gray-200 hover:border-pink-300'
                          }`}
                        >
                          <span className="mr-1">{item.emoji}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Alert className="mt-4 bg-purple-50 border-purple-200">
                  <Heart className="w-4 h-4 text-purple-600" />
                  <AlertDescription className="text-sm text-purple-800">
                    You can skip this or update it anytime. We'll use this to give you relevant affirmations and support.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3 mt-4">
                  <Button 
                    onClick={() => setStep(3)} 
                    variant="outline"
                    className="flex-1 h-11"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep(5)} 
                    className="flex-1 bg-purple-600 hover:bg-purple-700 h-11"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Choose Greeting */}
            {step === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-xl font-bold mb-4 text-center">How should we greet you each day?</h3>
                <div className="space-y-3">
                  {greetingTypes.map(greeting => (
                    <div
                      key={greeting.id}
                      onClick={() => setSelectedGreeting(greeting.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedGreeting === greeting.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedGreeting === greeting.id
                            ? 'border-purple-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedGreeting === greeting.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{greeting.name}</h4>
                          <p className="text-sm text-gray-600">{greeting.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={() => setStep(4)} 
                    variant="outline"
                    className="flex-1 h-11"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={completeOnboarding}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-11"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      "Let's Go! 🎉"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}