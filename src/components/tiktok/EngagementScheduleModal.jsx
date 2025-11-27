import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, X, MessageSquare } from 'lucide-react';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKENDS = ['Saturday', 'Sunday'];

function DaySelector({ selectedDays, onChange }) {
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
        <Button type="button" variant="outline" size="sm" onClick={() => selectPreset('daily')} className="text-xs h-7">Daily</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => selectPreset('weekdays')} className="text-xs h-7">Weekdays</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => selectPreset('weekends')} className="text-xs h-7">Weekends</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => selectPreset('clear')} className="text-xs h-7 text-gray-500">Clear</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_DAYS.map(day => (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedDays.includes(day) ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EngagementScheduleModal({ isOpen, onClose, engagements, onSave }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setItems((engagements || []).map(e => ({
        ...e,
        days: e.days || (e.day_of_week ? [e.day_of_week] : ['Monday'])
      })));
    }
  }, [isOpen, engagements]);

  const handleSave = async () => {
    setLoading(true);
    await onSave(items);
    setLoading(false);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));
  
  const addItem = () => setItems([...items, { days: ['Monday'], time: '10:00', completed: false, is_recurring: false }]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            Scheduled Engagement
            <span className="text-sm font-normal text-gray-500 ml-2">Time to engage on besties' posts</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {items.map((item, index) => (
            <div key={index} className="border-2 border-teal-100 p-4 rounded-xl bg-teal-50/50 space-y-4">
              <div className="flex justify-between items-start">
                <Label className="text-sm font-medium text-gray-700">Which days?</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 h-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <DaySelector selectedDays={item.days || []} onChange={(days) => updateItem(index, 'days', days)} />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Time</Label>
                  <Input type="time" value={item.time || ''} onChange={(e) => updateItem(index, 'time', e.target.value)} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={item.is_recurring || false} onCheckedChange={(checked) => updateItem(index, 'is_recurring', checked)} />
                    <span className="text-sm">🔄 Recurring Weekly</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
          
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" /> Add Engagement Schedule
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Engagement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}