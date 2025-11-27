import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, Edit, Trash2, CheckCircle2, ChevronDown, ChevronRight, Share2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import AIStepsGenerator from '../components/goals/AIStepsGenerator';
import GoalStepsList from '../components/goals/GoalStepsList';
import GoalShareSelector from '../components/goals/GoalShareSelector';

const categoryColors = {
  spiritual: 'bg-purple-100 text-purple-800',
  health: 'bg-green-100 text-green-800',
  personal: 'bg-blue-100 text-blue-800',
  financial: 'bg-yellow-100 text-yellow-800',
  relationship: 'bg-pink-100 text-pink-800',
  learning: 'bg-orange-100 text-orange-800',
  career: 'bg-indigo-100 text-indigo-800',
  creative: 'bg-teal-100 text-teal-800',
  other: 'bg-gray-100 text-gray-800'
};

const goalTypes = [
  { id: 'habit', label: '🔄 Habit', description: 'Recurring goal (daily water, weekly exercise)' },
  { id: 'project', label: '📋 Project', description: 'One-time goal with steps (buy a car, move)' },
  { id: 'milestone', label: '🎯 Milestone', description: 'Single achievement (get promoted, graduate)' },
  { id: 'learning', label: '📚 Learning', description: 'Skill or knowledge acquisition' },
  { id: 'preparation', label: '🧘 Preparation', description: 'Getting ready for something (relationship, interview)' }
];

