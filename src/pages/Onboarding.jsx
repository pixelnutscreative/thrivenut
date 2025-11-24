import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Heart, Target, Sparkles, BookOpen, Home, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const themes = [
  { id: 'soft_purple', name: 'Soft Purple', colors: ['#F3F1FF', '#8B7FD6', '#6B5FCC'] },
  { id: 'warm_peach', name: 'Warm Peach', colors: ['#FFF5F1', '#FF9B85', '#FF7A5C'] },
  { id: 'mint_fresh', name: 'Mint Fresh', colors: ['#F0FFF7', '#7ECDA0', '#5EB87E'] },
  { id: 'calm_blue', name: 'Calm Blue', colors: ['#F0F7FF', '#7BA3D6', '#5B8BD6'] },
  { id: 'dark_mode', name: 'Dark Mode', colors: ['#1A1A1A', '#4A4A4A', '#6A6A6A'] }
];

const modules = [
  { id: 'tiktok', name: 'TikTok Content Goals', icon: TrendingUp, description: 'Track posts, lives, and engagement' },
  { id: 'goals', name: 'Goals & Habits', icon: Target, description: 'Personal goal tracking' },
  { id: 'wellness', name: 'Wellness Tracker', icon: Heart, description: 'Water, sleep, and mood' },
  { id: 'journal', name: 'Daily Journal', icon: BookOpen, description: 'Reflections and thoughts' }
];

const greetingTypes = [
  { id: 'scripture', name: 'Scripture', description: 'Daily Bible verse' },
  { id: 'positive_quote', name: 'Positive Quote', description: 'Uplifting quotes' },
  { id: 'motivational', name: 'Motivational', description: 'Get pumped up!' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState('soft_purple');
  const [selectedGreeting, setSelectedGreeting] = useState('positive_quote');
  const [selectedModules, setSelectedModules] = useState(['tiktok', 'goals', 'wellness', 'journal']);
  const [loading, setLoading] = useState(false);

  const toggleModule = (moduleId) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      await base44.entities.UserPreferences.create({
        user_email: user.email,
        theme: selectedTheme,
        greeting_type: selectedGreeting,
        enabled_modules: selectedModules,
        onboarding_completed: true
      });

      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Onboarding error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-8 pt-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
                alt="ThriveNut Logo" 
                className="w-20 h-20 mx-auto mb-4"
              />
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Welcome to ThriveNut
              </CardTitle>
              <p className="text-gray-600 mt-2">Let's personalize your experience</p>
            </motion.div>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            {/* Progress indicator */}
            <div className="flex justify-center mb-8">
              {[1, 2, 3].map(num => (
                <div key={num} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= num ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {num}
                  </div>
                  {num < 3 && <div className={`w-16 h-1 mx-2 ${step > num ? 'bg-purple-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Choose Modules */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-2xl font-bold mb-6 text-center">What would you like to track?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modules.map(module => {
                    const Icon = module.icon;
                    return (
                      <div
                        key={module.id}
                        onClick={() => toggleModule(module.id)}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedModules.includes(module.id)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox checked={selectedModules.includes(module.id)} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-5 h-5 text-purple-500" />
                              <h4 className="font-semibold">{module.name}</h4>
                            </div>
                            <p className="text-sm text-gray-600">{module.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button 
                  onClick={() => setStep(2)} 
                  className="w-full mt-8 bg-purple-600 hover:bg-purple-700 h-12 text-lg"
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
                <h3 className="text-2xl font-bold mb-6 text-center">Pick your vibe</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {themes.map(theme => (
                    <div
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedTheme === theme.id
                          ? 'border-purple-500 ring-4 ring-purple-100'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex gap-2 mb-3">
                        {theme.colors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded-full shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className="font-semibold text-center">{theme.name}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-8">
                  <Button 
                    onClick={() => setStep(1)} 
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep(3)} 
                    className="flex-1 bg-purple-600 hover:bg-purple-700 h-12 text-lg"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Choose Greeting */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-2xl font-bold mb-6 text-center">How should we greet you each day?</h3>
                <div className="space-y-4">
                  {greetingTypes.map(greeting => (
                    <div
                      key={greeting.id}
                      onClick={() => setSelectedGreeting(greeting.id)}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedGreeting === greeting.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedGreeting === greeting.id
                            ? 'border-purple-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedGreeting === greeting.id && (
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{greeting.name}</h4>
                          <p className="text-sm text-gray-600">{greeting.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-8">
                  <Button 
                    onClick={() => setStep(2)} 
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={completeOnboarding}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-lg"
                  >
                    {loading ? 'Setting up...' : "Let's Go! 🎉"}
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