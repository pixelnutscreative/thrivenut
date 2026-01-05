import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, X, Video } from 'lucide-react';

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
              selectedDays.includes(day) ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LiveScheduleModal({ isOpen, onClose, lives, onSave }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setItems((lives || []).map(l => ({
        ...l,
        days: l.days || (l.day_of_week ? [l.day_of_week] : ['Monday'])
      })));
    }
  }, [isOpen, lives]);

  const handleSave = async () => {
    setLoading(true);
    // Ensure host_username is set if missing (default to current user logic if needed, but here we just pass items)
    await onSave(items);
    setLoading(false);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));
  
  const addItem = () => setItems([...items, { days: ['Monday'], time: '12:00', completed: false, tiktok_shop_items: [], audience_restriction: 'all_ages', is_recurring: false }]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-pink-600" />
            Scheduled Lives
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {items.map((item, index) => (
            <div key={index} className="border-2 border-pink-100 p-4 rounded-xl bg-pink-50/50 space-y-4">
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
                  <Input placeholder="Live title" value={item.title || ''} onChange={(e) => updateItem(index, 'title', e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Audience</Label>
                  <Select value={item.audience_restriction || 'all_ages'} onValueChange={(value) => updateItem(index, 'audience_restriction', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_ages">All Ages</SelectItem>
                      <SelectItem value="18+">18+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm">Description</Label>
                <Textarea placeholder="Live description" value={item.description || ''} onChange={(e) => updateItem(index, 'description', e.target.value)} rows={2} />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <Label className="text-sm">Host Username</Label>
                    <Input placeholder="@username" value={item.host_username || ''} onChange={(e) => updateItem(index, 'host_username', e.target.value.replace('@',''))} />
                 </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">TikTok Shop Items</Label>
                {(item.tiktok_shop_items || []).map((shopItem, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-2">
                    <Input placeholder="Item Name" value={shopItem.name || ''} onChange={(e) => {
                      const newItems = [...(item.tiktok_shop_items || [])];
                      newItems[itemIndex] = { ...newItems[itemIndex], name: e.target.value };
                      updateItem(index, 'tiktok_shop_items', newItems);
                    }} className="flex-1" />
                    <Input placeholder="TikTok Shop URL" value={shopItem.url || ''} onChange={(e) => {
                      const newItems = [...(item.tiktok_shop_items || [])];
                      newItems[itemIndex] = { ...newItems[itemIndex], url: e.target.value };
                      updateItem(index, 'tiktok_shop_items', newItems);
                    }} className="flex-1" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => {
                      const newItems = (item.tiktok_shop_items || []).filter((_, i) => i !== itemIndex);
                      updateItem(index, 'tiktok_shop_items', newItems);
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const newItems = [...(item.tiktok_shop_items || []), { url: '', name: '' }];
                  updateItem(index, 'tiktok_shop_items', newItems);
                }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Shop Item
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={item.is_shareable || false} onCheckedChange={(checked) => updateItem(index, 'is_shareable', checked)} />
                  <span className="text-sm font-medium text-purple-700">📢 Share with Community</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={item.is_recurring || false} onCheckedChange={(checked) => updateItem(index, 'is_recurring', checked)} />
                  <span className="text-sm">🔄 Recurring Weekly</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={item.added_to_tiktok_events || false} onCheckedChange={(checked) => updateItem(index, 'added_to_tiktok_events', checked)} />
                  <span className="text-sm">Added to TikTok Events</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={item.posted_in_discord || false} onCheckedChange={(checked) => updateItem(index, 'posted_in_discord', checked)} />
                  <span className="text-sm">Posted in Discord</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={item.shared_to_story || false} onCheckedChange={(checked) => updateItem(index, 'shared_to_story', checked)} />
                  <span className="text-sm">Shared to Story</span>
                </label>
              </div>
            </div>
          ))}
          
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" /> Add Live Schedule
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-pink-600 hover:bg-pink-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Lives
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}