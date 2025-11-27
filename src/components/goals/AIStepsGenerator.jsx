import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Check, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const goalTypePrompts = {
  habit: 'This is a recurring habit goal. Focus on building consistency and tracking daily/weekly actions.',
  project: 'This is a one-time project goal. Break it down into sequential steps that lead to completion.',
  milestone: 'This is a milestone goal (single achievement). Focus on prerequisites and actions needed to reach this milestone.',
  learning: 'This is a learning goal. Include research, practice, skill-building, and mastery steps.',
  preparation: 'This is a preparation goal (getting ready for something). Focus on mental, emotional, and practical preparation steps.'
};

export default function AIStepsGenerator({ goalTitle, goalDescription, goalType = 'project', onStepsGenerated, existingSteps = [] }) {
  const [loading, setLoading] = useState(false);
  const [suggestedSteps, setSuggestedSteps] = useState([]);
  const [selectedSteps, setSelectedSteps] = useState([]);

  const generateSteps = async () => {
    if (!goalTitle.trim()) return;
    
    setLoading(true);
    setSuggestedSteps([]);
    setSelectedSteps([]);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a goal-setting expert helping someone break down their goal into actionable steps.

Goal: "${goalTitle}"
${goalDescription ? `Description: "${goalDescription}"` : ''}
Goal Type: ${goalType} - ${goalTypePrompts[goalType] || goalTypePrompts.project}

Break this goal down into 5-8 specific, actionable steps or mini-goals that someone would need to complete to achieve this goal. 

Rules:
- Each step should be concrete and achievable
- Steps should be in logical order (what needs to happen first)
- Focus on practical actions, not abstract concepts
- Keep each step concise (under 50 characters if possible)
- Consider any prerequisites or dependencies
- For preparation goals, include mental/emotional readiness steps
- For learning goals, include practice and skill-building steps

Return the steps as a JSON array.`,
        response_json_schema: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              items: {
                type: "string"
              },
              description: "List of actionable steps to achieve the goal"
            }
          }
        }
      });

      if (result.steps && Array.isArray(result.steps)) {
        setSuggestedSteps(result.steps);
        setSelectedSteps(result.steps.map(() => true)); // Select all by default
      }
    } catch (error) {
      console.error('Error generating steps:', error);
    }
    
    setLoading(false);
  };

  const toggleStep = (index) => {
    setSelectedSteps(prev => {
      const newSelected = [...prev];
      newSelected[index] = !newSelected[index];
      return newSelected;
    });
  };

  const applySteps = () => {
    const stepsToAdd = suggestedSteps
      .filter((_, idx) => selectedSteps[idx])
      .map((title, idx) => ({
        id: `step_${Date.now()}_${idx}`,
        title,
        completed: false
      }));
    
    onStepsGenerated([...existingSteps, ...stepsToAdd]);
    setSuggestedSteps([]);
    setSelectedSteps([]);
  };

  const clearSuggestions = () => {
    setSuggestedSteps([]);
    setSelectedSteps([]);
  };

  return (
    <div className="space-y-3">
      {suggestedSteps.length === 0 ? (
        <Button
          type="button"
          variant="outline"
          onClick={generateSteps}
          disabled={loading || !goalTitle.trim()}
          className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating steps...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Generate Steps with AI</>
          )}
        </Button>
      ) : (
        <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Suggested Steps
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSuggestions}
              className="h-7 text-gray-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <AnimatePresence>
              {suggestedSteps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => toggleStep(idx)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    selectedSteps[idx] 
                      ? 'bg-white border-2 border-purple-400' 
                      : 'bg-gray-100 border-2 border-transparent opacity-60'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedSteps[idx] ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                  }`}>
                    {selectedSteps[idx] && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm flex-1">{step}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateSteps}
              disabled={loading}
              className="flex-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Regenerate'}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={applySteps}
              disabled={!selectedSteps.some(s => s)}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add {selectedSteps.filter(s => s).length} Steps
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}