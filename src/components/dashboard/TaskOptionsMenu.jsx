import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, SkipForward, ArrowRight, CalendarDays, 
  PauseCircle, Check, X, Clock
} from 'lucide-react';
import { format, addDays } from 'date-fns';

const dayOfWeekOptions = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' },
];

const pauseDurationOptions = [
  { value: 1, label: '1 day' },
  { value: 2, label: '2 days' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '30 days' },
  { value: 'custom', label: 'Custom...' },
];

export default function TaskOptionsMenu({ 
  task, 
  onSkip, 
  onPushToNextDay, 
  onPushToDate,
  onPause,
  onMarkComplete
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState(null); // 'push_date', 'push_day', 'pause', 'pause_custom'
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDay, setSelectedDay] = useState('');
  const [pauseDuration, setPauseDuration] = useState('');
  const [customPauseDays, setCustomPauseDays] = useState('');

  const handleSkip = () => {
    onSkip?.(task.id);
    setIsOpen(false);
    resetState();
  };

  const handlePushToNextDay = () => {
    const tomorrow = addDays(new Date(), 1);
    onPushToNextDay?.(task.id, format(tomorrow, 'yyyy-MM-dd'));
    setIsOpen(false);
    resetState();
  };

  const handlePushToDate = () => {
    if (selectedDate) {
      onPushToDate?.(task.id, format(selectedDate, 'yyyy-MM-dd'));
      setIsOpen(false);
      resetState();
    }
  };

  const handlePushToDay = () => {
    if (selectedDay) {
      // Find next occurrence of selected day
      const today = new Date();
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDayIndex = daysOfWeek.indexOf(selectedDay);
      const currentDayIndex = today.getDay();
      let daysUntilTarget = targetDayIndex - currentDayIndex;
      if (daysUntilTarget <= 0) daysUntilTarget += 7; // Next week
      const targetDate = addDays(today, daysUntilTarget);
      onPushToDate?.(task.id, format(targetDate, 'yyyy-MM-dd'));
      setIsOpen(false);
      resetState();
    }
  };

  const handlePause = () => {
    const days = pauseDuration === 'custom' ? parseInt(customPauseDays) : parseInt(pauseDuration);
    if (days > 0) {
      const resumeDate = addDays(new Date(), days);
      onPause?.(task.id, days, format(resumeDate, 'yyyy-MM-dd'));
      setIsOpen(false);
      resetState();
    }
  };

  const handleMarkComplete = () => {
    onMarkComplete?.(task);
    setIsOpen(false);
    resetState();
  };

  const resetState = () => {
    setActiveAction(null);
    setSelectedDate(null);
    setSelectedDay('');
    setPauseDuration('');
    setCustomPauseDays('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Task options"
        >
          <Settings className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end" onClick={(e) => e.stopPropagation()}>
        <div className="p-3 border-b bg-gray-50">
          <h4 className="font-semibold text-sm text-gray-700">Task Options</h4>
          <p className="text-xs text-gray-500 truncate">{task.label}</p>
        </div>

        {!activeAction && (
          <div className="p-2 space-y-1">
            {/* Mark Complete */}
            <button
              onClick={handleMarkComplete}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 text-left transition-colors"
            >
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">Mark as done</span>
            </button>

            {/* Skip */}
            <button
              onClick={handleSkip}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 text-left transition-colors"
            >
              <SkipForward className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-sm text-gray-700">Skip for today</span>
                <p className="text-xs text-gray-400">Won't show again today</p>
              </div>
            </button>

            {/* Push to Tomorrow */}
            <button
              onClick={handlePushToNextDay}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 text-left transition-colors"
            >
              <ArrowRight className="w-4 h-4 text-blue-500" />
              <div>
                <span className="text-sm text-gray-700">Push to tomorrow</span>
                <p className="text-xs text-gray-400">Reschedule for next day</p>
              </div>
            </button>

            {/* Push to Day of Week */}
            <button
              onClick={() => setActiveAction('push_day')}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 text-left transition-colors"
            >
              <Clock className="w-4 h-4 text-purple-500" />
              <div>
                <span className="text-sm text-gray-700">Push to day of week</span>
                <p className="text-xs text-gray-400">Choose Monday, Tuesday, etc.</p>
              </div>
            </button>

            {/* Push to Specific Date */}
            <button
              onClick={() => setActiveAction('push_date')}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-teal-50 text-left transition-colors"
            >
              <CalendarDays className="w-4 h-4 text-teal-500" />
              <div>
                <span className="text-sm text-gray-700">Push to specific date</span>
                <p className="text-xs text-gray-400">Pick a date on calendar</p>
              </div>
            </button>

            {/* Pause */}
            <button
              onClick={() => setActiveAction('pause')}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-amber-50 text-left transition-colors"
            >
              <PauseCircle className="w-4 h-4 text-amber-500" />
              <div>
                <span className="text-sm text-gray-700">Pause this task</span>
                <p className="text-xs text-gray-400">Hide for 1, 7, 30 days...</p>
              </div>
            </button>
          </div>
        )}

        {/* Push to Day of Week */}
        {activeAction === 'push_day' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveAction(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
              <span className="text-sm font-medium">Push to day of week</span>
            </div>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {dayOfWeekOptions.map(day => (
                  <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handlePushToDay} 
              disabled={!selectedDay}
              className="w-full bg-purple-500 hover:bg-purple-600"
              size="sm"
            >
              Push to {selectedDay || 'selected day'}
            </Button>
          </div>
        )}

        {/* Push to Specific Date */}
        {activeAction === 'push_date' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveAction(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
              <span className="text-sm font-medium">Select a date</span>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
            <Button 
              onClick={handlePushToDate} 
              disabled={!selectedDate}
              className="w-full bg-teal-500 hover:bg-teal-600"
              size="sm"
            >
              Push to {selectedDate ? format(selectedDate, 'MMM d') : 'selected date'}
            </Button>
          </div>
        )}

        {/* Pause */}
        {activeAction === 'pause' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveAction(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
              <span className="text-sm font-medium">Pause duration</span>
            </div>
            <Select value={pauseDuration} onValueChange={setPauseDuration}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {pauseDurationOptions.map(opt => (
                  <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {pauseDuration === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  placeholder="Days"
                  value={customPauseDays}
                  onChange={(e) => setCustomPauseDays(e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            )}
            <Button 
              onClick={handlePause} 
              disabled={!pauseDuration || (pauseDuration === 'custom' && !customPauseDays)}
              className="w-full bg-amber-500 hover:bg-amber-600"
              size="sm"
            >
              <PauseCircle className="w-4 h-4 mr-2" />
              Pause task
            </Button>
            <p className="text-xs text-gray-400 text-center">
              Task will reappear on {pauseDuration && pauseDuration !== 'custom' 
                ? format(addDays(new Date(), parseInt(pauseDuration)), 'MMM d, yyyy')
                : customPauseDays 
                  ? format(addDays(new Date(), parseInt(customPauseDays)), 'MMM d, yyyy')
                  : '...'}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}