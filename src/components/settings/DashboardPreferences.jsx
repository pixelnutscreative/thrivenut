import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ColorPicker from '../shared/ColorPicker';
import { LayoutDashboard, Droplet, Heart, Clock, Eye, EyeOff, ArrowDown, NotebookPen, Calendar, ExternalLink, Sparkles, Paintbrush } from 'lucide-react';

const toneOptions = [
  { value: 'humorous', label: '😂 Humorous', description: 'Fun, witty, and lighthearted' },
  { value: 'professional', label: '👔 Professional', description: 'Clean, clear, and business-like' },
  { value: 'encouraging', label: '🤗 Encouraging', description: 'Supportive, kind, and uplifting' },
  { value: 'loving', label: '❤️ Loving', description: 'Warm, gentle, and caring' },
  { value: 'edgy', label: '😏 Edgy / Sassy', description: 'Bold, direct, borderline disrespectful (fun!)' },
  { value: 'biblical', label: '🙏 Biblical', description: 'Faith-based and scripture-aligned' },
];

const colorOptions = [
  { value: 'green', label: 'Green (Default)', bg: 'bg-green-500' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-500' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500' },
  { value: 'teal', label: 'Teal', bg: 'bg-teal-500' },
  { value: 'red', label: 'Red', bg: 'bg-red-500' },
];

const displayOptions = [
  { value: 'show_checked', label: 'Show with checkmark', icon: Eye, description: 'Completed items stay visible with a checkmark' },
  { value: 'hide', label: 'Hide when done', icon: EyeOff, description: 'Completed items disappear from the list' },
  { value: 'move_to_bottom', label: 'Move to completed section', icon: ArrowDown, description: 'Completed items move to a section below' }
];

const fastingSchedules = [
  { value: '16_8', label: '16:8', description: '16 hours fasting, 8 hour eating window' },
  { value: '18_6', label: '18:6', description: '18 hours fasting, 6 hour eating window' },
  { value: '20_4', label: '20:4', description: '20 hours fasting, 4 hour eating window' },
  { value: 'omad', label: 'OMAD', description: 'One Meal A Day' },
  { value: '5_2', label: '5:2', description: '5 normal days, 2 reduced calorie days' },
  { value: 'custom', label: 'Custom', description: 'Set your own eating window' }
];

