import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Trash2, Megaphone, Check } from 'lucide-react';
import { useTheme } from '../shared/useTheme';
import ColorPicker from '../shared/ColorPicker';

export default function GroupAnnouncementsSettings({ group }) {
  const queryClient = useQueryClient();
  const { user } = useTheme();
  
  const [formData, setFormData] = useState({
    message: '',
    link: '',
    color: '#8b5cf6',
    is_active: true
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['groupAnnouncements', group.id],
    queryFn: () => base44.entities.Notification.filter({ group_id: group.id, type: 'announcement' }, '-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.create({
      ...data,
      button_color: data.color, // Map local color state to entity field
      group_id: group.id,
      title: `Announcement: ${group.name}`, // Internal title
      type: 'announcement',
      created_by: user?.email,
      target_audience: 'all' // All group members effectively
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupAnnouncements', group.id]);
      setFormData({ message: '', link: '', color: '#8b5cf6', is_active: true });
      alert('Announcement created!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupAnnouncements', group.id])
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Notification.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries(['groupAnnouncements', group.id])
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Announcement</CardTitle>
          <CardDescription>
            This message will appear at the top of the dashboard for all group members.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea 
              placeholder="e.g. Join our weekly call starting in 10 minutes!" 
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
            />
            <p className="text-xs text-gray-500">Supports simple HTML like &lt;b&gt;bold&lt;/b&gt;</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Link (Optional)</Label>
              <Input 
                placeholder="https://..." 
                value={formData.link}
                onChange={e => setFormData({...formData, link: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Bar Color</Label>
              <div className="flex items-center gap-2">
                <ColorPicker 
                  color={formData.color} 
                  onChange={c => setFormData({...formData, color: c})} 
                />
                <div className="w-full h-10 rounded border" style={{ backgroundColor: formData.color }}></div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.message}>
              <Megaphone className="w-4 h-4 mr-2" /> Publish Announcement
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Active Announcements</h3>
        {announcements.length === 0 && <p className="text-gray-500 italic">No announcements found.</p>}
        {announcements.map(ann => (
          <Card key={ann.id} className="overflow-hidden">
            <div className="h-2 w-full" style={{ backgroundColor: ann.button_color || '#8b5cf6' }}></div>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{ann.message}</div>
                {ann.link && <div className="text-xs text-blue-600 truncate">{ann.link}</div>}
                <div className="text-xs text-gray-400 mt-1">Created: {new Date(ann.created_date).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-4">
                  <Switch 
                    checked={ann.is_active} 
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: ann.id, is_active: checked })}
                  />
                  <span className="text-xs text-gray-500">{ann.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate(ann.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}