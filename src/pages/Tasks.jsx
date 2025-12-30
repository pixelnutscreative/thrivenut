import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Check, X, Calendar, ChevronRight, ArrowRight, Trash2, Lightbulb, Filter, Zap, User, Camera, Sparkles, Loader2, RefreshCw, Tag, BookOpen, ListFilter } from 'lucide-react';
import { format, parseISO, isToday, isBefore, startOfDay } from 'date-fns';
import { useTheme } from '../components/shared/useTheme';
import CleaningTasks from './CleaningTasks';
import HabitConfigModal from '../components/brain-dump/HabitConfigModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const categoryOptions = [
  { value: 'Work', emoji: '💼' },
  { value: 'Personal', emoji: '🏠' },
  { value: 'Errands', emoji: '🏃' },
  { value: 'Calls', emoji: '📞' },
  { value: 'Email', emoji: '📧' },
  { value: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { value: 'Health', emoji: '❤️' },
  { value: 'Creative', emoji: '🎨' },
  { value: 'Project-Based', emoji: '📋' },
  { value: 'Other', emoji: '📝' }
];

export default function Tasks() {
  const queryClient = useQueryClient();
  const { isDark, bgClass, primaryColor, textClass, cardBgClass } = useTheme();
  const [newTask, setNewTask] = useState('');
  const [brainDumpText, setBrainDumpText] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [taskDetails, setTaskDetails] = useState({
    notes: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    priority: 'medium',
    category: 'Personal',
    assigned_to_family_id: null,
    requires_photo_proof: false
  });

  // AI Brain Dump State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [habitConfigOpen, setHabitConfigOpen] = useState(false);
  const [currentHabitItem, setCurrentHabitItem] = useState(null);

  const { user } = useTheme();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Task.filter({ created_by: user.email }, '-updated_date');
    },
    enabled: !!user?.email
  });

  const { data: brainDumps = [] } = useQuery({
    queryKey: ['brainDumps', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.BrainDump.filter({ is_processed: false, created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ['familyMembers', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.FamilyMember.filter({ is_active: true, created_by: user.email }, 'name');
    },
    enabled: !!user?.email
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTask('');
      setShowDetails(false);
      setTaskDetails({ 
        notes: '', 
        due_date: format(new Date(), 'yyyy-MM-dd'), 
        priority: 'medium', 
        category: 'Personal',
        assigned_to_family_id: null,
        requires_photo_proof: false
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const createBrainDumpMutation = useMutation({
    mutationFn: (text) => base44.entities.BrainDump.create({ content: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brainDumps'] });
      setBrainDumpText('');
    }
  });

  const convertToTaskMutation = useMutation({
    mutationFn: async ({ brainDump, taskData }) => {
      const task = await base44.entities.Task.create(taskData);
      await base44.entities.BrainDump.update(brainDump.id, { 
        is_processed: true, 
        converted_to_task_id: task.id 
      });
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['brainDumps'] });
    }
  });

  const deleteBrainDumpMutation = useMutation({
    mutationFn: (id) => base44.entities.BrainDump.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brainDumps'] })
  });

  const analyzeBrainDump = async (singleContent = null) => {
    const itemsToProcess = singleContent 
      ? [{ id: 'temp_new', content: singleContent }] 
      : brainDumps;
      
    if (itemsToProcess.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const dumpTexts = itemsToProcess.map(d => `- [ID:${d.id}] ${d.content}`).join('\n');
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert task manager. Your goal is to break down brain dumps into small, single, actionable units.

CRITICAL INSTRUCTIONS FOR SPLITTING:
1. Aggressively split long text into multiple separate items.
2. Split on keywords like "and", "also", "then", "plus" if they connect distinct tasks.
3. Split on commas, periods, and newlines if they separate distinct thoughts.
4. Turn run-on sentences into separate items.

Items to Analyze:
${dumpTexts}

Return a JSON object with a list of actionable items. Each item should have:
- original_id (extract from the ID tag)
- type (one of: 'task', 'goal', 'habit', 'note', 'event', 'resource')
- suggested_title (clear, actionable title)
- suggested_category (e.g. Work, Personal, Health, Reading List, Watch List)
- suggested_url (if a link is present)
- reasoning (brief why)

For habits, identify if there's any implied frequency.
For resources (books, movies, articles), suggest a category like 'Reading List', 'Watch List'.`,
        response_json_schema: {
          type: "object",
          properties: {
            analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  original_id: { type: "string" },
                  type: { type: "string" },
                  suggested_title: { type: "string" },
                  suggested_category: { type: "string" },
                  suggested_url: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      const resultsWithIds = (response.analysis || []).map(item => ({
        ...item,
        _ui_id: Math.random().toString(36).substr(2, 9),
      }));
      
      setAnalysisResults(resultsWithIds);
      setShowAnalysis(true);
      
      if (singleContent) {
        setBrainDumpText('');
      }
      
    } catch (err) {
      console.error(err);
      alert('Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processAnalysisItem = async (item, habitConfig = null) => {
    if (item.type === 'habit' && !habitConfig) {
      setCurrentHabitItem(item);
      setHabitConfigOpen(true);
      return;
    }

    try {
      if (item.type === 'task') {
        await base44.entities.Task.create({ title: item.suggested_title, category: item.suggested_category, status: 'pending', created_by: user.email });
      } else if (item.type === 'goal') {
        await base44.entities.Goal.create({ title: item.suggested_title, category: item.suggested_category, created_by: user.email });
      } else if (item.type === 'habit') {
        const habitData = habitConfig || { name: item.suggested_title, frequency: 'daily' };
        await base44.entities.Habit.create({ 
          name: habitData.name, 
          frequency: habitData.frequency,
          target_days: habitData.target_days || [],
          monthly_date: habitData.monthly_date,
          created_by: user.email 
        });
      } else if (item.type === 'event') {
        await base44.entities.ExternalEvent.create({ title: item.suggested_title, date: new Date().toISOString().split('T')[0], created_by: user.email });
      } else if (item.type === 'note') {
        await base44.entities.QuickNote.create({ content: item.suggested_title, created_by: user.email });
      } else if (item.type === 'resource') {
        await base44.entities.UserResource.create({
          user_email: user.email,
          title: item.suggested_title,
          category: item.suggested_category || 'General',
          categories: [item.suggested_category || 'General'],
          url: item.suggested_url || '',
          description: item.reasoning || 'Added from Brain Dump'
        });
      }
      
      const remainingResults = analysisResults.filter(r => r._ui_id !== item._ui_id);
      setAnalysisResults(remainingResults);

      if (item.original_id && item.original_id !== 'temp_new') {
        const othersPending = remainingResults.some(r => r.original_id === item.original_id);
        if (!othersPending) {
          await base44.entities.BrainDump.update(item.original_id, { is_processed: true });
          queryClient.invalidateQueries(['brainDumps']);
        }
      }
      
      if (habitConfig) {
        setHabitConfigOpen(false);
        setCurrentHabitItem(null);
      }
      
      // Also refresh tasks/goals etc
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    
    const assignedMember = familyMembers.find(m => m.id === taskDetails.assigned_to_family_id);
    
    createMutation.mutate({
      title: newTask,
      ...taskDetails,
      assigned_to_name: assignedMember?.name || null,
      status: 'pending'
    });
  };

  const handleComplete = (task) => {
    updateMutation.mutate({
      id: task.id,
      data: {
        status: 'completed',
        completed_date: format(new Date(), 'yyyy-MM-dd')
      }
    });
  };

  const handleCarryOver = (task) => {
    updateMutation.mutate({
      id: task.id,
      data: {
        due_date: format(new Date(), 'yyyy-MM-dd'),
        carried_over_from: task.due_date,
        carry_over_count: (task.carry_over_count || 0) + 1
      }
    });
  };

  const handleDefer = (task, days) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    
    updateMutation.mutate({
      id: task.id,
      data: {
        due_date: format(newDate, 'yyyy-MM-dd'),
        status: 'deferred'
      }
    });
  };

  const handleBrainDump = () => {
    if (!brainDumpText.trim()) return;
    createBrainDumpMutation.mutate(brainDumpText);
  };

  const handleConvertToTask = (brainDump) => {
    convertToTaskMutation.mutate({
      brainDump,
      taskData: {
        title: brainDump.content,
        status: 'pending',
        priority: 'medium',
        category: brainDump.category || 'Personal'
      }
    });
  };

  // Filter tasks
  let filteredTasks = tasks.filter(t => t.status === 'pending');
  if (selectedCategory !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.category === selectedCategory);
  }
  if (selectedPriority !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.priority === selectedPriority);
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').slice(0, 10);

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-green-100 text-green-700 border-green-300'
  };

  const TaskItem = ({ task, showDate = false }) => (
    <div className={`p-3 rounded-lg border ${cardBgClass} flex items-start gap-3 group`}>
      <Checkbox
        checked={task.status === 'completed'}
        onCheckedChange={() => handleComplete(task)}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : textClass}`}>
              {task.title}
            </p>
            {task.notes && (
              <p className="text-sm text-gray-500 mt-1">{task.notes}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {task.category && (
                <Badge variant="outline" className="text-xs">
                  <span className="mr-1">{categoryOptions.find(c => c.value === task.category)?.emoji || '📝'}</span>
                  {task.category}
                </Badge>
              )}
              <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                {task.priority}
              </Badge>
              {showDate && task.due_date && (
                <Badge variant="outline" className="text-xs">
                  {format(parseISO(task.due_date), 'MMM d')}
                </Badge>
              )}
              {task.carry_over_count > 0 && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  Carried {task.carry_over_count}x
                </Badge>
              )}
              {task.assigned_to_name && (
                <Badge variant="outline" className="text-xs text-purple-600 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {task.assigned_to_name}
                </Badge>
              )}
              {task.requires_photo_proof && (
                <Badge variant="outline" className="text-xs text-blue-600 flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  Photo Required
                </Badge>
              )}
            </div>
          </div>
          {task.status !== 'completed' && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCarryOver(task)}
                title="Carry to today"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDefer(task, 1)}
                title="Defer 1 day"
              >
                <Calendar className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteMutation.mutate(task.id)}
                className="text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className={`text-3xl font-bold ${textClass}`}>Tasks & Brain Dump</h1>
        </div>

        <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Sorting Suggestions</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {analysisResults.length === 0 ? (
                <p className="text-center text-gray-500 py-4">All sorted! 🎉</p>
              ) : (
                analysisResults.map((item, idx) => (
                  <Card key={idx} className="bg-gray-50">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        item.type === 'task' ? 'bg-blue-100 text-blue-600' :
                        item.type === 'goal' ? 'bg-purple-100 text-purple-600' :
                        item.type === 'habit' ? 'bg-green-100 text-green-600' :
                        item.type === 'resource' ? 'bg-orange-100 text-orange-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.type === 'task' ? <Check className="w-5 h-5" /> :
                         item.type === 'goal' ? <Tag className="w-5 h-5" /> :
                         item.type === 'habit' ? <RefreshCw className="w-5 h-5" /> :
                         item.type === 'resource' ? <BookOpen className="w-5 h-5" /> :
                         <ListFilter className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold capitalize">{item.type}</span>
                          <span className="text-sm bg-white px-2 rounded border">{item.suggested_category}</span>
                        </div>
                        <Input 
                          value={item.suggested_title} 
                          onChange={(e) => {
                            const newResults = [...analysisResults];
                            newResults[idx].suggested_title = e.target.value;
                            setAnalysisResults(newResults);
                          }}
                          className="font-medium text-gray-900 mb-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">{item.reasoning}</p>
                      </div>
                      <div className="flex gap-2">
                        <Select 
                          value={item.type} 
                          onValueChange={(val) => {
                            const newResults = [...analysisResults];
                            newResults[idx].type = val;
                            setAnalysisResults(newResults);
                          }}
                        >
                          <SelectTrigger className="h-8 w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="task">Task</SelectItem>
                            <SelectItem value="goal">Goal</SelectItem>
                            <SelectItem value="habit">Habit</SelectItem>
                            <SelectItem value="resource">Resource (My Stuff)</SelectItem>
                            <SelectItem value="note">Note</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm" 
                          onClick={() => processAnalysisItem(item)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3"
                          title="Confirm & Create"
                        >
                          <Check className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        <HabitConfigModal 
          open={habitConfigOpen} 
          onOpenChange={setHabitConfigOpen}
          initialData={currentHabitItem}
          onConfirm={(config) => processAnalysisItem(currentHabitItem, config)}
        />

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">My Tasks ({filteredTasks.length})</TabsTrigger>
            <TabsTrigger value="cleaning">Household</TabsTrigger>
            <TabsTrigger value="braindump">Brain Dump ({brainDumps.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="cleaning" className="space-y-4">
            <CleaningTasks embedded />
          </TabsContent>

          <TabsContent value="braindump" className="space-y-4">
            {/* Brain Dump Section */}
            <Card className={cardBgClass}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" style={{ color: primaryColor }} />
                  Quick Capture - Brain Dump
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500">
                  Dump everything on your mind here. No structure needed. Organize later.
                </p>
                <div className="flex gap-2 items-start">
                  <Textarea
                    value={brainDumpText}
                    onChange={(e) => setBrainDumpText(e.target.value)}
                    placeholder="Type anything that comes to mind... ideas, todos, random thoughts..."
                    className="flex-1"
                    rows={3}
                  />
                  <div className="flex flex-col gap-2">
                    <Button onClick={handleBrainDump} style={{ backgroundColor: primaryColor }} disabled={!brainDumpText.trim()}>
                      <Zap className="w-4 h-4 mr-2" />
                      Capture Only
                    </Button>
                    <Button 
                      onClick={() => analyzeBrainDump(brainDumpText)} 
                      disabled={!brainDumpText.trim() || isAnalyzing}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                    >
                      {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      AI Process
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Brain Dump Items */}
            <div className="flex justify-between items-center pt-4">
              <h3 className="font-semibold text-gray-500 uppercase text-xs tracking-wider">Saved Items ({brainDumps.length})</h3>
              <Button 
                onClick={() => analyzeBrainDump(null)} 
                disabled={isAnalyzing || brainDumps.length === 0}
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Organize All Saved
              </Button>
            </div>

            {brainDumps.length === 0 ? (
              <Card className={cardBgClass}>
                <CardContent className="py-12 text-center text-gray-500">
                  Your brain dump is empty. Start capturing ideas!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {brainDumps.map(dump => (
                  <Card key={dump.id} className={cardBgClass}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className={textClass}>{dump.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(dump.created_date), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleConvertToTask(dump)}
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Make Task
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteBrainDumpMutation.mutate(dump.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="mr-2">{cat.emoji}</span>
                      {cat.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              {(selectedCategory !== 'all' || selectedPriority !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedPriority('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Add Task */}
            <Card className={cardBgClass}>
              <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  placeholder="What needs to be done?"
                  className="flex-1"
                />
                <Button onClick={() => setShowDetails(!showDetails)} variant="outline">
                  <Calendar className="w-4 h-4" />
                </Button>
                <Button onClick={handleAddTask} style={{ backgroundColor: primaryColor }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {showDetails && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <Select value={taskDetails.priority} onValueChange={(v) => setTaskDetails({...taskDetails, priority: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={taskDetails.category} onValueChange={(v) => setTaskDetails({...taskDetails, category: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="mr-2">{cat.emoji}</span>
                          {cat.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={taskDetails.due_date}
                    onChange={(e) => setTaskDetails({...taskDetails, due_date: e.target.value})}
                  />

                  <Select 
                    value={taskDetails.assigned_to_family_id || 'none'} 
                    onValueChange={(v) => setTaskDetails({...taskDetails, assigned_to_family_id: v === 'none' ? null : v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Me (No Assignment)</SelectItem>
                      {familyMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.nickname || member.name} {member.is_child_account ? ' (Kid)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="col-span-2 flex items-center gap-2">
                    <Checkbox
                      checked={taskDetails.requires_photo_proof}
                      onCheckedChange={(checked) => setTaskDetails({...taskDetails, requires_photo_proof: checked})}
                    />
                    <label className="text-sm cursor-pointer" onClick={() => setTaskDetails({...taskDetails, requires_photo_proof: !taskDetails.requires_photo_proof})}>
                      Require photo proof when completed
                    </label>
                  </div>

                  <Textarea
                    value={taskDetails.notes}
                    onChange={(e) => setTaskDetails({...taskDetails, notes: e.target.value})}
                    placeholder="Notes..."
                    className="col-span-2"
                    rows={2}
                  />
                </div>
              )}
            </div>
              </CardContent>
            </Card>

            {/* All Tasks */}
            <Card className={cardBgClass}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: primaryColor }}>
                  <Check className="w-5 h-5" />
                  Tasks ({filteredTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    {selectedCategory === 'all' && selectedPriority === 'all' 
                      ? 'No tasks yet. Add one above!'
                      : 'No tasks match your filters'}
                  </p>
                ) : (
                  filteredTasks.map(task => (
                    <TaskItem key={task.id} task={task} showDate />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recently Completed - moved here to be inside the tasks tab */}
            {completedTasks.length > 0 && (
              <Card className={cardBgClass}>
                <CardHeader>
                  <CardTitle className="text-green-600 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Recently Completed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completedTasks.map(task => (
                    <TaskItem key={task.id} task={task} showDate />
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}