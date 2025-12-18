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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Sparkles, Clock, Users, Calendar, Trash2, SkipForward, Check, AlertCircle } from 'lucide-react';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { useTheme } from '../components/shared/useTheme';

export default function CleaningTasks({ embedded = false }) {
  const queryClient = useQueryClient();
  const { isDark, bgClass, primaryColor, textClass, cardBgClass } = useTheme();
  const [showDialog, setShowDialog] = useState(false);

  const [formData, setFormData] = useState({
    task_name: '',
    room: 'kitchen',
    description: '',
    estimated_minutes: 15,
    frequency: 'weekly',
    assigned_to: [],
    preferred_day: 'any',
    grace_period_days: 3,
    is_recurring: true,
    is_active: true
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['cleaningTasks'],
    queryFn: () => base44.entities.CleaningTask.list('room'),
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ['familyMembers'],
    queryFn: () => base44.entities.FamilyMember.filter({ is_active: true }, 'name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CleaningTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaningTasks'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CleaningTask.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cleaningTasks'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CleaningTask.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cleaningTasks'] })
  });

  const resetForm = () => {
    setFormData({
      task_name: '',
      room: 'kitchen',
      description: '',
      estimated_minutes: 15,
      frequency: 'weekly',
      assigned_to: [],
      preferred_day: 'any',
      grace_period_days: 3,
      is_recurring: true,
      is_active: true
    });
    setShowDialog(false);
  };

  const handleComplete = (task) => {
    updateMutation.mutate({
      id: task.id,
      data: {
        last_completed: format(new Date(), 'yyyy-MM-dd'),
        skipped_count: 0
      }
    });
  };

  const handleSkip = (task) => {
    const newSkipCount = (task.skipped_count || 0) + 1;
    const gracePeriod = task.grace_period_days || 3;
    
    // If skipped too many times, auto-push to next occurrence
    if (newSkipCount >= gracePeriod) {
      const nextDate = getNextOccurrence(task);
      updateMutation.mutate({
        id: task.id,
        data: {
          last_completed: nextDate,
          skipped_count: 0
        }
      });
    } else {
      updateMutation.mutate({
        id: task.id,
        data: {
          skipped_count: newSkipCount
        }
      });
    }
  };

  const getNextOccurrence = (task) => {
    const today = new Date();
    const daysToAdd = 
      task.frequency === 'daily' ? 1 :
      task.frequency === 'weekly' ? 7 :
      task.frequency === 'biweekly' ? 14 :
      30;
    return format(addDays(today, daysToAdd), 'yyyy-MM-dd');
  };

  const isDue = (task) => {
    if (!task.last_completed) return true;
    const lastDate = parseISO(task.last_completed);
    const today = new Date();
    const daysSince = differenceInDays(today, lastDate);
    
    const threshold = 
      task.frequency === 'daily' ? 1 :
      task.frequency === 'weekly' ? 7 :
      task.frequency === 'biweekly' ? 14 :
      30;
    
    return daysSince >= threshold;
  };

  const dueTasks = tasks.filter(t => t.is_active && isDue(t));
  const upcomingTasks = tasks.filter(t => t.is_active && !isDue(t));

  const roomEmojis = {
    kitchen: '🍳',
    bathroom: '🚿',
    bedroom: '🛏️',
    living_room: '🛋️',
    dining_room: '🍽️',
    laundry: '🧺',
    garage: '🚗',
    yard: '🌳',
    other: '🏠'
  };

  if (embedded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-700">Task List</div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm" style={{ backgroundColor: primaryColor }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Cleaning Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Task Name"
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={formData.room} onValueChange={(v) => setFormData({ ...formData, room: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kitchen">🍳 Kitchen</SelectItem>
                      <SelectItem value="bathroom">🚿 Bathroom</SelectItem>
                      <SelectItem value="bedroom">🛏️ Bedroom</SelectItem>
                      <SelectItem value="living_room">🛋️ Living Room</SelectItem>
                      <SelectItem value="dining_room">🍽️ Dining Room</SelectItem>
                      <SelectItem value="laundry">🧺 Laundry</SelectItem>
                      <SelectItem value="garage">🚗 Garage</SelectItem>
                      <SelectItem value="yard">🌳 Yard</SelectItem>
                      <SelectItem value="other">🏠 Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Minutes"
                    value={formData.estimated_minutes}
                    onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value) })}
                  />
                </div>
                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={formData.preferred_day} onValueChange={(v) => setFormData({ ...formData, preferred_day: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Day</SelectItem>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Assignment */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Assign To</label>
                  <Select 
                    value={formData.assigned_to?.[0] || 'anyone'} 
                    onValueChange={(v) => setFormData({ ...formData, assigned_to: v === 'anyone' ? [] : [v] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Anyone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anyone">Anyone</SelectItem>
                      {familyMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Grace Period (days before auto-skip)</label>
                  <Input
                    type="number"
                    value={formData.grace_period_days}
                    onChange={(e) => setFormData({ ...formData, grace_period_days: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-gray-500 mt-1">ADHD-friendly: Skip this many times before auto-moving to next cycle</p>
                </div>
                <Button onClick={() => createMutation.mutate(formData)} className="w-full" style={{ backgroundColor: primaryColor }}>
                  Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Due Tasks */}
        <Card className={cardBgClass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: primaryColor }}>
              <Sparkles className="w-5 h-5" />
              Due Now ({dueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dueTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">All caught up! 🎉</p>
            ) : (
              dueTasks.map(task => (
                <div key={task.id} className="p-3 rounded-lg border flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{roomEmojis[task.room]}</span>
                      <div>
                        <h4 className="font-semibold">{task.task_name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{task.room.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {task.estimated_minutes} min
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {task.frequency}
                      </Badge>
                      {task.assigned_to && task.assigned_to.length > 0 && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          <Users className="w-3 h-3 mr-1" />
                          {familyMembers.find(m => m.id === task.assigned_to[0])?.name || 'Assigned'}
                        </Badge>
                      )}
                      {task.skipped_count > 0 && (
                        <Badge className="text-xs bg-orange-100 text-orange-700">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Skipped {task.skipped_count}x
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleComplete(task)} style={{ backgroundColor: primaryColor }}>
                      <Check className="w-4 h-4 mr-1" />
                      Done
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSkip(task)}>
                      <SkipForward className="w-4 h-4 mr-1" />
                      Skip
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <Card className={cardBgClass}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                Coming Up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingTasks.map(task => (
                <div key={task.id} className="p-3 rounded-lg border flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{roomEmojis[task.room]}</span>
                    <div>
                      <h4 className="font-medium">{task.task_name}</h4>
                      {task.last_completed && (
                        <p className="text-xs text-gray-500">
                          Last done {format(parseISO(task.last_completed), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(task.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${textClass}`}>Cleaning Tasks</h1>
            <p className="text-gray-500 mt-1">ADHD-friendly task rotation with grace periods</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: primaryColor }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Cleaning Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Task Name"
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={formData.room} onValueChange={(v) => setFormData({ ...formData, room: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kitchen">🍳 Kitchen</SelectItem>
                      <SelectItem value="bathroom">🚿 Bathroom</SelectItem>
                      <SelectItem value="bedroom">🛏️ Bedroom</SelectItem>
                      <SelectItem value="living_room">🛋️ Living Room</SelectItem>
                      <SelectItem value="dining_room">🍽️ Dining Room</SelectItem>
                      <SelectItem value="laundry">🧺 Laundry</SelectItem>
                      <SelectItem value="garage">🚗 Garage</SelectItem>
                      <SelectItem value="yard">🌳 Yard</SelectItem>
                      <SelectItem value="other">🏠 Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Minutes"
                    value={formData.estimated_minutes}
                    onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value) })}
                  />
                </div>
                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={formData.preferred_day} onValueChange={(v) => setFormData({ ...formData, preferred_day: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Day</SelectItem>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Assignment */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Assign To</label>
                  <Select 
                    value={formData.assigned_to?.[0] || 'anyone'} 
                    onValueChange={(v) => setFormData({ ...formData, assigned_to: v === 'anyone' ? [] : [v] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Anyone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anyone">Anyone</SelectItem>
                      {familyMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Grace Period (days before auto-skip)</label>
                  <Input
                    type="number"
                    value={formData.grace_period_days}
                    onChange={(e) => setFormData({ ...formData, grace_period_days: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-gray-500 mt-1">ADHD-friendly: Skip this many times before auto-moving to next cycle</p>
                </div>
                <Button onClick={() => createMutation.mutate(formData)} className="w-full" style={{ backgroundColor: primaryColor }}>
                  Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Due Tasks */}
        <Card className={cardBgClass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: primaryColor }}>
              <Sparkles className="w-5 h-5" />
              Due Now ({dueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dueTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">All caught up! 🎉</p>
            ) : (
              dueTasks.map(task => (
                <div key={task.id} className="p-3 rounded-lg border flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{roomEmojis[task.room]}</span>
                      <div>
                        <h4 className="font-semibold">{task.task_name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{task.room.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {task.estimated_minutes} min
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {task.frequency}
                      </Badge>
                      {task.assigned_to && task.assigned_to.length > 0 && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          <Users className="w-3 h-3 mr-1" />
                          {familyMembers.find(m => m.id === task.assigned_to[0])?.name || 'Assigned'}
                        </Badge>
                      )}
                      {task.skipped_count > 0 && (
                        <Badge className="text-xs bg-orange-100 text-orange-700">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Skipped {task.skipped_count}x
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleComplete(task)} style={{ backgroundColor: primaryColor }}>
                      <Check className="w-4 h-4 mr-1" />
                      Done
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSkip(task)}>
                      <SkipForward className="w-4 h-4 mr-1" />
                      Skip
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <Card className={cardBgClass}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                Coming Up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingTasks.map(task => (
                <div key={task.id} className="p-3 rounded-lg border flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{roomEmojis[task.room]}</span>
                    <div>
                      <h4 className="font-medium">{task.task_name}</h4>
                      {task.last_completed && (
                        <p className="text-xs text-gray-500">
                          Last done {format(parseISO(task.last_completed), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(task.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}