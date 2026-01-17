import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const CONDITIONS = ["Anxiety", "Depression", "ADHD", "PTSD", "OCD", "Bipolar", "Other"];
const GOALS = ["Productivity", "Self-care", "Confidence", "Mindfulness", "Gratitude"];

export default function MentalHealthPage() {
  const queryClient = useQueryClient();
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [profile, setProfile] = useState({
    conditions: [],
    goals: []
  });

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.email) setCurrentUserEmail(user.email);
    });
  }, []);

  const { data: mentalHealthProfile, isLoading } = useQuery({
    queryKey: ['mentalHealthProfile', currentUserEmail],
    queryFn: async () => {
      if (!currentUserEmail) return null;
      const profiles = await base44.entities.MentalHealthProfile.filter({ user_email: currentUserEmail });
      return profiles[0] || null;
    },
    enabled: !!currentUserEmail,
    onSuccess: (data) => {
      if (data) {
        setProfile(data);
      } else {
        setProfile({ conditions: [], goals: [] });
      }
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (!currentUserEmail) throw new Error("No user email");
      
      if (mentalHealthProfile?.id) {
        return base44.entities.MentalHealthProfile.update(mentalHealthProfile.id, data);
      } else {
        return base44.entities.MentalHealthProfile.create({ ...data, user_email: currentUserEmail });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mentalHealthProfile', currentUserEmail]);
      toast.success("Mental health profile saved!");
    }
  });

  const handleMultiSelect = (value, field, checked) => {
    setProfile(prev => {
      const currentList = prev[field] || [];
      const newList = checked 
        ? [...currentList, value]
        : currentList.filter(item => item !== value);
      return { ...prev, [field]: newList };
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Mental Health Profile</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Conditions I'm working on:</h2>
          <div className="grid grid-cols-2 gap-3">
            {CONDITIONS.map(condition => (
              <div key={condition} className="flex items-center space-x-3">
                <Checkbox
                  id={`cond-${condition}`}
                  checked={profile.conditions?.includes(condition) || false}
                  onCheckedChange={(checked) => handleMultiSelect(condition, 'conditions', checked)}
                />
                <Label htmlFor={`cond-${condition}`}>{condition}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Goals I want to improve:</h2>
          <div className="grid grid-cols-2 gap-3">
            {GOALS.map(goal => (
              <div key={goal} className="flex items-center space-x-3">
                <Checkbox
                  id={`goal-${goal}`}
                  checked={profile.goals?.includes(goal) || false}
                  onCheckedChange={(checked) => handleMultiSelect(goal, 'goals', checked)}
                />
                <Label htmlFor={`goal-${goal}`}>{goal}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button 
        onClick={() => saveMutation.mutate(profile)} 
        className="mt-8" 
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? 'Saving...' : 'Save Profile'}
      </Button>
    </div>
  );
}