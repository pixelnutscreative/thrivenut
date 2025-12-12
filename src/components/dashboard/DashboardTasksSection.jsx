import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle, Circle, Clock, AlertTriangle, ChevronDown, ChevronUp, 
  FileText, ExternalLink, Calendar, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format, parseISO, isToday, isPast } from 'date-fns';

export default function DashboardTasksSection({ userEmail, viewMode = 'detailed', urgentTasks = [] }) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(viewMode === 'detailed');
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: tasks = [] } = useQuery({
    queryKey: ['pendingTasks', userEmail],
    queryFn: () => base44.entities.Task.filter({ 
      status: 'pending',
      created_by: userEmail 
    }),
    enabled: !!userEmail,
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      return await base44.entities.Task.update(taskId, {
        status: 'completed',
        completed_date: today
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingTasks'] });
    },
  });

  // Filter today's tasks
  const todaysTasks = useMemo(() => {
    return tasks.filter(task => task.due_date === today);
  }, [tasks, today]);

  // Get urgent tasks (is_urgent flag OR has due_time that's passed/upcoming)
  const urgentTasksList = useMemo(() => {
    const now = new Date();
    const currentTime = format(now, 'HH:mm');

    return tasks.filter(task => {
      // Marked as urgent
      if (task.is_urgent) return true;

      // Has specific time today and it's within 2 hours or past
      if (task.due_date === today && task.due_time) {
        const [taskHour, taskMin] = task.due_time.split(':').map(Number);
        const [nowHour, nowMin] = currentTime.split(':').map(Number);
        const taskMinutes = taskHour * 60 + taskMin;
        const nowMinutes = nowHour * 60 + nowMin;
        const diff = taskMinutes - nowMinutes;
        
        return diff <= 120 && diff >= -30; // Within 2 hours or up to 30 min past
      }

      return false;
    });
  }, [tasks, today]);

  if (tasks.length === 0) return null;

  if (viewMode === 'compact') {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between"
          >
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              Tasks ({tasks.filter(t => t.status === 'pending').length})
            </CardTitle>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </CardHeader>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent className="space-y-2">
                {todaysTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-blue-300 transition-all"
                  >
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={() => completeTaskMutation.mutate(task.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">{task.title}</p>
                      {task.due_time && (
                        <p className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {task.due_time}
                        </p>
                      )}
                    </div>
                    {task.is_urgent && (
                      <Badge className="bg-red-500 text-white text-xs">Urgent</Badge>
                    )}
                  </div>
                ))}
                <Link to={createPageUrl('Tasks')}>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    View All Tasks
                  </Button>
                </Link>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  }

  // Detailed view
  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Tasks ({tasks.filter(t => t.status === 'pending').length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Link to={createPageUrl('Tasks')} onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="h-8">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Task
                  </Button>
                </Link>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-2">
            {todaysTasks.map((task) => {
              const isOverdue = task.due_time && task.due_time < format(new Date(), 'HH:mm');

              return (
                <div
                  key={task.id}
                  className={`p-3 bg-white rounded-lg border-2 transition-all ${
                    task.is_urgent || isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={() => completeTaskMutation.mutate(task.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-800">{task.title}</p>
                        {task.is_urgent && (
                          <Badge className="bg-red-500 text-white text-xs">Urgent</Badge>
                        )}
                        {task.priority === 'high' && !task.is_urgent && (
                          <Badge variant="outline" className="text-xs">High Priority</Badge>
                        )}
                      </div>
                      {task.notes && (
                        <p className="text-sm text-gray-600 mb-2">{task.notes}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {task.due_time && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                            <Clock className="w-3 h-3" />
                            {task.due_time}
                            {isOverdue && ' (Overdue)'}
                          </span>
                        )}
                        {task.category && (
                          <Badge variant="outline" className="text-xs">{task.category}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {todaysTasks.length === 0 && (
              <p className="text-center text-gray-400 py-4 text-sm">
                No tasks due today - you're all caught up!
              </p>
            )}
            <Link to={createPageUrl('Tasks')}>
              <Button variant="outline" size="sm" className="w-full mt-2">
                <ExternalLink className="w-3 h-3 mr-2" />
                Manage All Tasks
              </Button>
            </Link>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </>
  );
}