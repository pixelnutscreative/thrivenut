import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';

const GOOGLE_FONTS = [
  'Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Raleway', 'Oswald',
  'Bebas Neue', 'Playfair Display', 'Merriweather', 'Dancing Script', 'Pacifico',
  'Righteous', 'Bangers', 'Permanent Marker', 'Fredoka', 'Lobster', 'Anton',
  'Caveat', 'Comfortaa', 'Quicksand', 'Archivo Black', 'Bungee', 'Russo One'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminAnnouncementsContent() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingBar, setEditingBar] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    link: '',
    background_type: 'solid',
    background_color: '#3b82f6',
    gradient_color_start: '#3b82f6',
    gradient_color_end: '#8b5cf6',
    text_color: '#ffffff',
    google_font: 'Poppins',
    schedule_type: 'manual',
    is_active: false,
    recurring_schedule: [],
    display_order: 0
  });
  const [scheduleDay, setScheduleDay] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const { data: bars = [] } = useQuery({
    queryKey: ['announcementBars'],
    queryFn: () => base44.entities.AnnouncementBar.list('-display_order'),
  });

  // Show all bars in admin, sorted by priority
  const allBars = [...bars].sort((a, b) => (b.display_order || 0) - (a.display_order || 0));

  const createMutation = useMutation({
    mutationFn: (data) => editingBar 
      ? base44.entities.AnnouncementBar.update(editingBar.id, data)
      : base44.entities.AnnouncementBar.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcementBars'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AnnouncementBar.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcementBars'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.AnnouncementBar.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcementBars'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '', message: '', link: '', background_type: 'solid',
      background_color: '#3b82f6', gradient_color_start: '#3b82f6',
      gradient_color_end: '#8b5cf6', text_color: '#ffffff',
      google_font: 'Poppins', schedule_type: 'manual', is_active: false,
      recurring_schedule: [], display_order: 0
    });
    setEditingBar(null);
    setShowDialog(false);
    setScheduleDay('');
    setScheduleTime('');
  };

  const handleEdit = (bar) => {
    setEditingBar(bar);
    setFormData(bar);
    setShowDialog(true);
  };

  const addSchedule = () => {
    if (scheduleDay && scheduleTime) {
      setFormData({
        ...formData,
        recurring_schedule: [...formData.recurring_schedule, {
          day: scheduleDay,
          time: scheduleTime,
          timezone: 'America/Los_Angeles'
        }]
      });
      setScheduleDay('');
      setScheduleTime('');
    }
  };

  const removeSchedule = (index) => {
    setFormData({
      ...formData,
      recurring_schedule: formData.recurring_schedule.filter((_, i) => i !== index)
    });
  };

  const backgroundPreview = formData.background_type === 'gradient'
    ? `linear-gradient(to right, ${formData.gradient_color_start}, ${formData.gradient_color_end})`
    : formData.background_color;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Announcement Bars</h2>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Announcement Bar
        </Button>
      </div>

      <div className="grid gap-4">
        {allBars.map(bar => (
          <Card key={bar.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{bar.name}</h3>
                    <Badge variant={bar.is_active ? 'default' : 'secondary'}>
                      {bar.schedule_type === 'manual' ? (bar.is_active ? 'ON' : 'OFF') : bar.schedule_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Priority: {bar.display_order || 0} • {bar.message}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {bar.schedule_type === 'manual' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActiveMutation.mutate({ id: bar.id, is_active: !bar.is_active })}
                    >
                      {bar.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleEdit(bar)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(bar.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div
                className="p-3 rounded text-center"
                style={{
                  background: bar.background_type === 'gradient'
                    ? `linear-gradient(to right, ${bar.gradient_color_start}, ${bar.gradient_color_end})`
                    : bar.background_color,
                  color: bar.text_color,
                  fontFamily: bar.google_font
                }}
                dangerouslySetInnerHTML={{ 
                  __html: bar.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }}
              />
              {bar.recurring_schedule?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {bar.recurring_schedule.map((s, i) => (
                    <Badge key={i} variant="outline">{s.day} @ {s.time}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBar ? 'Edit' : 'New'} Announcement Bar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Name (Internal) *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="TikTok LIVE"
              />
            </div>
            <div>
              <Label>Message * (Supports emojis and **bold text**)</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="🔴 LIVE NOW - Join us at... Use **bold** for emphasis!"
                rows={2}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use **text** for bold • Emojis work perfectly 😊
              </p>
            </div>
            <div>
              <Label>Link URL</Label>
              <Input
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://pixelnutscreative.com/gonuts"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Background Type</Label>
                <Select value={formData.background_type} onValueChange={(v) => setFormData({ ...formData, background_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Google Font</Label>
                <Select value={formData.google_font} onValueChange={(v) => setFormData({ ...formData, google_font: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {GOOGLE_FONTS.map(font => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.background_type === 'solid' ? (
              <div>
                <Label>Background Color</Label>
                <Input type="color" value={formData.background_color} onChange={(e) => setFormData({ ...formData, background_color: e.target.value })} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gradient Start</Label>
                  <Input type="color" value={formData.gradient_color_start} onChange={(e) => setFormData({ ...formData, gradient_color_start: e.target.value })} />
                </div>
                <div>
                  <Label>Gradient End</Label>
                  <Input type="color" value={formData.gradient_color_end} onChange={(e) => setFormData({ ...formData, gradient_color_end: e.target.value })} />
                </div>
              </div>
            )}

            <div>
              <Label>Text Color</Label>
              <Input type="color" value={formData.text_color} onChange={(e) => setFormData({ ...formData, text_color: e.target.value })} />
            </div>

            <div>
              <Label>Schedule Type</Label>
              <Select value={formData.schedule_type} onValueChange={(v) => setFormData({ ...formData, schedule_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Toggle</SelectItem>
                  <SelectItem value="recurring">Recurring Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.schedule_type === 'recurring' && (
              <div>
                <Label>Add Schedule</Label>
                <div className="flex gap-2 mt-2">
                  <Select value={scheduleDay} onValueChange={setScheduleDay}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Day" /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addSchedule}>Add</Button>
                </div>
                {formData.recurring_schedule.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.recurring_schedule.map((s, i) => (
                      <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeSchedule(i)}>
                        {s.day} @ {s.time} PST ✕
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Priority (Higher = Shows First) *</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                If multiple banners are active, the highest priority one shows
              </p>
            </div>

            <div>
              <Label>Preview</Label>
              <div
                className="p-4 rounded text-center mt-2"
                style={{
                  background: backgroundPreview,
                  color: formData.text_color,
                  fontFamily: formData.google_font
                }}
                dangerouslySetInnerHTML={{ 
                  __html: (formData.message || 'Your message here').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }}
              />
            </div>

            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || !formData.message}
              className="w-full"
            >
              {editingBar ? 'Update' : 'Create'} Announcement Bar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}