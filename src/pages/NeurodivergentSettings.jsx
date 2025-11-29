import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Brain, Heart, Sparkles, Eye, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import CrisisResourcesCard from '../components/mental-health/CrisisResourcesCard';
import { useTheme } from '../components/shared/useTheme';

const selfCareTasks = [
  { id: 'shower', label: 'Shower/Bath', description: 'Daily hygiene' },
  { id: 'breakfast', label: 'Breakfast', description: 'Eat like a king 👑' },
  { id: 'lunch', label: 'Lunch', description: 'Eat like a prince 🤴' },
  { id: 'dinner', label: 'Dinner', description: 'Eat like a pauper 🥄' },
  { id: 'brush_teeth', label: 'Brush Teeth', description: 'Dental hygiene' },
  { id: 'medications', label: 'Medications', description: 'Daily medications' },
  { id: 'supplements', label: 'Supplements', description: 'Daily vitamins' },
  { id: 'water', label: 'Drink Water', description: 'Stay hydrated' },
  { id: 'physical_activity', label: 'Physical Activity', description: 'Move your body' },
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

const modules = [
  { id: 'tiktok', name: 'TikTok Goals' },
  { id: 'goals', name: 'Personal Goals' },
  { id: 'journal', name: 'Journal' },
  { id: 'wellness', name: 'Wellness Tracker' },
];

export default function NeurodivergentSettings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    setLoading(false);
  }, []);

  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    accessibility_mode: 'standard',
    enable_self_care_gating: false,
    required_self_care_tasks: [],
    gated_modules: [],
    mental_health_struggles: [],
    improvement_goals: [],
    enable_ai_journaling: true,
    show_daily_affirmations: false,
    use_simplified_interface: false,
    reduce_animations: false,
    use_checklists: false,
    is_bible_believer: false,
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        accessibility_mode: preferences.accessibility_mode || 'standard',
        enable_self_care_gating: preferences.enable_self_care_gating || false,
        required_self_care_tasks: preferences.required_self_care_tasks || [],
        gated_modules: preferences.gated_modules || [],
        mental_health_struggles: preferences.mental_health_struggles || [],
        improvement_goals: preferences.improvement_goals || [],
        enable_ai_journaling: preferences.enable_ai_journaling !== false,
        show_daily_affirmations: preferences.show_daily_affirmations || false,
        use_simplified_interface: preferences.use_simplified_interface || false,
        reduce_animations: preferences.reduce_animations || false,
        use_checklists: preferences.use_checklists || false,
        is_bible_believer: preferences.is_bible_believer || false,
      });
    }
  }, [preferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences) {
        return await base44.entities.UserPreferences.update(preferences.id, data);
      } else {
        return await base44.entities.UserPreferences.create({
          user_email: user.email,
          ...data,
          onboarding_completed: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });

  const toggleSelfCareTask = (taskId) => {
    setFormData(prev => ({
      ...prev,
      required_self_care_tasks: prev.required_self_care_tasks.includes(taskId)
        ? prev.required_self_care_tasks.filter(id => id !== taskId)
        : [...prev.required_self_care_tasks, taskId]
    }));
  };

  const toggleGatedModule = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      gated_modules: prev.gated_modules.includes(moduleId)
        ? prev.gated_modules.filter(id => id !== moduleId)
        : [...prev.gated_modules, moduleId]
    }));
  };

  const toggleStruggle = (id) => {
    setFormData(prev => ({
      ...prev,
      mental_health_struggles: prev.mental_health_struggles.includes(id)
        ? prev.mental_health_struggles.filter(s => s !== id)
        : [...prev.mental_health_struggles, id]
    }));
  };

  const toggleImprovement = (id) => {
    setFormData(prev => ({
      ...prev,
      improvement_goals: prev.improvement_goals.includes(id)
        ? prev.improvement_goals.filter(s => s !== id)
        : [...prev.improvement_goals, id]
    }));
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(formData);
  };

  const { isDark, bgClass, textClass, cardBgClass, subtextClass } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${textClass} flex items-center gap-3`}>
              <Brain className="w-8 h-8 text-purple-600" />
              Mental Health & Wellness
            </h1>
            <p className={`${subtextClass} mt-1`}>Personalize your support, track your journey, and customize your experience</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={updatePreferencesMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {updatePreferencesMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Crisis Resources - Always at the top */}
        <CrisisResourcesCard />

        {/* Self-Care Gating */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={cardBgClass}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${textClass}`}>
                <Shield className="w-5 h-5 text-pink-500" />
                Self-Care Gating
              </CardTitle>
              <CardDescription className={subtextClass}>
                Block access to certain app features until you've completed basic self-care tasks.
                This is a gentle accountability tool from past-you to present-you. 💜
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'} rounded-lg`}>
                <div>
                  <Label className={`font-medium text-lg ${textClass}`}>Enable Self-Care Gating</Label>
                  <p className={`text-sm ${subtextClass}`}>
                    Require self-care completion before accessing selected modules
                  </p>
                </div>
                <Switch
                  checked={formData.enable_self_care_gating}
                  onCheckedChange={(val) => setFormData({...formData, enable_self_care_gating: val})}
                />
              </div>

              {formData.enable_self_care_gating && (
                <>
                  <div className="space-y-3">
                    <Label className={`font-medium ${textClass}`}>Required Self-Care Tasks</Label>
                    <p className={`text-sm ${subtextClass}`}>
                      Select which tasks must be completed before accessing gated modules
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {selfCareTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => toggleSelfCareTask(task.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.required_self_care_tasks.includes(task.id)
                              ? `border-purple-500 ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`
                              : `${isDark ? 'border-gray-600 hover:border-purple-400' : 'border-gray-200 hover:border-purple-300'}`
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox checked={formData.required_self_care_tasks.includes(task.id)} />
                            <div>
                              <span className={`font-medium ${textClass}`}>{task.label}</span>
                              <p className={`text-sm ${subtextClass}`}>{task.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className={`font-medium ${textClass}`}>Modules to Gate</Label>
                    <p className={`text-sm ${subtextClass}`}>
                      Select which modules will be locked until self-care is complete
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {modules.map(module => (
                        <div
                          key={module.id}
                          onClick={() => toggleGatedModule(module.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.gated_modules.includes(module.id)
                              ? `border-pink-500 ${isDark ? 'bg-pink-900/30' : 'bg-pink-50'}`
                              : `${isDark ? 'border-gray-600 hover:border-pink-400' : 'border-gray-200 hover:border-pink-300'}`
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox checked={formData.gated_modules.includes(module.id)} />
                            <span className={`font-medium ${textClass}`}>{module.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* What You're Working On */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={cardBgClass}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${textClass}`}>
                <Heart className="w-5 h-5 text-pink-500" />
                What You're Working On
              </CardTitle>
              <CardDescription className={subtextClass}>
                This helps personalize your affirmations and AI support. 100% private. 💜
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className={`font-medium mb-3 block ${textClass}`}>Things I'm working through...</Label>
                <div className="flex flex-wrap gap-2">
                  {struggles.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleStruggle(item.id)}
                      className={`px-3 py-2 rounded-full border-2 text-sm transition-all ${
                        formData.mental_health_struggles.includes(item.id)
                          ? `border-purple-500 ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'}`
                          : `${isDark ? 'border-gray-600 hover:border-purple-400 text-gray-300' : 'border-gray-200 hover:border-purple-300'}`
                      }`}
                    >
                      <span className="mr-1">{item.emoji}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className={`font-medium mb-3 block ${textClass}`}>Things I want to improve...</Label>
                <div className="flex flex-wrap gap-2">
                  {improvementGoals.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleImprovement(item.id)}
                      className={`px-3 py-2 rounded-full border-2 text-sm transition-all ${
                        formData.improvement_goals.includes(item.id)
                          ? `border-pink-500 ${isDark ? 'bg-pink-900/50 text-pink-300' : 'bg-pink-100 text-pink-800'}`
                          : `${isDark ? 'border-gray-600 hover:border-pink-400 text-gray-300' : 'border-gray-200 hover:border-pink-300'}`
                      }`}
                    >
                      <span className="mr-1">{item.emoji}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mental Wellness Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className={cardBgClass}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${textClass}`}>
                <Sparkles className="w-5 h-5 text-amber-500" />
                Mental Wellness Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onClick={() => setFormData({...formData, enable_ai_journaling: !formData.enable_ai_journaling})}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.enable_ai_journaling
                    ? `border-purple-500 ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`
                    : `${isDark ? 'border-gray-600 hover:border-purple-400' : 'border-gray-200 hover:border-purple-300'}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <div>
                      <span className={`font-medium ${textClass}`}>AI Therapeutic Journaling</span>
                      <p className={`text-sm ${subtextClass}`}>
                        Get perspective questions and reframing suggestions when journaling
                      </p>
                    </div>
                  </div>
                  <Switch checked={formData.enable_ai_journaling} />
                </div>
              </div>

              <div
                onClick={() => setFormData({...formData, show_daily_affirmations: !formData.show_daily_affirmations})}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.show_daily_affirmations
                    ? `border-amber-500 ${isDark ? 'bg-amber-900/30' : 'bg-amber-50'}`
                    : `${isDark ? 'border-gray-600 hover:border-amber-400' : 'border-gray-200 hover:border-amber-300'}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <div>
                      <span className={`font-medium ${textClass}`}>Daily Affirmations</span>
                      <p className={`text-sm ${subtextClass}`}>
                        Show personalized daily affirmations on your dashboard
                      </p>
                    </div>
                  </div>
                  <Switch checked={formData.show_daily_affirmations} />
                </div>
              </div>

              <div
                onClick={() => setFormData({...formData, is_bible_believer: !formData.is_bible_believer})}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.is_bible_believer
                    ? `border-amber-600 ${isDark ? 'bg-amber-900/30' : 'bg-amber-50'}`
                    : `${isDark ? 'border-gray-600 hover:border-amber-400' : 'border-gray-200 hover:border-amber-300'}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📖</span>
                    <div>
                      <span className={`font-medium ${textClass}`}>I'm a Bible Believer</span>
                      <p className={`text-sm ${subtextClass}`}>
                        Show morning & night Bible reading checkboxes in self-care
                      </p>
                    </div>
                  </div>
                  <Switch checked={formData.is_bible_believer} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Alert */}
        <Alert className={isDark ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'}>
          <Heart className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <AlertDescription className={isDark ? 'text-purple-300' : 'text-purple-800'}>
            These settings are designed with love for neurodivergent minds. Remember: 
            you're not broken, your brain just works differently - and that's beautiful. 💜
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}