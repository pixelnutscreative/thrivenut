import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Heart } from 'lucide-react';

const STANDARD_STRUGGLES = ['anxiety', 'depression', 'adhd', 'autism', 'stress', 'loneliness', 'grief', 'trauma', 'anger', 'sleep'];
const STANDARD_GOALS = ['self_esteem', 'confidence', 'boundaries', 'relationships', 'productivity', 'mindfulness', 'self_care', 'emotional_regulation', 'motivation', 'gratitude'];

export default function AdminMentalHealthContent() {
  const { data: preferences = [], isLoading } = useQuery({
    queryKey: ['allUserPreferencesMentalHealth'],
    queryFn: async () => {
      // Fetch a large number to get a good sample
      return await base44.entities.UserPreferences.list('created_date', 500);
    }
  });

  // Aggregate custom items
  const customStruggles = new Set();
  const customGoals = new Set();

  preferences.forEach(pref => {
    pref.mental_health_struggles?.forEach(item => {
      if (!STANDARD_STRUGGLES.includes(item)) {
        customStruggles.add(item);
      }
    });
    pref.improvement_goals?.forEach(item => {
      if (!STANDARD_GOALS.includes(item)) {
        customGoals.add(item);
      }
    });
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Custom Mental Health Items</h2>
        <p className="text-gray-600 text-sm">Items users have added manually. Use these to update the standard list in code.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Custom Struggles ({customStruggles.size})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customStruggles.size > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Array.from(customStruggles).map(item => (
                  <Badge key={item} className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                    {item}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No custom struggles found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-600" />
              Custom Goals ({customGoals.size})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customGoals.size > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Array.from(customGoals).map(item => (
                  <Badge key={item} className="bg-pink-100 text-pink-800 hover:bg-pink-200">
                    {item}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No custom goals found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}