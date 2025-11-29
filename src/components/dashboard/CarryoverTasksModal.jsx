import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, SkipForward, ArrowRight, Check, Clock, Trash2 } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CarryoverTasksModal({ isOpen, onClose, carryoverTasks = [], userEmail }) {
  const queryClient = useQueryClient();
  const [selectedActions, setSelectedActions] = React.useState({});

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, action, rescheduleDate }) => {
      const updates = {
        status: action === 'skip' ? 'skipped' : action === 'complete' ? 'completed' : 'rescheduled',
        action_taken_at: new Date().toISOString(),
      };
      if (rescheduleDate) {
        updates.rescheduled_to = rescheduleDate;
      }
      return await base44.entities.CarryoverTask.update(taskId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carryoverTasks'] });
    },
  });

  const handleAction = (task, action, rescheduleOption) => {
    let rescheduleDate = null;
    const today = new Date();
    
    if (action === 'reschedule') {
      switch (rescheduleOption) {
        case 'tomorrow':
          rescheduleDate = format(addDays(today, 1), 'yyyy-MM-dd');
          break;
        case 'next_week':
          rescheduleDate = format(addWeeks(today, 1), 'yyyy-MM-dd');
          break;
        case 'next_month':
          rescheduleDate = format(addMonths(today, 1), 'yyyy-MM-dd');
          break;
        default:
          rescheduleDate = rescheduleOption; // Custom date
      }
    }
    
    updateTaskMutation.mutate({ taskId: task.id, action, rescheduleDate });
  };

  const pendingTasks = carryoverTasks.filter(t => t.status === 'pending');

  if (pendingTasks.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Incomplete Tasks
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <p className="text-sm text-gray-600">
            You have {pendingTasks.length} task(s) from previous days. What would you like to do with them?
          </p>

          {pendingTasks.map((task) => (
            <div key={task.id} className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-800">{task.task_label}</p>
                  <p className="text-xs text-gray-500">
                    Originally scheduled: {format(new Date(task.original_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  {task.task_type}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(task, 'complete')}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Done
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(task, 'skip')}
                  className="text-gray-600"
                >
                  <SkipForward className="w-3 h-3 mr-1" />
                  Skip
                </Button>

                <Select
                  value={selectedActions[task.id] || ''}
                  onValueChange={(value) => {
                    setSelectedActions({ ...selectedActions, [task.id]: value });
                    handleAction(task, 'reschedule', value);
                  }}
                >
                  <SelectTrigger className="w-auto h-8 text-xs">
                    <ArrowRight className="w-3 h-3 mr-1" />
                    <span>Reschedule</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="next_week">Next Week</SelectItem>
                    <SelectItem value="next_month">Next Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Deal with later
          </Button>
          <Button 
            onClick={() => {
              pendingTasks.forEach(task => handleAction(task, 'skip'));
              onClose();
            }}
            className="bg-gray-500 hover:bg-gray-600"
          >
            Skip All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}