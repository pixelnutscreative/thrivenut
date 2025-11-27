import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, X, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKENDS = ['Saturday', 'Sunday'];
const contentFormats = ["duet", "sync", "training", "series", "Q&A", "tutorial", "unboxing", "haul"];

// Helper to determine frequency type from days array
const getFrequencyFromDays = (days) => {
  if (!days || days.length === 0) return 'single';
  if (days.length === 7) return 'daily';
  if (days.length === 5 && WEEKDAYS.every(d => days.includes(d))) return 'weekdays';
  if (days.length === 2 && WEEKENDS.every(d => days.includes(d))) return 'weekends';
  if (days.length === 1) return 'single';
  return 'custom';
};

// Day selector component
function DaySelector({ selectedDays, onChange, label }) {
  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  const selectPreset = (preset) => {
    switch (preset) {
      case 'daily': onChange([...ALL_DAYS]); break;
      case 'weekdays': onChange([...WEEKDAYS]); break;
      case 'weekends': onChange([...WEEKENDS]); break;
      case 'clear': onChange([]); break;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 mb-2">
        <Button type="button" variant="outline" size="sm" onClick={() => selectPreset('daily')} className="text-xs h-7">
          Daily
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => selectPreset('weekdays')} className="text-xs h-7">
          Weekdays
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => selectPreset('weekends')} className="text-xs h-7">
          Weekends
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => selectPreset('clear')} className="text-xs h-7 text-gray-500">
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_DAYS.map(day => (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedDays.includes(day)
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>
      {selectedDays.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          Selected: {selectedDays.length === 7 ? 'Daily' : 
                     selectedDays.length === 5 && WEEKDAYS.every(d => selectedDays.includes(d)) ? 'Weekdays' :
                     selectedDays.length === 2 && WEEKENDS.every(d => selectedDays.includes(d)) ? 'Weekends' :
                     selectedDays.join(', ')}
        </p>
      )}
    </div>
  );
}

