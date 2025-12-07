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
import { Plus, Check, X, Calendar, ChevronRight, ArrowRight, Trash2 } from 'lucide-react';
import { format, parseISO, isToday, isBefore, startOfDay } from 'date-fns';
import { useTheme } from '../components/shared/useTheme';

const categoryOptions = ['Work', 'Personal', 'Errands', 'Calls', 'Email', 'Family', 'Health', 'Creative', 'Other'];

export default function Tasks() {
  const queryClient = useQueryClient();
  const { isDark, bgClass, primaryColor, textClass, cardBgClass } = useTheme();
  const [newTask, setNewTask] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [taskDetails, setTaskDetails] = useState({
    notes: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    priority: 'medium',
    category: 'Personal'
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-updated_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTask('');
      setShowDetails(false);
      setTaskDetails({ notes: '', due_date: format(new Date(), 'yyyy-MM-dd'), priority: 'medium', category: 'Personal' });
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

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    
    createMutation.mutate({
      title: newTask,
      ...taskDetails,
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

  // Group tasks
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const todayTasks = pendingTasks.filter(t => t.due_date && isToday(parseISO(t.due_date)));
  const overdueTasks = pendingTasks.filter(t => t.due_date && isBefore(parseISO(t.due_date), startOfDay(new Date())) && !isToday(parseISO(t.due_date)));
  const upcomingTasks = pendingTasks.filter(t => !t.due_date || (!isToday(parseISO(t.due_date)) && !isBefore(parseISO(t.due_date), startOfDay(new Date()))));
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
                <Badge variant="outline" className="text-xs">{task.category}</Badge>
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
          <h1 className={`text-3xl font-bold ${textClass}`}>My Tasks</h1>
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
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={taskDetails.due_date}
                    onChange={(e) => setTaskDetails({...taskDetails, due_date: e.target.value})}
                  />

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

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <Card className={`${cardBgClass} border-red-300`}>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <X className="w-5 h-5" />
                Overdue ({overdueTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueTasks.map(task => (
                <TaskItem key={task.id} task={task} showDate />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Today's Tasks */}
        <Card className={cardBgClass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: primaryColor }}>
              <Check className="w-5 h-5" />
              Today ({todayTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tasks for today</p>
            ) : (
              todayTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className={cardBgClass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChevronRight className="w-5 h-5" />
              Upcoming ({upcomingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingTasks.map(task => (
              <TaskItem key={task.id} task={task} showDate />
            ))}
          </CardContent>
        </Card>

        {/* Recently Completed */}
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
      </div>
    </div>
  );
}