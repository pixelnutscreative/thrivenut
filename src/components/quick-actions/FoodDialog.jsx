import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function FoodDialog({ isOpen, onClose, onSave, isLoading }) {
  const queryClient = useQueryClient();
  const [mealType, setMealType] = useState('breakfast');
  const [foodItems, setFoodItems] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMealType('breakfast');
      setFoodItems('');
      setNotes('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!foodItems) return;
    onSave({ meal_type: mealType, food_items: foodItems, notes, date: format(new Date(), 'yyyy-MM-dd') });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Your Meal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Meal Type</Label>
            <div className="flex flex-wrap gap-2">
              <Button variant={mealType === 'breakfast' ? 'default' : 'outline'} onClick={() => setMealType('breakfast')}>Breakfast</Button>
              <Button variant={mealType === 'lunch' ? 'default' : 'outline'} onClick={() => setMealType('lunch')}>Lunch</Button>
              <Button variant={mealType === 'dinner' ? 'default' : 'outline'} onClick={() => setMealType('dinner')}>Dinner</Button>
              <Button variant={mealType === 'snack' ? 'default' : 'outline'} onClick={() => setMealType('snack')}>Snack</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="foodItems">What did you eat?</Label>
            <Textarea
              id="foodItems"
              placeholder="e.g., Scrambled eggs, toast, coffee"
              value={foodItems}
              onChange={(e) => setFoodItems(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="How did you feel after?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!foodItems || isLoading}>Save Meal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}