const genderOptions = [
  { value: 'female', label: '👑 Queen' },
  { value: 'male', label: '🤴 King' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
];

const viewModeOptions = [
  { value: 'detailed', label: 'Detailed View', description: 'See all tasks organized by time of day with full details' },
  { value: 'compact', label: 'Compact View', description: 'Quick icon-based view for experienced users' }
];

const journalReminderOptions = [
  { value: 'morning', label: 'Morning', description: 'Reflect on yesterday or set intentions for today' },
  { value: 'lunch', label: 'Lunchtime', description: 'Midday check-in and reflection' },
  { value: 'evening', label: 'Evening', description: 'Wind down with end of day journaling' },
  { value: 'night', label: 'Night', description: 'Before bed reflection' }
];

export default function DashboardPreferences({ formData, setFormData }) {
  return (
    <div className="space-y-6">
      {/* Personalization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" />
            Personalization
          </CardTitle>
          <CardDescription>Customize how your dashboard looks and works</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Completed Items Color */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Paintbrush className="w-4 h-4 text-gray-500" />
              Completed Items Color
            </Label>
            <div className="flex flex-wrap items-center gap-4">
              <ColorPicker 
                color={formData.completed_items_color || '#22c55e'} 
                onChange={(c) => setFormData({ ...formData, completed_items_color: c })} 
                label="Pick Color"
              />
              
              <div className="flex gap-2">
                {(formData.saved_colors && formData.saved_colors.length > 0) ? (
                  formData.saved_colors.slice(0, 7).map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setFormData({ ...formData, completed_items_color: color })}
                      className="w-8 h-8 rounded-full border border-gray-200 shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))
                ) : (
                  Array(7).fill(0).map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 opacity-50" />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dashboard View Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              {viewModeOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, dashboard_view_mode: opt.value })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    (formData.dashboard_view_mode || 'detailed') === opt.value
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <h4 className="font-semibold">{opt.label}</h4>
                  <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Tasks Display */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Tasks Display</CardTitle>
          <CardDescription>Choose how completed items appear on your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayOptions.map(option => {
            const Icon = option.icon;
            return (
              <div
                key={option.value}
                onClick={() => setFormData({ ...formData, completed_tasks_display: option.value })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.completed_tasks_display === option.value
                    ? ''
                    : 'border-gray-200 hover:opacity-80'
                }`}
                style={formData.completed_tasks_display === option.value ? {
                  borderColor: 'var(--accent-color)',
                  backgroundColor: 'color-mix(in srgb, var(--accent-color) 10%, white)'
                } : {}}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center`}
                    style={{ borderColor: formData.completed_tasks_display === option.value ? 'var(--accent-color)' : '#d1d5db' }}
                  >
                    {formData.completed_tasks_display === option.value && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--accent-color)' }} />
                    )}
                  </div>
                  <Icon className="w-5 h-5 text-gray-600" />
                  <div>
                    <h4 className="font-semibold">{option.label}</h4>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Check-in Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-blue-500" />
            Check-in Reminders
          </CardTitle>
          <CardDescription>Choose which reminders to show throughout the day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onClick={() => setFormData({ ...formData, enable_water_reminders: !formData.enable_water_reminders })}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              formData.enable_water_reminders ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox checked={formData.enable_water_reminders} />
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-blue-500" />
                  Water Check-ins (4x daily)
                </h4>
                <p className="text-sm text-gray-600">Morning, Midday, Afternoon, Evening reminders to stay hydrated</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setFormData({ ...formData, enable_mood_checkins: !formData.enable_mood_checkins })}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              formData.enable_mood_checkins ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-pink-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox checked={formData.enable_mood_checkins} />
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Mood Check-ins
                </h4>
                <p className="text-sm text-gray-600">Reminders to log how you're feeling</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Reminder Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <NotebookPen className="w-5 h-5 text-purple-500" />
            Journal Reminder
          </CardTitle>
          <CardDescription>When would you like to be reminded to journal?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {journalReminderOptions.map(opt => (
              <div
                key={opt.value}
                onClick={() => setFormData({ ...formData, journal_reminder_time: opt.value })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  (formData.journal_reminder_time || 'night') === opt.value
                    ? ''
                    : 'border-gray-200 hover:opacity-80'
                }`}
                style={(formData.journal_reminder_time || 'night') === opt.value ? {
                  borderColor: 'var(--accent-color)',
                  backgroundColor: 'color-mix(in srgb, var(--accent-color) 10%, white)'
                } : {}}
              >
                <h4 className="font-semibold">{opt.label}</h4>
                <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Google Calendar
          </CardTitle>
          <CardDescription>Connect your personal Google Calendar to see events in My Day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.google_calendar_connected ? (
            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">✓ Google Calendar Connected</h4>
                    <p className="text-sm text-green-600">Your events will show in My Day</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFormData({ ...formData, google_calendar_connected: false, show_google_calendar: false })}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
              
              <div
                onClick={() => setFormData({ ...formData, show_google_calendar: !formData.show_google_calendar })}
                className="mt-4 p-3 rounded-lg border cursor-pointer hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={formData.show_google_calendar} />
                  <span className="text-sm">Show Google Calendar events in My Day</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">Connect Your Google Calendar</h4>
                  <p className="text-sm text-gray-600">See your personal calendar events in My Day</p>
                </div>
              </div>
              <Button 
                onClick={() => setFormData({ ...formData, google_calendar_connected: true, show_google_calendar: true })}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Connect Google Calendar
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                You'll be prompted to authorize access when you save settings
              </p>
            </div>
          )}
          
          {/* Pixel Nuts Events Calendar link */}
          <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-800">Pixel Nuts Events Calendar</h4>
                <p className="text-sm text-purple-600">Subscribe to community events & workshops</p>
              </div>
            </div>
            <a
              href="https://pixelnutscreative.com/calendar"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View & Subscribe to Events
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Intermittent Fasting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" />
            Intermittent Fasting
          </CardTitle>
          <CardDescription>Track your eating window and fasting periods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onClick={() => setFormData({ ...formData, intermittent_fasting: !formData.intermittent_fasting })}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              formData.intermittent_fasting ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox checked={formData.intermittent_fasting} />
              <div>
                <h4 className="font-semibold">I practice intermittent fasting</h4>
                <p className="text-sm text-gray-600">Track your fasting and eating windows</p>
              </div>
            </div>
          </div>

          {formData.intermittent_fasting && (
            <div className="space-y-4 p-4 bg-green-50 rounded-xl">
              <div className="space-y-2">
                <Label>Fasting Schedule</Label>
                <Select 
                  value={formData.fasting_schedule || '16_8'} 
                  onValueChange={(v) => setFormData({ ...formData, fasting_schedule: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fastingSchedules.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <div>
                          <span className="font-medium">{s.label}</span>
                          <span className="text-gray-500 ml-2 text-sm">{s.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(formData.fasting_schedule === 'custom' || formData.fasting_schedule) && formData.fasting_schedule !== '5_2' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Eating window starts</Label>
                    <Input
                      type="time"
                      value={formData.eating_window_start || '12:00'}
                      onChange={(e) => setFormData({ ...formData, eating_window_start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Eating window ends</Label>
                    <Input
                      type="time"
                      value={formData.eating_window_end || '20:00'}
                      onChange={(e) => setFormData({ ...formData, eating_window_end: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}