export default function Goals() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    goal_type: 'project',
    frequency: 'one-time',
    target_value: 0,
    current_value: 0,
    steps: [],
    target_date: '',
    shared_with: [],
    start_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [expandedGoals, setExpandedGoals] = useState({});

  // Fetch accepted goal sharing connections
  const { data: sharingConnections = [] } = useQuery({
    queryKey: ['goalSharesSent', user?.email],
    queryFn: () => base44.entities.GoalShare.filter({ sharer_email: user.email, status: 'accepted' }),
    enabled: !!user,
  });

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: goals } = useQuery({
    queryKey: ['goals', user?.email],
    queryFn: async () => {
      return await base44.entities.Goal.filter({ status: 'active', created_by: user.email }, '-created_date');
    },
    enabled: !!user,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goalData) => {
      if (editingGoal) {
        return await base44.entities.Goal.update(editingGoal.id, goalData);
      } else {
        return await base44.entities.Goal.create({...goalData, status: 'active'});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      resetForm();
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ goalId, newValue }) => {
      return await base44.entities.Goal.update(goalId, { current_value: newValue });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId) => {
      return await base44.entities.Goal.update(goalId, { status: 'archived' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const completeGoalMutation = useMutation({
    mutationFn: async (goalId) => {
      return await base44.entities.Goal.update(goalId, { 
        status: 'completed',
        end_date: format(new Date(), 'yyyy-MM-dd')
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'personal',
      goal_type: 'project',
      frequency: 'one-time',
      target_value: 0,
      current_value: 0,
      steps: [],
      target_date: '',
      shared_with: [],
      start_date: format(new Date(), 'yyyy-MM-dd')
    });
    setEditingGoal(null);
    setShowForm(false);
  };

  const toggleGoalExpand = (goalId) => {
    setExpandedGoals(prev => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  const updateStepsMutation = useMutation({
    mutationFn: async ({ goalId, steps }) => {
      return await base44.entities.Goal.update(goalId, { steps });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      goal_type: goal.goal_type || 'project',
      frequency: goal.frequency || 'one-time',
      target_value: goal.target_value || 0,
      current_value: goal.current_value || 0,
      steps: goal.steps || [],
      target_date: goal.target_date || '',
      shared_with: goal.shared_with || [],
      start_date: goal.start_date || format(new Date(), 'yyyy-MM-dd')
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    createGoalMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <Target className="w-10 h-10 text-purple-600" />
              My Goals
            </h1>
            <p className="text-gray-600">Track your personal goals and progress</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="bg-purple-600 hover:bg-purple-700 h-12"
          >
            <Plus className="w-5 h-5 mr-2" />
            {showForm ? 'Cancel' : 'New Goal'}
          </Button>
        </motion.div>

        {/* Inline Goal Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-2 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{editingGoal ? 'Edit Goal' : 'Create New Goal'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Goal Title *</label>
                      <Input
                        placeholder="What do you want to achieve?"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spiritual">🙏 Spiritual</SelectItem>
                          <SelectItem value="health">💪 Health</SelectItem>
                          <SelectItem value="personal">🎯 Personal</SelectItem>
                          <SelectItem value="financial">💰 Financial</SelectItem>
                          <SelectItem value="relationship">❤️ Relationship</SelectItem>
                          <SelectItem value="learning">📚 Learning</SelectItem>
                          <SelectItem value="career">💼 Career</SelectItem>
                          <SelectItem value="creative">🎨 Creative</SelectItem>
                          <SelectItem value="other">✨ Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Textarea
                      placeholder="Add more details about your goal..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={2}
                    />
                  </div>

                  {/* Goal Type Selection - Horizontal */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Goal Type</label>
                    <div className="flex flex-wrap gap-2">
                      {goalTypes.map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({
                            ...formData, 
                            goal_type: type.id,
                            frequency: type.id === 'habit' ? 'daily' : 'one-time',
                            target_value: type.id === 'habit' ? 1 : 0
                          })}
                          className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                            formData.goal_type === type.id
                              ? 'border-purple-500 bg-purple-50 font-medium'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Date</label>
                      <Input
                        type="date"
                        value={formData.target_date}
                        onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                      />
                    </div>
                    
                    {formData.goal_type === 'habit' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Frequency</label>
                          <Select value={formData.frequency} onValueChange={(val) => setFormData({...formData, frequency: val})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Target Value</label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.target_value}
                            onChange={(e) => setFormData({...formData, target_value: parseInt(e.target.value) || 1})}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Steps Section */}
                  <div className="space-y-3 pt-4 border-t">
                    <label className="text-sm font-medium">Steps / Mini-Goals</label>
                    
                    <AIStepsGenerator
                      goalTitle={formData.title}
                      goalDescription={formData.description}
                      goalType={formData.goal_type}
                      existingSteps={formData.steps}
                      onStepsGenerated={(steps) => setFormData({...formData, steps})}
                    />
                    
                    {formData.steps.length > 0 && (
                      <GoalStepsList
                        steps={formData.steps}
                        onChange={(steps) => setFormData({...formData, steps})}
                        editable={true}
                      />
                    )}
                  </div>

                  {/* Share with specific people */}
                  {sharingConnections.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share this goal with
                      </label>
                      <GoalShareSelector
                        connections={sharingConnections}
                        selectedEmails={formData.shared_with}
                        onChange={(emails) => setFormData({...formData, shared_with: emails})}
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={!formData.title.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {editingGoal ? 'Update Goal' : 'Create Goal'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goals Grid */}
        {goals && goals.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, index) => {
              const percentage = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;
              const hasSteps = goal.steps && goal.steps.length > 0;
              const stepsCompleted = hasSteps ? goal.steps.filter(s => s.completed).length : 0;
              const stepsPercent = hasSteps ? (stepsCompleted / goal.steps.length) * 100 : 0;
              const isExpanded = expandedGoals[goal.id];
              
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-all h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`${categoryColors[goal.category]} border-0`}>
                          {goal.category}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(goal)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteGoalMutation.mutate(goal.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-xl">{goal.title}</CardTitle>
                      {goal.description && (
                        <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Steps Section */}
                      {hasSteps && (
                        <div className="space-y-2">
                          <button
                            onClick={() => toggleGoalExpand(goal.id)}
                            className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-800"
                          >
                            <span className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              {stepsCompleted}/{goal.steps.length} steps
                            </span>
                            <span className="text-xs">{Math.round(stepsPercent)}%</span>
                          </button>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                              style={{ width: `${stepsPercent}%` }}
                            />
                          </div>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <GoalStepsList
                                  steps={goal.steps}
                                  onChange={(newSteps) => updateStepsMutation.mutate({ goalId: goal.id, steps: newSteps })}
                                  editable={false}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Progress for target-based goals */}
                      {goal.target_value > 0 && (
                        <>
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-semibold">
                                {goal.current_value} / {goal.target_value}
                              </span>
                            </div>
                            <Progress value={percentage} className="h-3" />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateProgressMutation.mutate({ 
                                goalId: goal.id, 
                                newValue: Math.max(0, goal.current_value - 1) 
                              })}
                              disabled={goal.current_value === 0}
                              className="flex-1"
                            >
                              -1
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateProgressMutation.mutate({ 
                                goalId: goal.id, 
                                newValue: Math.min(goal.target_value, goal.current_value + 1) 
                              })}
                              disabled={goal.current_value >= goal.target_value}
                              className="flex-1 bg-purple-600 hover:bg-purple-700"
                            >
                              +1
                            </Button>
                          </div>
                        </>
                      )}

                      {(percentage >= 100 || (hasSteps && stepsPercent >= 100)) && (
                        <Button
                          size="sm"
                          onClick={() => completeGoalMutation.mutate(goal.id)}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}

                      <div className="text-xs text-gray-500 flex justify-between pt-2 border-t">
                        <span>{goal.frequency}</span>
                        {goal.start_date && (
                          <span>Started {format(new Date(goal.start_date), 'MMM d')}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-12 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg mb-2">No goals yet</p>
              <p className="text-gray-400 mb-6">Start by creating your first goal</p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Goal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}