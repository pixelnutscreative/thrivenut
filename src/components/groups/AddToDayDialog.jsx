import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AddToDayDialog({ open, onOpenChange, item, user }) {
  const queryClient = useQueryClient();
  const [isUrgent, setIsUrgent] = useState(false);
  const [syncToGoogle, setSyncToGoogle] = useState(false);
  const [recurrence, setRecurrence] = useState('none'); // none, daily, weekly, monthly, custom
  const [customInterval, setCustomInterval] = useState(1);
  const [customUnit, setCustomUnit] = useState('days');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('09:00');

  const addToMyDayMutation = useMutation({
    mutationFn: async () => {
      // 1. Add to My Day (ExternalEvent)
      const dateStr = selectedDate;
      const timeStr = selectedTime;
      
      const eventData = {
        title: item.title,
        description: item.description || item.content || '',
        date: dateStr,
        time: timeStr,
        platform: 'Group',
        url: item.link || window.location.href,
        is_urgent: isUrgent,
        created_by: user.email
      };

      await base44.entities.ExternalEvent.create(eventData);

      // 2. Handle Recurrence
      if (recurrence !== 'none') {
        // Create recurrence rule or multiple events. 
        // For simplicity, let's create a Habit or Task? Or multiple events.
        // Prompt asked for "Recurring event scheduler". 
        // Let's create a "Task" with recurrence if it fits, or just future events.
        // Since ExternalEvent doesn't have recurrence built-in usually, we might create a few instances 
        // OR create a Task which supports recurrence logic better in some apps.
        // Let's try to add a 'recurrence_rule' to ExternalEvent if possible, or just create 4 instances.
        
        let nextDate = new Date(selectedDate);
        for (let i = 1; i <= 4; i++) { // Create next 4 occurrences
            if (recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1);
            else if (recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            else if (recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            else if (recurrence === 'custom') {
                if (customUnit === 'days') nextDate.setDate(nextDate.getDate() + parseInt(customInterval));
                if (customUnit === 'weeks') nextDate.setDate(nextDate.getDate() + parseInt(customInterval) * 7);
                if (customUnit === 'months') nextDate.setMonth(nextDate.getMonth() + parseInt(customInterval));
            }
            
            await base44.entities.ExternalEvent.create({
                ...eventData,
                date: nextDate.toISOString().split('T')[0]
            });
        }
      }

      // 3. Sync to Google Calendar
      if (syncToGoogle) {
        // Calculate start/end ISO
        const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
        
        await base44.functions.invoke('addToGoogleCalendar', {
            title: item.title,
            description: item.description || item.content || '',
            start_time: startDateTime,
            location: item.location || 'Online'
        });
      }
    },
    onSuccess: () => {
      onOpenChange(false);
      alert('Added to your day!');
      queryClient.invalidateQueries(['manualEventsToday']);
    },
    onError: (err) => {
      alert('Error adding to day: ' + err.message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to My Day</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center space-x-2 border p-3 rounded-lg bg-red-50 border-red-100">
            <Checkbox id="urgent" checked={isUrgent} onCheckedChange={setIsUrgent} />
            <Label htmlFor="urgent" className="flex items-center gap-2 font-medium text-red-700 cursor-pointer">
              <AlertCircle className="w-4 h-4" /> Mark as Urgent
            </Label>
          </div>

          <div className="flex items-center space-x-2 border p-3 rounded-lg">
            <Checkbox id="gcal" checked={syncToGoogle} onCheckedChange={setSyncToGoogle} />
            <Label htmlFor="gcal" className="flex items-center gap-2 font-medium cursor-pointer">
              <Calendar className="w-4 h-4 text-blue-500" /> Sync to Google Calendar
            </Label>
          </div>

          <div className="space-y-2 border p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-green-500" />
                <Label>Recurrence</Label>
            </div>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One Time Only</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom Pattern...</SelectItem>
              </SelectContent>
            </Select>

            {recurrence === 'custom' && (
                <div className="flex gap-2 mt-2 items-center">
                    <span className="text-sm">Every</span>
                    <Input 
                        type="number" 
                        className="w-16" 
                        value={customInterval} 
                        onChange={e => setCustomInterval(e.target.value)} 
                        min="1"
                    />
                    <Select value={customUnit} onValueChange={setCustomUnit}>
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="weeks">Weeks</SelectItem>
                            <SelectItem value="months">Months</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
          </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => addToMyDayMutation.mutate()} disabled={addToMyDayMutation.isPending}>
                {addToMyDayMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add to Schedule
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}