export default function GoalEditModal({ isOpen, onClose, currentGoal, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    scheduled_posts: [],
    scheduled_lives: [],
    scheduled_engagement: [],
    notes: ''
  });

  useEffect(() => {
    if (isOpen && currentGoal) {
      // Ensure all schedules have proper days arrays
      const normalizeDays = (schedule) => {
        if (schedule.days && schedule.days.length > 0) {
          return schedule;
        }
        // Convert old single day format to days array
        return {
          ...schedule,
          days: schedule.day_of_week ? [schedule.day_of_week] : ['Monday']
        };
      };

      setFormData({
        scheduled_posts: (currentGoal.scheduled_posts || []).map(normalizeDays),
        scheduled_lives: (currentGoal.scheduled_lives || []).map(normalizeDays),
        scheduled_engagement: (currentGoal.scheduled_engagement || []).map(normalizeDays),
        notes: currentGoal.notes || ''
      });
    } else if (isOpen && !currentGoal) {
      setFormData({
        scheduled_posts: [],
        scheduled_lives: [],
        scheduled_engagement: [],
        notes: ''
      });
    }
  }, [isOpen, currentGoal]);

  const handleSave = async () => {
    setLoading(true);
    
    // Ensure all schedules have proper structure before saving
    const prepareSchedule = (schedule) => ({
      ...schedule,
      days: schedule.days || [],
      day_of_week: schedule.days?.[0] || 'Monday', // Keep for backwards compatibility
      frequency: getFrequencyFromDays(schedule.days)
    });

    const dataToSave = {
      scheduled_posts: formData.scheduled_posts.map(prepareSchedule),
      scheduled_lives: formData.scheduled_lives.map(prepareSchedule),
      scheduled_engagement: formData.scheduled_engagement.map(prepareSchedule),
      notes: formData.notes
    };

    console.log('Saving schedule data:', JSON.stringify(dataToSave, null, 2));
    
    try {
      await onSave(dataToSave);
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving: ' + error.message);
    }
    setLoading(false);
  };

  const updateSchedule = (type, index, field, value) => {
    const newSchedules = [...formData[type]];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setFormData({ ...formData, [type]: newSchedules });
  };

  const removeSchedule = (type, index) => {
    const newSchedules = formData[type].filter((_, i) => i !== index);
    setFormData({ ...formData, [type]: newSchedules });
  };

  const addSchedule = (type, defaultData) => {
    setFormData({ ...formData, [type]: [...formData[type], defaultData] });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Weekly Content Schedule
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Scheduled Posts */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              📱 Scheduled Posts
            </h3>
            {formData.scheduled_posts.map((schedule, index) => (
              <div key={index} className="border-2 border-purple-100 p-4 rounded-xl bg-purple-50/50 space-y-4">
                <div className="flex justify-between items-start">
                  <Label className="text-sm font-medium text-gray-700">Which days?</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSchedule('scheduled_posts', index)}
                    className="text-red-500 hover:text-red-700 h-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <DaySelector
                  selectedDays={schedule.days || []}
                  onChange={(days) => updateSchedule('scheduled_posts', index, 'days', days)}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm">Time</Label>
                    <Input
                      type="time"
                      value={schedule.time || ''}
                      onChange={(e) => updateSchedule('scheduled_posts', index, 'time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Title</Label>
                    <Input
                      placeholder="Post title"
                      value={schedule.title || ''}
                      onChange={(e) => updateSchedule('scheduled_posts', index, 'title', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Description</Label>
                    <Input
                      placeholder="Description"
                      value={schedule.description || ''}
                      onChange={(e) => updateSchedule('scheduled_posts', index, 'description', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Content Formats</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {contentFormats.map(format => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => {
                          const current = schedule.content_formats || [];
                          const updated = current.includes(format)
                            ? current.filter(f => f !== format)
                            : [...current, format];
                          updateSchedule('scheduled_posts', index, 'content_formats', updated);
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                          (schedule.content_formats || []).includes(format)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={schedule.is_recurring || false}
                      onCheckedChange={(checked) => updateSchedule('scheduled_posts', index, 'is_recurring', checked)}
                    />
                    <span className="text-sm">🔄 Recurring Weekly</span>
                  </label>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSchedule('scheduled_posts', { 
                days: ['Monday'], 
                time: '09:00', 
                completed: false, 
                content_formats: [],
                is_recurring: false
              })}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Post Schedule
            </Button>
          </div>

          {/* Scheduled Lives */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              🔴 Scheduled Lives
            </h3>
            {formData.scheduled_lives.map((schedule, index) => (
              <div key={index} className="border-2 border-pink-100 p-4 rounded-xl bg-pink-50/50 space-y-4">
                <div className="flex justify-between items-start">
                  <Label className="text-sm font-medium text-gray-700">Which days?</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSchedule('scheduled_lives', index)}
                    className="text-red-500 hover:text-red-700 h-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <DaySelector
                  selectedDays={schedule.days || []}
                  onChange={(days) => updateSchedule('scheduled_lives', index, 'days', days)}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm">Time</Label>
                    <Input
                      type="time"
                      value={schedule.time || ''}
                      onChange={(e) => updateSchedule('scheduled_lives', index, 'time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Title</Label>
                    <Input
                      placeholder="Live title"
                      value={schedule.title || ''}
                      onChange={(e) => updateSchedule('scheduled_lives', index, 'title', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Audience</Label>
                    <Select
                      value={schedule.audience_restriction || 'all_ages'}
                      onValueChange={(value) => updateSchedule('scheduled_lives', index, 'audience_restriction', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_ages">All Ages</SelectItem>
                        <SelectItem value="18+">18+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Description</Label>
                  <Textarea
                    placeholder="Live description"
                    value={schedule.description || ''}
                    onChange={(e) => updateSchedule('scheduled_lives', index, 'description', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">TikTok Shop Items</Label>
                  {(schedule.tiktok_shop_items || []).map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-2">
                      <Input
                        placeholder="Item Name"
                        value={item.name || ''}
                        onChange={(e) => {
                          const newItems = [...(schedule.tiktok_shop_items || [])];
                          newItems[itemIndex] = { ...newItems[itemIndex], name: e.target.value };
                          updateSchedule('scheduled_lives', index, 'tiktok_shop_items', newItems);
                        }}
                        className="flex-1"
                      />
                      <Input
                        placeholder="TikTok Shop URL"
                        value={item.url || ''}
                        onChange={(e) => {
                          const newItems = [...(schedule.tiktok_shop_items || [])];
                          newItems[itemIndex] = { ...newItems[itemIndex], url: e.target.value };
                          updateSchedule('scheduled_lives', index, 'tiktok_shop_items', newItems);
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newItems = (schedule.tiktok_shop_items || []).filter((_, i) => i !== itemIndex);
                          updateSchedule('scheduled_lives', index, 'tiktok_shop_items', newItems);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newItems = [...(schedule.tiktok_shop_items || []), { url: '', name: '' }];
                      updateSchedule('scheduled_lives', index, 'tiktok_shop_items', newItems);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Shop Item
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4 pt-2 border-t">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={schedule.is_shareable || false}
                      onCheckedChange={(checked) => updateSchedule('scheduled_lives', index, 'is_shareable', checked)}
                    />
                    <span className="text-sm font-medium text-purple-700">📢 Share with Community</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={schedule.is_recurring || false}
                      onCheckedChange={(checked) => updateSchedule('scheduled_lives', index, 'is_recurring', checked)}
                    />
                    <span className="text-sm">🔄 Recurring Weekly</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={schedule.added_to_tiktok_events || false}
                      onCheckedChange={(checked) => updateSchedule('scheduled_lives', index, 'added_to_tiktok_events', checked)}
                    />
                    <span className="text-sm">Added to TikTok Events</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={schedule.posted_in_discord || false}
                      onCheckedChange={(checked) => updateSchedule('scheduled_lives', index, 'posted_in_discord', checked)}
                    />
                    <span className="text-sm">Posted in Discord</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={schedule.shared_to_story || false}
                      onCheckedChange={(checked) => updateSchedule('scheduled_lives', index, 'shared_to_story', checked)}
                    />
                    <span className="text-sm">Shared to Story</span>
                  </label>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSchedule('scheduled_lives', { 
                days: ['Monday'], 
                time: '12:00', 
                completed: false, 
                tiktok_shop_items: [], 
                audience_restriction: 'all_ages' 
              })}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Live Schedule
            </Button>
          </div>

          {/* Scheduled Engagement */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              💬 Scheduled Engagement
              <span className="text-sm font-normal text-gray-500">Time to engage on besties' posts</span>
            </h3>
            {formData.scheduled_engagement.map((schedule, index) => (
              <div key={index} className="border-2 border-teal-100 p-4 rounded-xl bg-teal-50/50 space-y-4">
                <div className="flex justify-between items-start">
                  <Label className="text-sm font-medium text-gray-700">Which days?</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSchedule('scheduled_engagement', index)}
                    className="text-red-500 hover:text-red-700 h-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <DaySelector
                  selectedDays={schedule.days || []}
                  onChange={(days) => updateSchedule('scheduled_engagement', index, 'days', days)}
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Time</Label>
                    <Input
                      type="time"
                      value={schedule.time || ''}
                      onChange={(e) => updateSchedule('scheduled_engagement', index, 'time', e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={schedule.is_recurring || false}
                        onCheckedChange={(checked) => updateSchedule('scheduled_engagement', index, 'is_recurring', checked)}
                      />
                      <span className="text-sm">🔄 Recurring Weekly</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSchedule('scheduled_engagement', { 
                days: ['Monday'], 
                time: '10:00', 
                completed: false, 
                is_recurring: false 
              })}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Engagement Schedule
            </Button>
          </div>

          <div className="space-y-2 border-t pt-6">
            <Label htmlFor="notes">Weekly Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any notes or reminders for this week..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}