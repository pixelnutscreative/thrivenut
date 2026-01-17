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
  CheckCircle, Circle, Clock, AlertTriangle, ChevronDown, ChevronUp, ChevronRight,
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
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
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

  // Filter today's tasks - exclude timed ones as they are in MyDay
  const todaysTasks = useMemo(() => {
    return tasks.filter(task => task.due_date === today && !task.due_time);
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

  // Clean style view (default now)
  return (
    <Card className="shadow-sm border border-gray-100 bg-white">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <div className="w-6 h-6 rounded-md border-2 border-cyan-500 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-cyan-500" />
            </div>
            Today's Tasks
          </CardTitle>
          <Link to={createPageUrl('Tasks')}>
            <Button variant="ghost" size="sm" className="h-8 text-gray-400 hover:text-gray-600">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          {todaysTasks.slice(0, 5).map(task => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <Checkbox
                checked={task.status === 'completed'}
                onCheckedChange={() => completeTaskMutation.mutate(task.id)}
                className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
              />
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {task.title}
                </p>
              </div>
              {task.is_urgent && (
                <Badge className="bg-red-500 text-white text-xs h-5 px-2">Urgent</Badge>
              )}
            </div>
          ))}
          {todaysTasks.length === 0 && (
            <p className="text-center text-gray-400 py-4 text-sm">
              No tasks due today!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
        }