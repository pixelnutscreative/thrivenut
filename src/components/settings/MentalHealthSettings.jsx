import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Heart } from 'lucide-react';

const commonStruggles = [
  'ADHD / Focus', 'Anger Management', 'Anxiety', 'Autism / Sensory', 
  'Depression', 'Grief / Loss', 'Loneliness', 'Sleep Issues', 
  'Stress / Overwhelm', 'Trauma / PTSD'
];

const improvementGoals = [
  'Confidence', 'Emotional Regulation', 'Gratitude', 'Mindfulness', 
  'Motivation', 'Productivity', 'Relationships', 'Self-Care', 
  'Self-Esteem', 'Setting Boundaries'
];

export default function MentalHealthSettings({ formData, setFormData }) {
  const [customItem, setCustomItem] = useState('');

  const toggleStruggle = (struggle) => {
    const current = formData.mental_health_struggles || [];
    const updated = current.includes(struggle)
      ? current.filter(s => s !== struggle)
      : [...current, struggle];
    setFormData({ ...formData, mental_health_struggles: updated });
  };

  const toggleGoal = (goal) => {
    const current = formData.improvement_goals || [];
    const updated = current.includes(goal)
      ? current.filter(g => g !== goal)
      : [...current, goal];
    setFormData({ ...formData, improvement_goals: updated });
  };

  const addCustomItem = () => {
    if (!customItem.trim()) return;
    // Add to struggles by default for now, or maybe infer? 
    // Let's just add to struggles as "Custom" usually implies something specific they are dealing with.
    // Or maybe we allow them to be added to struggles. The UI in onboarding separates them.
    // Let's stick to adding to struggles for "custom areas" as per onboarding logic.
    const current = formData.mental_health_struggles || [];
    if (!current.includes(customItem.trim())) {
      setFormData({ ...formData, mental_health_struggles: [...current, customItem.trim()] });
    }
    setCustomItem('');
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-500" /> What You're Working On
        </CardTitle>
        <CardDescription>
          This helps personalize your affirmations and AI support. 100% private. 💜
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Struggles */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Things I'm working through...</Label>
          <div className="flex flex-wrap gap-2">
            {commonStruggles.map(struggle => {
              const isSelected = (formData.mental_health_struggles || []).includes(struggle);
              return (
                <button
                  key={struggle}
                  onClick={() => toggleStruggle(struggle)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isSelected 
                      ? 'bg-orange-50 border-orange-200 text-orange-700' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {isSelected && <span className="mr-1">😓</span>}
                  {struggle}
                </button>
              );
            })}
            {/* Show custom added items that are NOT in the common list */}
            {(formData.mental_health_struggles || []).filter(s => !commonStruggles.includes(s)).map(custom => (
              <button
                key={custom}
                onClick={() => toggleStruggle(custom)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border bg-orange-50 border-orange-200 text-orange-700"
              >
                <span className="mr-1">🔹</span>
                {custom}
              </button>
            ))}
          </div>
        </div>

        {/* Improvements */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Things I want to improve...</Label>
          <div className="flex flex-wrap gap-2">
            {improvementGoals.map(goal => {
              const isSelected = (formData.improvement_goals || []).includes(goal);
              return (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {isSelected && <span className="mr-1">✨</span>}
                  {goal}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <div className="pt-2">
          <Label className="text-xs text-gray-500 mb-2 block">Custom Items I'm Working On</Label>
          <div className="flex gap-2">
            <Input 
              value={customItem}
              onChange={(e) => setCustomItem(e.target.value)}
              placeholder="Add custom item (e.g. 'Burnout')"
              className="text-sm"
              onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
            />
            <button 
              onClick={addCustomItem}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
            >
              Add
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Add your own custom items. Once submitted, admin can add them to the global list for others.
          </p>
        </div>

      </CardContent>
    </Card>
  );
}