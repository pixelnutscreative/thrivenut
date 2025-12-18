import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Circle, Play, ExternalLink, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function GroupTrainingTab({ group, currentUser, isAdmin }) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTraining, setNewTraining] = useState({ title: '', description: '', video_url: '' });

  const { data: trainingModules = [] } = useQuery({
    queryKey: ['groupTraining', group.id],
    queryFn: async () => {
      const modules = await base44.entities.GroupTraining.filter({ group_id: group.id, active: true }, 'sort_order');
      return modules;
    }
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['myCompletions', group.id, currentUser.email],
    queryFn: async () => {
      return await base44.entities.GroupTrainingCompletion.filter({ user_email: currentUser.email });
    }
  });

  const completedIds = completions.map(c => c.training_id);

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupTraining.create({ ...data, group_id: group.id, active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupTraining', group.id]);
      setIsAddOpen(false);
      setNewTraining({ title: '', description: '', video_url: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupTraining.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupTraining', group.id])
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: async (moduleId) => {
      const existing = completions.find(c => c.training_id === moduleId);
      if (existing) {
        return await base44.entities.GroupTrainingCompletion.delete(existing.id);
      } else {
        return await base44.entities.GroupTrainingCompletion.create({
          training_id: moduleId,
          user_email: currentUser.email,
          completed_date: new Date().toISOString()
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['myCompletions', group.id])
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Training Modules</h3>
          <p className="text-sm text-gray-500">Watch videos and track your progress</p>
        </div>
        {isAdmin && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>Add Training</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Training Module</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={newTraining.title} onChange={e => setNewTraining({...newTraining, title: e.target.value})} placeholder="Module 1: Introduction" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newTraining.description} onChange={e => setNewTraining({...newTraining, description: e.target.value})} placeholder="What will they learn?" />
                </div>
                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <Input value={newTraining.video_url} onChange={e => setNewTraining({...newTraining, video_url: e.target.value})} placeholder="https://youtube.com/..." />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => addMutation.mutate(newTraining)} disabled={!newTraining.title}>Add Module</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4">
        {trainingModules.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            No training modules available yet.
          </div>
        ) : (
          trainingModules.map(module => {
            const isCompleted = completedIds.includes(module.id);
            return (
              <Card key={module.id} className={`transition-all ${isCompleted ? 'bg-green-50/50 border-green-100' : ''}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <button 
                    onClick={() => toggleCompletionMutation.mutate(module.id)}
                    className={`mt-1 flex-shrink-0 transition-colors ${isCompleted ? 'text-green-600' : 'text-gray-300 hover:text-green-500'}`}
                  >
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>{module.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                    {module.video_url && (
                      <a 
                        href={module.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full"
                      >
                        <Play className="w-3 h-3 fill-current" /> Watch Video <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => deleteMutation.mutate(module.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}