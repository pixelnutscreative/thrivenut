import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export default function GreetingTypesSettings({ formData, setFormData }) {
  const greetingTypeOptions = [
    { id: 'scripture', name: 'Scripture', description: 'Daily Bible verse', icon: '📖' },
    { id: 'positive_quote', name: 'Positive Quote', description: 'Uplifting quotes', icon: '✨' },
    { id: 'motivational', name: 'Motivational', description: 'Get pumped up!', icon: '🔥' },
    { id: 'affirmation', name: 'Daily Affirmation', description: 'Personalized affirmations', icon: '💜' }
  ];

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">Daily Greeting Types</CardTitle>
        <CardDescription>Select which types of daily messages you want to see</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {greetingTypeOptions.map(greeting => {
          const isSelected = formData.greeting_types?.includes(greeting.id);
          return (
            <div
              key={greeting.id}
              onClick={() => {
                const current = formData.greeting_types || [];
                const newTypes = isSelected
                  ? current.filter(t => t !== greeting.id)
                  : [...current, greeting.id];
                if (newTypes.length > 0) {
                  setFormData({ ...formData, greeting_types: newTypes });
                } else {
                  setFormData({ ...formData, greeting_types: [] });
                }
              }}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox checked={isSelected} />
                <span>{greeting.icon}</span>
                <span className="font-medium">{greeting.name}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}