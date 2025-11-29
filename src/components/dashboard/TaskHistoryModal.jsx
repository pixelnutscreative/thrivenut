import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, X, SkipForward, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function TaskHistoryModal({ isOpen, onClose, userEmail }) {
  const [selectedDate, setSelectedDate] = useState(subDays(new Date(), 1));

  const { data: selfCareLog } = useQuery({
    queryKey: ['selfCareHistory', format(selectedDate, 'yyyy-MM-dd'), userEmail],
    queryFn: async () => {
      const logs = await base44.entities.DailySelfCareLog.filter({ 
        date: format(selectedDate, 'yyyy-MM-dd'),
        created_by: userEmail 
      });
      return logs[0] || null;
    },
    enabled: isOpen && !!userEmail,
  });

  const { data: carryoverTasks = [] } = useQuery({
    queryKey: ['carryoverHistory', format(selectedDate, 'yyyy-MM-dd'), userEmail],
    queryFn: () => base44.entities.CarryoverTask.filter({ 
      original_date: format(selectedDate, 'yyyy-MM-dd'),
      created_by: userEmail 
    }),
    enabled: isOpen && !!userEmail,
  });

  const selfCareTasks = [
    { id: 'shower_completed', label: 'Shower' },
    { id: 'breakfast_completed', label: 'Breakfast' },
    { id: 'lunch_completed', label: 'Lunch' },
    { id: 'dinner_completed', label: 'Dinner' },
    { id: 'brushed_teeth_morning', label: 'Brush Teeth (AM)' },
    { id: 'brushed_teeth_night', label: 'Brush Teeth (PM)' },
    { id: 'drank_water', label: 'Water' },
    { id: 'physical_activity', label: 'Physical Activity' },
  ];

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    if (nextDay < new Date()) {
      setSelectedDate(nextDay);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Task History
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Date navigation */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <Button variant="ghost" size="sm" onClick={goToPreviousDay}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToNextDay}
              disabled={addDays(selectedDate, 1) >= new Date()}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Self-care tasks */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Self Care</h3>
            {!selfCareLog ? (
              <p className="text-sm text-gray-500 italic">No data for this date</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {selfCareTasks.map(task => {
                  const isComplete = selfCareLog?.[task.id];
                  return (
                    <div 
                      key={task.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        isComplete ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {isComplete ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      <span className="text-sm">{task.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Carryover tasks */}
          {carryoverTasks.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Carryover Actions</h3>
              <div className="space-y-2">
                {carryoverTasks.map(task => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm">{task.task_label}</span>
                    <Badge 
                      variant="outline"
                      className={
                        task.status === 'completed' ? 'text-green-600 border-green-300' :
                        task.status === 'skipped' ? 'text-gray-600 border-gray-300' :
                        task.status === 'rescheduled' ? 'text-blue-600 border-blue-300' :
                        'text-amber-600 border-amber-300'
                      }
                    >
                      {task.status === 'rescheduled' && task.rescheduled_to 
                        ? `→ ${format(new Date(task.rescheduled_to), 'MMM d')}`
                        : task.status
                      }
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}