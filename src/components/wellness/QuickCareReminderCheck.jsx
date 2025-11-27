import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format } from 'date-fns';

const reminderTypeIcons = {
  medication: '💊',
  bedtime: '🛏️',
  meal: '🍽️',
  goodnight_message: '🌙',
  checkup: '📋',
  appointment: '📅',
  exercise: '🏃',
  other: '📌'
};

export default function QuickCareReminderCheck({ userEmail }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const dayOfWeek = format(new Date(), 'EEEE');

  const { data: reminders = [] } = useQuery({
    queryKey: ['careReminders', userEmail],
    queryFn: () => base44.entities.CareReminder.filter({ is_active: true, created_by: userEmail }),
    enabled: !!userEmail,
  });

  // Filter to today's reminders
  const todaysReminders = reminders.filter(r => 
    !r.days || r.days.length === 0 || r.days.includes(dayOfWeek)
  );

  const { data: completedToday = [] } = useQuery({
    queryKey: ['careReminderLogs', today, userEmail],
    queryFn: async () => {
      // Store completed reminders in a simple format
      const logs = await base44.entities.DailySelfCareLog.filter({ date: today, created_by: userEmail });
      return logs[0]?.completed_care_reminders || [];
    },
    enabled: !!userEmail,
  });

  const { data: selfCareLog } = useQuery({
    queryKey: ['selfCareLogForReminders', today, userEmail],
    queryFn: async () => {
      const logs = await base44.entities.DailySelfCareLog.filter({ date: today, created_by: userEmail });
      return logs[0] || null;
    },
    enabled: !!userEmail,
  });

  const toggleMutation = useMutation({
    mutationFn: async (reminderId) => {
      const currentCompleted = selfCareLog?.completed_care_reminders || [];
      const isCompleted = currentCompleted.includes(reminderId);
      const newCompleted = isCompleted
        ? currentCompleted.filter(id => id !== reminderId)
        : [...currentCompleted, reminderId];

      if (selfCareLog) {
        return base44.entities.DailySelfCareLog.update(selfCareLog.id, {
          completed_care_reminders: newCompleted
        });
      } else {
        return base44.entities.DailySelfCareLog.create({
          date: today,
          completed_care_reminders: newCompleted
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careReminderLogs'] });
      queryClient.invalidateQueries({ queryKey: ['selfCareLogForReminders'] });
    }
  });

  if (todaysReminders.length === 0) return null;

  const completedIds = selfCareLog?.completed_care_reminders || [];
  const completedCount = todaysReminders.filter(r => completedIds.includes(r.id)).length;

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-violet-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-500" />
            Care Reminders
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={completedCount === todaysReminders.length ? "default" : "secondary"} 
                   className={completedCount === todaysReminders.length ? "bg-green-500" : ""}>
              {completedCount}/{todaysReminders.length}
            </Badge>
            <Link to={createPageUrl('CareReminders')}>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {todaysReminders.map(reminder => {
            const done = completedIds.includes(reminder.id);
            return (
              <button
                key={reminder.id}
                onClick={() => toggleMutation.mutate(reminder.id)}
                className={`px-3 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                  done
                    ? 'border-green-400 bg-green-100 text-green-800'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                {done && <Check className="w-4 h-4" />}
                <span>{reminderTypeIcons[reminder.reminder_type] || '📌'}</span>
                <div className="text-left">
                  <span className="text-sm font-medium">{reminder.title}</span>
                  <span className="text-xs text-gray-500 ml-1">({reminder.person_name})</span>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}