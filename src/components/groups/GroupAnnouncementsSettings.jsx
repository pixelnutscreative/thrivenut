import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Megaphone, Check, Clock } from 'lucide-react';
import { useTheme } from '../shared/useTheme';
import ColorPicker from '../shared/ColorPicker';

export default function GroupAnnouncementsSettings({ group }) {
  const queryClient = useQueryClient();
  const { user } = useTheme();
  
  const [formData, setFormData] = useState({
    message: '',
    link: '',
    style_type: 'solid',
    color: '#8b5cf6',
    color_end: '#ec4899',
    animation_direction: 'left',
    start_time: '',
    end_time: '',
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
      setFormData({ 
        message: '', 
        link: '', 
        style_type: 'solid', 
        color: '#8b5cf6', 
        color_end: '#ec4899',
        animation_direction: 'left',
        start_time: '',
        end_time: '',
        is_active: true 
      });
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
          <CardTitle>Create Group Announcement</CardTitle>
          <CardDescription>
            This message will appear inside the group dashboard, just above the tabs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea 
              placeholder="e.g. BATTLE STARTING IN 10 MINUTES! 🚀" 
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
            />
            <p className="text-xs text-gray-500">Supports simple HTML like &lt;b&gt;bold&lt;/b&gt;</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Link (Optional)</Label>
                <Input 
                  placeholder="https://..." 
                  value={formData.link}
                  onChange={e => setFormData({...formData, link: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Animation Direction</Label>
                <Select 
                  value={formData.animation_direction} 
                  onValueChange={v => setFormData({...formData, animation_direction: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Static)</SelectItem>
                    <SelectItem value="left">Right to Left (←)</SelectItem>
                    <SelectItem value="right">Left to Right (→)</SelectItem>
                    <SelectItem value="up">Up (↑)</SelectItem>
                    <SelectItem value="down">Down (↓)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Background Style</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="style_type"
                      checked={formData.style_type === 'solid'}
                      onChange={() => setFormData({...formData, style_type: 'solid'})}
                    />
                    Solid
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="style_type"
                      checked={formData.style_type === 'gradient'}
                      onChange={() => setFormData({...formData, style_type: 'gradient'})}
                    />
                    Gradient
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{formData.style_type === 'gradient' ? 'Start Color' : 'Background Color'}</Label>
                <div className="flex items-center gap-2">
                  <ColorPicker 
                    color={formData.color} 
                    onChange={c => setFormData({...formData, color: c})} 
                  />
                  <div className="w-full h-10 rounded border" style={{ backgroundColor: formData.color }}></div>
                </div>
              </div>

              {formData.style_type === 'gradient' && (
                <div className="space-y-2">
                  <Label>End Color</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker 
                      color={formData.color_end} 
                      onChange={c => setFormData({...formData, color_end: c})} 
                    />
                    <div className="w-full h-10 rounded border" style={{ backgroundColor: formData.color_end }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" /> Schedule (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input 
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={e => setFormData({...formData, start_time: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input 
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={e => setFormData({...formData, end_time: e.target.value})}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Leave blank to activate immediately and run until turned off manually.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.message}>
              <Megaphone className="w-4 h-4 mr-2" /> Publish Announcement
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Active Announcements</h3>
        {announcements.length === 0 && <p className="text-gray-500 italic">No announcements found.</p>}
        {announcements.map(ann => {
          const bgStyle = ann.style_type === 'gradient' 
            ? { background: `linear-gradient(to right, ${ann.button_color}, ${ann.color_end})` }
            : { backgroundColor: ann.button_color || '#8b5cf6' };

          return (
            <Card key={ann.id} className="overflow-hidden">
              <div className="h-2 w-full" style={bgStyle}></div>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{ann.message}</div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-2">
                    {ann.start_time && <span>Starts: {new Date(ann.start_time).toLocaleString()}</span>}
                    {ann.end_time && <span>Ends: {new Date(ann.end_time).toLocaleString()}</span>}
                  </div>
                  {ann.link && <div className="text-xs text-blue-600 truncate mt-1">{ann.link}</div>}
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
          );
        })}
      </div>
    </div>
  );
}