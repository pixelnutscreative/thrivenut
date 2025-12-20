import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function HabitConfigModal({ open, onOpenChange, initialData, onConfirm }) {
  const [data, setData] = useState({
    name: initialData?.suggested_title || '',
    frequency: 'daily',
    target_days: [],
    monthly_date: 1
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleSave = () => {
    onConfirm({
      ...data,
      // Ensure clean data based on frequency
      target_days: data.frequency === 'specific_days' ? data.target_days : [],
      monthly_date: data.frequency === 'monthly' ? parseInt(data.monthly_date) : null
    });
    onOpenChange(false);
  };

  const toggleDay = (day) => {
    if (data.target_days.includes(day)) {
      setData({ ...data, target_days: data.target_days.filter(d => d !== day) });
    } else {
      setData({ ...data, target_days: [...data.target_days, day] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Habit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Habit Name</Label>
            <Input 
              value={data.name} 
              onChange={(e) => setData({ ...data, name: e.target.value })} 
              placeholder="e.g., Drink Water"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select 
              value={data.frequency} 
              onValueChange={(val) => setData({ ...data, frequency: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="specific_days">Specific Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {data.frequency === 'specific_days' && (
            <div className="space-y-2">
              <Label>Select Days</Label>
              <div className="grid grid-cols-2 gap-2">
                {daysOfWeek.map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox 
                      id={day} 
                      checked={data.target_days.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    <label htmlFor={day} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {day}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.frequency === 'monthly' && (
            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Input 
                type="number" 
                min="1" 
                max="31" 
                value={data.monthly_date}
                onChange={(e) => setData({ ...data, monthly_date: e.target.value })}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Confirm Habit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}