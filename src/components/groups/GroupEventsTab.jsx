import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, Link as LinkIcon, Plus, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import LevelSelector from './LevelSelector';

export default function GroupEventsTab({ group, currentUser, myMembership, isAdmin }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
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
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupEvent.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupEvents', group.id]);
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupEvents', group.id])
  });

  const handleEdit = (event) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_time: event.start_time,
      link: event.link || '',
      location: event.location || '',
      target_levels: event.target_levels || []
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ title: '', description: '', start_time: '', link: '', location: '', target_levels: [] });
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const visibleEvents = events.filter(event => {
    if (isAdmin) return true;
    if (!event.target_levels || event.target_levels.length === 0) return true;
    return event.target_levels.includes(myMembership?.level);
  });

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Event</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Event' : 'Add Group Event'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Event Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                
                <div className="h-48 mb-12">
                  <ReactQuill 
                    theme="snow" 
                    value={formData.description} 
                    onChange={v => setFormData({...formData, description: v})} 
                    className="h-36"
                  />
                </div>

                <Input type="datetime-local" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                <Input placeholder="Link (Zoom, etc)" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                <Input placeholder="Location (Optional)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                
                <LevelSelector 
                  group={group} 
                  selectedLevels={formData.target_levels} 
                  onChange={(levels) => setFormData({...formData, target_levels: levels})} 
                />
                
                <Button onClick={handleSubmit} disabled={!formData.title} className="w-full">
                  {editingId ? 'Update Event' : 'Create Event'}
                </Button>
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
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(event)} className="text-gray-500 h-6 w-6 p-0 hover:text-purple-600">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(event.id)} className="text-red-500 h-6 w-6 p-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="prose prose-sm text-gray-600 mt-1 max-w-none" dangerouslySetInnerHTML={{ __html: event.description }} />
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