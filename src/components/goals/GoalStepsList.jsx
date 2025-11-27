import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GoalStepsList({ steps = [], onChange, editable = true }) {
  const [newStepTitle, setNewStepTitle] = useState('');

  const toggleStep = (stepId) => {
    const updatedSteps = steps.map(step =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );
    onChange(updatedSteps);
  };

  const addStep = () => {
    if (!newStepTitle.trim()) return;
    const newStep = {
      id: `step_${Date.now()}`,
      title: newStepTitle.trim(),
      completed: false
    };
    onChange([...steps, newStep]);
    setNewStepTitle('');
  };

  const removeStep = (stepId) => {
    onChange(steps.filter(step => step.id !== stepId));
  };

  const updateStepTitle = (stepId, newTitle) => {
    const updatedSteps = steps.map(step =>
      step.id === stepId ? { ...step, title: newTitle } : step
    );
    onChange(updatedSteps);
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div className="space-y-3">
      {steps.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{completedCount} of {steps.length} steps completed</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
      )}
      
      {steps.length > 0 && (
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {steps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                step.completed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <span className="text-xs text-gray-400 w-5">{idx + 1}.</span>
              
              <Checkbox
                checked={step.completed}
                onCheckedChange={() => toggleStep(step.id)}
                className="shrink-0"
              />
              
              {editable ? (
                <Input
                  value={step.title}
                  onChange={(e) => updateStepTitle(step.id, e.target.value)}
                  className={`flex-1 h-8 border-0 bg-transparent p-0 focus-visible:ring-0 ${
                    step.completed ? 'line-through text-gray-500' : ''
                  }`}
                />
              ) : (
                <span className={`flex-1 text-sm ${step.completed ? 'line-through text-gray-500' : ''}`}>
                  {step.title}
                </span>
              )}
              
              {editable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(step.id)}
                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {editable && (
        <div className="flex gap-2">
          <Input
            placeholder="Add a step..."
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStep()}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addStep}
            disabled={!newStepTitle.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}