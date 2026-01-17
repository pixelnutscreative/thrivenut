import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Brain, Heart, Sparkles, Eye, Shield, Zap, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
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

export default function MentalHealth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customItemInput, setCustomItemInput] = useState('');
  const [customItemCategory, setCustomItemCategory] = useState('conditions');
  const [submittingCustomItem, setSubmittingCustomItem] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    setLoading(false);
  }, []);

  const { preferences, effectiveEmail } = useTheme();

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
      if (preferences?.id) {
        return await base44.entities.UserPreferences.update(preferences.id, data);
      } else {
        // Safety check to avoid duplicate creation
        const existing = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
        if (existing.length > 0) {
           return await base44.entities.UserPreferences.update(existing[0].id, data);
        }
        return await base44.entities.UserPreferences.create({
          user_email: effectiveEmail,
          ...data,
          onboarding_completed: true
        });
      }
    },
    onSuccess: () => {
      // Invalidate the useTheme query key
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



  const handleSave = () => {
    updatePreferencesMutation.mutate(formData);
  };

  const handleSubmitCustomItem = async () => {
    if (!customItemInput.trim() || !user?.email) return;

    setSubmittingCustomItem(true);
    try {
      await base44.entities.MentalHealthCustomItems.create({
        user_email: user.email,
        item_text: customItemInput.trim(),
        category: customItemCategory,
        status: 'pending'
      });
      
      toast.success(`"${customItemInput.trim()}" submitted for admin review!`);
      setCustomItemInput('');
      setCustomItemCategory('conditions');
    } catch (error) {
      console.error('Submit custom item error:', error);
      toast.error(`Error submitting item: ${error.message}`);
    } finally {
      setSubmittingCustomItem(false);
    }
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
                   <div
                     key={item.id}
                     className={`px-3 py-2 rounded-full border-2 text-sm transition-all cursor-pointer ${
                       formData.mental_health_struggles.includes(item.id)
                         ? `border-purple-500 ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'}`
                         : `${isDark ? 'border-gray-600 hover:border-purple-400 text-gray-300' : 'border-gray-200 hover:border-purple-300'}`
                     }`}
                     onClick={() => {
                       setFormData(prev => {
                         const currentList = prev.mental_health_struggles || [];
                         const newList = currentList.includes(item.id)
                           ? currentList.filter(s => s !== item.id)
                           : [...currentList, item.id];
                         return { ...prev, mental_health_struggles: newList };
                       });
                     }}
                   >
                     <span className="mr-1">{item.emoji}</span>
                     {item.label}
                   </div>
                 ))}
               </div>
              </div>

              <div>
               <Label className={`font-medium mb-3 block ${textClass}`}>Things I want to improve...</Label>
               <div className="flex flex-wrap gap-2">
                 {improvementGoals.map(item => (
                   <div
                     key={item.id}
                     className={`px-3 py-2 rounded-full border-2 text-sm transition-all cursor-pointer ${
                       formData.improvement_goals.includes(item.id)
                         ? `border-pink-500 ${isDark ? 'bg-pink-900/50 text-pink-300' : 'bg-pink-100 text-pink-800'}`
                         : `${isDark ? 'border-gray-600 hover:border-pink-400 text-gray-300' : 'border-gray-200 hover:border-pink-300'}`
                     }`}
                     onClick={() => {
                       setFormData(prev => {
                         const currentList = prev.improvement_goals || [];
                         const newList = currentList.includes(item.id)
                           ? currentList.filter(s => s !== item.id)
                           : [...currentList, item.id];
                         return { ...prev, improvement_goals: newList };
                       });
                     }}
                   >
                     <span className="mr-1">{item.emoji}</span>
                     {item.label}
                   </div>
                 ))}
               </div>
              </div>

              {/* Custom Working On Bubbles */}
              <div className="pt-4 border-t">
                <Label className={`font-medium mb-2 block ${textClass}`}>Custom Items I'm Working On</Label>
                <p className={`text-sm ${subtextClass} mb-3`}>
                  Add your own custom items. Once submitted, admin can add them to the global list for others.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.mental_health_struggles.filter(item => !struggles.map(s => s.id).includes(item)).map(item => (
                    <Badge key={item} className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full cursor-pointer hover:bg-purple-200" onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        mental_health_struggles: prev.mental_health_struggles.filter(s => s !== item)
                      }));
                    }}>
                      {item} <span className="ml-1">×</span>
                    </Badge>
                  ))}
                  {formData.improvement_goals.filter(item => !improvementGoals.map(s => s.id).includes(item)).map(item => (
                    <Badge key={item} className="bg-pink-100 text-pink-800 text-sm px-3 py-1 rounded-full cursor-pointer hover:bg-pink-200" onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        improvement_goals: prev.improvement_goals.filter(s => s !== item)
                      }));
                    }}>
                      {item} <span className="ml-1">×</span>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="custom-item" className="sr-only">Add custom item</Label>
                    <div className="flex gap-2">
                      <Select value={customItemCategory} onValueChange={setCustomItemCategory}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conditions">Working Through</SelectItem>
                          <SelectItem value="goals">Want to Improve</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="custom-item"
                        placeholder="Add custom item (e.g. 'Burnout')"
                        value={customItemInput}
                        onChange={(e) => setCustomItemInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customItemInput.trim() && !submittingCustomItem) {
                            e.preventDefault();
                            handleSubmitCustomItem();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSubmitCustomItem}
                        disabled={submittingCustomItem || !customItemInput.trim()}
                        variant="outline"
                      >
                        {submittingCustomItem ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Submit for admin review (appears in your list when approved)</p>
                  </div>
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