import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveDebug, setSaveDebug] = useState('');
  const [customItemInput, setCustomItemInput] = useState('');
  const [customItemCategory, setCustomItemCategory] = useState('conditions');
  const [submittingCustomItem, setSubmittingCustomItem] = useState(false);
  const [newCustomStruggle, setNewCustomStruggle] = useState('');
  const [newCustomGoal, setNewCustomGoal] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    setLoading(false);
  }, []);

  const { preferences, effectiveEmail } = useTheme();

  const [profile, setProfile] = useState({
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

  // Fetch MentalHealthProfile
  const { data: mentalHealthProfile } = useQuery({
    queryKey: ['mentalHealthProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.MentalHealthProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (mentalHealthProfile) {
      setProfile({
        accessibility_mode: mentalHealthProfile.accessibility_mode || 'standard',
        enable_self_care_gating: mentalHealthProfile.enable_self_care_gating || false,
        required_self_care_tasks: mentalHealthProfile.required_self_care_tasks || [],
        gated_modules: mentalHealthProfile.gated_modules || [],
        mental_health_struggles: mentalHealthProfile.mental_health_struggles || [],
        improvement_goals: mentalHealthProfile.improvement_goals || [],
        enable_ai_journaling: mentalHealthProfile.enable_ai_journaling !== false,
        show_daily_affirmations: mentalHealthProfile.show_daily_affirmations || false,
        use_simplified_interface: mentalHealthProfile.use_simplified_interface || false,
        reduce_animations: mentalHealthProfile.reduce_animations || false,
        use_checklists: mentalHealthProfile.use_checklists || false,
        is_bible_believer: mentalHealthProfile.is_bible_believer || false,
      });
    }
  }, [mentalHealthProfile]);



  const toggleSelfCareTask = (taskId) => {
    setProfile(prev => ({
      ...prev,
      required_self_care_tasks: prev.required_self_care_tasks.includes(taskId)
        ? prev.required_self_care_tasks.filter(id => id !== taskId)
        : [...prev.required_self_care_tasks, taskId]
    }));
  };

  const toggleGatedModule = (moduleId) => {
    setProfile(prev => ({
      ...prev,
      gated_modules: prev.gated_modules.includes(moduleId)
        ? prev.gated_modules.filter(id => id !== moduleId)
        : [...prev.gated_modules, moduleId]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveDebug('🎯 SAVE STARTED...');
    
    const dataToSend = {
      user_email: user?.email,
      accessibility_mode: profile.accessibility_mode,
      enable_self_care_gating: profile.enable_self_care_gating,
      required_self_care_tasks: profile.required_self_care_tasks,
      gated_modules: profile.gated_modules,
      mental_health_struggles: profile.mental_health_struggles,
      improvement_goals: profile.improvement_goals,
      enable_ai_journaling: profile.enable_ai_journaling,
      show_daily_affirmations: profile.show_daily_affirmations
    };
    
    setSaveDebug(`📤 Sending: ${JSON.stringify(dataToSend, null, 2)}`);
    
    try {
      if (mentalHealthProfile?.id) {
        setSaveDebug(`📝 UPDATING profile #${mentalHealthProfile.id}`);
        await base44.entities.MentalHealthProfile.update(mentalHealthProfile.id, dataToSend);
      } else {
        setSaveDebug(`➕ CREATING new profile for ${user?.email}`);
        await base44.entities.MentalHealthProfile.create(dataToSend);
      }
      
      queryClient.invalidateQueries({ queryKey: ['mentalHealthProfile', user?.email] });
      setSaveDebug('✅ SAVE SUCCESSFUL');
      toast.success("Mental health profile saved!");
    } catch (error) {
      setSaveDebug(`❌ SAVE FAILED: ${error.message}\n\nFull error: ${JSON.stringify(error, null, 2)}`);
      toast.error(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
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
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Debug Panel */}
        {saveDebug && (
          <div className={`p-4 rounded-lg border font-mono text-xs whitespace-pre-wrap ${isDark ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-900'}`}>
            <strong>Debug Info:</strong>
            {'\n'}{saveDebug}
          </div>
        )}

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
                  checked={profile.enable_self_care_gating}
                  onCheckedChange={(val) => setProfile({...profile, enable_self_care_gating: val})}
                />
              </div>

              {profile.enable_self_care_gating && (
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
                            profile.required_self_care_tasks.includes(task.id)
                              ? `border-purple-500 ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`
                              : `${isDark ? 'border-gray-600 hover:border-purple-400' : 'border-gray-200 hover:border-purple-300'}`
                          }`}
                        >
                          <div className="flex items-center gap-3">
                             <Checkbox checked={profile.required_self_care_tasks.includes(task.id)} />
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
                            profile.gated_modules.includes(module.id)
                              ? `border-pink-500 ${isDark ? 'bg-pink-900/30' : 'bg-pink-50'}`
                              : `${isDark ? 'border-gray-600 hover:border-pink-400' : 'border-gray-200 hover:border-pink-300'}`
                          }`}
                        >
                          <div className="flex items-center gap-3">
                             <Checkbox checked={profile.gated_modules.includes(module.id)} />
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
                       profile.mental_health_struggles.includes(item.id)
                         ? `border-purple-500 ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'}`
                         : `${isDark ? 'border-gray-600 hover:border-purple-400 text-gray-300' : 'border-gray-200 hover:border-purple-300'}`
                     }`}
                     onClick={() => {
                       setProfile(prev => {
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
                       profile.improvement_goals.includes(item.id)
                         ? `border-pink-500 ${isDark ? 'bg-pink-900/50 text-pink-300' : 'bg-pink-100 text-pink-800'}`
                         : `${isDark ? 'border-gray-600 hover:border-pink-400 text-gray-300' : 'border-gray-200 hover:border-pink-300'}`
                     }`}
                     onClick={() => {
                       setProfile(prev => {
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

              {/* Custom Items Section */}
              <div className="mt-8 border-t pt-6">
                <h2 className={`text-xl font-semibold mb-4 ${textClass}`}>Custom Items</h2>
                <p className={`text-sm ${subtextClass} mb-4`}>Add your own items. These will appear with your selections.</p>

                {/* Things I'm working through */}
                <div className="mb-6">
                  <h3 className={`font-medium ${textClass} mb-2`}>Things I'm working through...</h3>
                  <div className="flex gap-2 mb-3">
                    <Input 
                      placeholder="e.g., 'Burnout'" 
                      value={newCustomStruggle} 
                      onChange={(e) => setNewCustomStruggle(e.target.value)} 
                      className="flex-1" 
                    />
                    <Button onClick={() => {
                      if (!newCustomStruggle?.trim()) return;
                      setProfile(prev => ({ ...prev, mental_health_struggles: [...(prev.mental_health_struggles || []), newCustomStruggle.trim()] }));
                      setNewCustomStruggle('');
                    }}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.mental_health_struggles?.filter(item => !struggles.map(s => s.id).includes(item)).map(item => (
                      <span key={item} className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'}`}>
                        <Sparkles className="w-3 h-3" />{item}
                        <button onClick={() => setProfile(prev => ({ ...prev, mental_health_struggles: prev.mental_health_struggles.filter(i => i !== item) }))} className={`ml-1 hover:opacity-70 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Things I want to improve */}
                <div>
                  <h3 className={`font-medium ${textClass} mb-2`}>Things I want to improve...</h3>
                  <div className="flex gap-2 mb-3">
                    <Input 
                      placeholder="e.g., 'Time Freedom'" 
                      value={newCustomGoal} 
                      onChange={(e) => setNewCustomGoal(e.target.value)} 
                      className="flex-1" 
                    />
                    <Button onClick={() => {
                      if (!newCustomGoal?.trim()) return;
                      setProfile(prev => ({ ...prev, improvement_goals: [...(prev.improvement_goals || []), newCustomGoal.trim()] }));
                      setNewCustomGoal('');
                    }}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.improvement_goals?.filter(item => !improvementGoals.map(s => s.id).includes(item)).map(item => (
                      <span key={item} className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${isDark ? 'bg-teal-900/50 text-teal-300' : 'bg-teal-100 text-teal-800'}`}>
                        <Sparkles className="w-3 h-3" />{item}
                        <button onClick={() => setProfile(prev => ({ ...prev, improvement_goals: prev.improvement_goals.filter(i => i !== item) }))} className={`ml-1 hover:opacity-70 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>×</button>
                      </span>
                    ))}
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
                onClick={() => setProfile({...profile, enable_ai_journaling: !profile.enable_ai_journaling})}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  profile.enable_ai_journaling
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
                  <Switch checked={profile.enable_ai_journaling} />
                </div>
              </div>

              <div
                onClick={() => setProfile({...profile, show_daily_affirmations: !profile.show_daily_affirmations})}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  profile.show_daily_affirmations
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
                  <Switch checked={profile.show_daily_affirmations} />
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