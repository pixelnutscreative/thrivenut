import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, X, FileText } from 'lucide-react';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKENDS = ['Saturday', 'Sunday'];
const contentFormats = ["duet", "sync", "training", "series", "Q&A", "tutorial", "unboxing", "haul"];

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
              selectedDays.includes(day) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PostScheduleModal({ isOpen, onClose, posts, onSave }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setItems((posts || []).map(p => ({
        ...p,
        days: p.days || (p.day_of_week ? [p.day_of_week] : ['Monday'])
      })));
    }
  }, [isOpen, posts]);

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
  
  const addItem = () => setItems([...items, { days: ['Monday'], time: '09:00', completed: false, content_formats: [], is_recurring: false }]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Scheduled Posts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {items.map((item, index) => (
            <div key={index} className="border-2 border-purple-100 p-4 rounded-xl bg-purple-50/50 space-y-4">
              <div className="flex justify-between items-start">
                <Label className="text-sm font-medium text-gray-700">Which days?</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 h-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <DaySelector selectedDays={item.days || []} onChange={(days) => updateItem(index, 'days', days)} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm">Time</Label>
                  <Input type="time" value={item.time || ''} onChange={(e) => updateItem(index, 'time', e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Title</Label>
                  <Input placeholder="Post title" value={item.title || ''} onChange={(e) => updateItem(index, 'title', e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Description</Label>
                  <Input placeholder="Description" value={item.description || ''} onChange={(e) => updateItem(index, 'description', e.target.value)} />
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
                        const current = item.content_formats || [];
                        const updated = current.includes(format) ? current.filter(f => f !== format) : [...current, format];
                        updateItem(index, 'content_formats', updated);
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        (item.content_formats || []).includes(format) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={item.is_recurring || false} onCheckedChange={(checked) => updateItem(index, 'is_recurring', checked)} />
                  <span className="text-sm">🔄 Recurring Weekly</span>
                </label>
              </div>
            </div>
          ))}
          
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" /> Add Post Schedule
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Posts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}