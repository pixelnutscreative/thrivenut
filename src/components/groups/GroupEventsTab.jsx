import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function GroupEventsTab({ group, currentUser, myMembership, isAdmin }) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ 
    title: '', description: '', start_time: '', link: '', location: '', target_levels: [] 
  });

  const { data: events = [] } = useQuery({
    queryKey: ['groupEvents', group.id],
    queryFn: () => base44.entities.GroupEvent.filter({ group_id: group.id }, 'start_time'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupEvent.create({ ...data, group_id: group.id, created_by: currentUser.email }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupEvents', group.id]);
      setIsCreateOpen(false);
      setNewEvent({ title: '', description: '', start_time: '', link: '', location: '', target_levels: [] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupEvents', group.id])
  });

  const visibleEvents = events.filter(event => {
    if (isAdmin) return true;
    if (!event.target_levels || event.target_levels.length === 0) return true;
    return event.target_levels.includes(myMembership?.level);
  });

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add Event</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Group Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Event Title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                <Textarea placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
                <Input type="datetime-local" value={newEvent.start_time} onChange={e => setNewEvent({...newEvent, start_time: e.target.value})} />
                <Input placeholder="Link (Zoom, etc)" value={newEvent.link} onChange={e => setNewEvent({...newEvent, link: e.target.value})} />
                
                {group.member_levels?.length > 0 && (
                  <Select value={newEvent.target_levels[0] || 'all'} onValueChange={v => setNewEvent({...newEvent, target_levels: v === 'all' ? [] : [v]})}>
                    <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      {group.member_levels.map(level => <SelectItem key={level} value={level}>{level} Only</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                
                <Button onClick={() => createMutation.mutate(newEvent)} disabled={!newEvent.title} className="w-full">Create Event</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="grid gap-4">
        {visibleEvents.map(event => (
          <Card key={event.id}>
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-purple-100 text-purple-700 p-3 rounded-lg text-center min-w-[80px]">
                <div className="text-xs font-bold uppercase">{event.start_time ? format(new Date(event.start_time), 'MMM') : 'TBA'}</div>
                <div className="text-2xl font-bold">{event.start_time ? format(new Date(event.start_time), 'd') : '--'}</div>
                <div className="text-xs">{event.start_time ? format(new Date(event.start_time), 'h:mm a') : ''}</div>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-lg">{event.title}</h4>
                  {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(event.id)} className="text-red-500 h-6 w-6 p-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                <div className="flex gap-4 mt-3 text-sm text-gray-500">
                  {event.link && (
                    <a href={event.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                      <LinkIcon className="w-4 h-4" /> Join Link
                    </a>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {event.location}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {visibleEvents.length === 0 && <div className="text-center py-12 text-gray-500">No upcoming events.</div>}
      </div>
    </div>
  );
}