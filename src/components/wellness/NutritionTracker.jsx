import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Apple, Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function NutritionTracker({ userEmail }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [newItem, setNewItem] = useState('');

  const { data: log } = useQuery({
    queryKey: ['nutritionLog', today, userEmail],
    queryFn: async () => {
      const logs = await base44.entities.NutritionLog.filter({ date: today, created_by: userEmail });
      return logs[0] || null;
    },
    enabled: !!userEmail
  });

  const { data: preferences } = useQuery({
    queryKey: ['preferences', userEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: userEmail });
      return prefs[0] || null;
    },
    enabled: !!userEmail
  });

  // Default healthy goals if none set
  const defaultGoals = [
    'Leafy Greens',
    'Protein',
    'Fruit',
    'Healthy Fats',
    'Probiotics'
  ];

  const goals = log?.custom_goals?.length > 0 ? log.custom_goals : defaultGoals;

  const logMutation = useMutation({
    mutationFn: async (data) => {
      if (log) {
        return await base44.entities.NutritionLog.update(log.id, data);
      } else {
        return await base44.entities.NutritionLog.create({
          date: today,
          created_by: userEmail,
          custom_goals: goals,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionLog'] });
    }
  });

  const toggleItem = (item) => {
    const currentItems = log?.items_added || [];
    const newItems = currentItems.includes(item)
      ? currentItems.filter(i => i !== item)
      : [...currentItems, item];
    logMutation.mutate({ items_added: newItems });
  };

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    const currentGoals = log?.custom_goals?.length > 0 ? log.custom_goals : goals;
    const newGoals = [...currentGoals, newItem.trim()];
    
    // Also mark it as done immediately
    const currentItems = log?.items_added || [];
    const newItems = [...currentItems, newItem.trim()];

    logMutation.mutate({ 
      custom_goals: newGoals,
      items_added: newItems
    });
    setNewItem('');
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2 text-emerald-700">
          <Apple className="w-5 h-5" />
          Nutrition Additions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-emerald-600 mb-2">Focus on what you're ADDING to your diet today:</p>
        
        <div className="grid grid-cols-1 gap-2">
          {goals.map((item, idx) => {
            const isDone = log?.items_added?.includes(item);
            return (
              <div 
                key={idx}
                onClick={() => toggleItem(item)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isDone 
                    ? 'bg-emerald-100 border-emerald-300' 
                    : 'bg-white border-gray-200 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isDone ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                  }`}>
                    {isDone && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={isDone ? 'text-emerald-800 font-medium' : 'text-gray-600'}>
                    {item}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2">
          <Input 
            placeholder="Add something else..." 
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            className="bg-white"
          />
          <Button onClick={handleAddItem} size="icon" className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}