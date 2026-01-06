import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Check, ExternalLink, Utensils, Dog, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format } from 'date-fns';

const activityIcons = {
  walk: '🚶',
  playtime: '🎾',
  outdoor_time: '🌳',
  training: '🎓',
  grooming: '✨',
  other: '📋'
};

export default function QuickPetCareCheck({ userEmail }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: pets = [] } = useQuery({
    queryKey: ['pets', userEmail],
    queryFn: () => base44.entities.Pet.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: todaysLogs = [] } = useQuery({
    queryKey: ['petActivityLogs', today, userEmail],
    queryFn: () => base44.entities.PetActivityLog.filter({ date: today, created_by: userEmail }),
    enabled: !!userEmail,
  });

  const logMutation = useMutation({
    mutationFn: async ({ petId, taskType, taskIndex }) => {
      const taskKey = `${taskType}_${taskIndex}`;
      const existingLog = todaysLogs.find(l => l.pet_id === petId);
      
      if (existingLog) {
        const completed = existingLog.completed_tasks || [];
        if (completed.includes(taskKey)) {
          return base44.entities.PetActivityLog.update(existingLog.id, {
            completed_tasks: completed.filter(t => t !== taskKey)
          });
        } else {
          return base44.entities.PetActivityLog.update(existingLog.id, {
            completed_tasks: [...completed, taskKey]
          });
        }
      } else {
        return base44.entities.PetActivityLog.create({
          pet_id: petId,
          date: today,
          completed_tasks: [taskKey]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petActivityLogs'] });
    }
  });

  if (pets.length === 0) return null;

  const getLogForPet = (petId) => todaysLogs.find(l => l.pet_id === petId);
  const getCompletedTasks = (petId) => getLogForPet(petId)?.completed_tasks || [];

  // Calculate total tasks
  let totalTasks = 0;
  let completedCount = 0;
  pets.forEach(pet => {
    const feedingCount = pet.feeding_schedule?.length || 0;
    const activityCount = pet.activity_schedule?.reduce((sum, a) => sum + (a.times_per_day || 1), 0) || 0;
    totalTasks += feedingCount + activityCount;
    completedCount += getCompletedTasks(pet.id).length;
  });

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-green-500" />
            Pet Care
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={completedCount === totalTasks && totalTasks > 0 ? "default" : "secondary"} 
                   className={completedCount === totalTasks && totalTasks > 0 ? "bg-green-500" : ""}>
              {completedCount}/{totalTasks}
            </Badge>
            <Link to={createPageUrl('PetCare')}>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pets.map(pet => {
          const completed = getCompletedTasks(pet.id);
          const feedingSchedule = pet.feeding_schedule || [];
          const activitySchedule = pet.activity_schedule || [];

          if (feedingSchedule.length === 0 && activitySchedule.length === 0) {
            return (
              <div key={pet.id} className="text-sm text-gray-500 italic">
                {pet.name}: No schedule set
              </div>
            );
          }

          return (
            <div key={pet.id} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Dog className="w-4 h-4" />
                {pet.name}
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Feeding tasks */}
                {feedingSchedule.map((feeding, idx) => {
                  const taskKey = `feeding_${idx}`;
                  const done = completed.includes(taskKey);
                  return (
                    <button
                      key={taskKey}
                      onClick={() => logMutation.mutate({ petId: pet.id, taskType: 'feeding', taskIndex: idx })}
                      className={`px-3 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                        done
                          ? 'border-green-400 bg-green-100 text-green-800'
                          : 'border-gray-200 bg-white hover:border-green-300'
                      }`}
                    >
                      {done && <Check className="w-4 h-4" />}
                      <Utensils className="w-4 h-4" />
                      <span className="text-sm">{feeding.time || `Feed ${idx + 1}`}</span>
                    </button>
                  );
                })}

                {/* Activity tasks */}
                {activitySchedule.map((activity, actIdx) => {
                  const timesPerDay = activity.times_per_day || 1;
                  return Array.from({ length: timesPerDay }, (_, i) => {
                    const taskKey = `activity_${actIdx}_${i}`;
                    const done = completed.includes(taskKey);
                    return (
                      <button
                        key={taskKey}
                        onClick={() => logMutation.mutate({ petId: pet.id, taskType: `activity_${actIdx}`, taskIndex: i })}
                        className={`px-3 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                          done
                            ? 'border-green-400 bg-green-100 text-green-800'
                            : 'border-gray-200 bg-white hover:border-green-300'
                        }`}
                      >
                        {done && <Check className="w-4 h-4" />}
                        <span>{activityIcons[activity.activity_type] || '📋'}</span>
                        <span className="text-sm">
                          {activity.activity_type?.replace('_', ' ') || 'Activity'}
                          {timesPerDay > 1 && ` ${i + 1}`}
                        </span>
                      </button>
                    );
                  });
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}