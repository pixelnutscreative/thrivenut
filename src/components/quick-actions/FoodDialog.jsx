import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Camera, Loader2, Sparkles } from 'lucide-react';

export default function FoodDialog({ isOpen, onClose, onSave, isLoading }) {
  const queryClient = useQueryClient();
  const [mealType, setMealType] = useState('breakfast');
  const [foodItems, setFoodItems] = useState('');
  const [drink, setDrink] = useState('');
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMealType('breakfast');
      setFoodItems('');
      setDrink('');
      setNotes('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!foodItems) return;
    onSave({ 
      meal_type: mealType, 
      food_items: foodItems, 
      drink_items: drink,
      notes, 
      date: format(new Date(), 'yyyy-MM-dd') 
    });
    onClose();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      // 1. Upload
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // 2. Analyze
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: "Analyze this food image. Provide a concise list of food items with estimated serving sizes. Also guess the drink if visible.",
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            food_description: { type: "string" },
            drink_guess: { type: "string" }
          }
        }
      });

      if (analysis.food_description) setFoodItems(analysis.food_description);
      if (analysis.drink_guess) setDrink(analysis.drink_guess);
      
    } catch (err) {
      console.error(err);
      alert('Failed to analyze image. Please type it in manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Your Meal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          
          <div className="flex justify-center">
            <label className="cursor-pointer flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <span className="text-sm text-purple-600 font-medium">Analyzing your meal...</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Snap a photo to auto-log</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </>
              )}
            </label>
          </div>

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
              placeholder="e.g., Scrambled eggs, toast"
              value={foodItems}
              onChange={(e) => setFoodItems(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="drink">What did you drink?</Label>
            <Input
              id="drink"
              placeholder="e.g., Coffee, Orange Juice"
              value={drink}
              onChange={(e) => setDrink(e.target.value)}
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