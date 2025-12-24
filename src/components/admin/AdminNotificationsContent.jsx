import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Eye, EyeOff, Users, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function AdminNotificationsContent() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    link: '',
    button_text: '',
    button_url: '',
    button_color: '#8b5cf6',
    allow_save: true,
    target_audience: 'all'
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return await base44.entities.Notification.filter({}, '-created_date');
    }
  });

  // Fetch read history for a specific notification
  const { data: readHistory = [] } = useQuery({
    queryKey: ['notificationHistory', showHistory],
    queryFn: async () => {
      if (!showHistory) return [];
      return await base44.entities.NotificationRead.filter({ notification_id: showHistory }, '-read_at');
    },
    enabled: !!showHistory
  });

  const createNotificationMutation = useMutation({
    mutationFn: (data) => {
      if (editingNotification) {
        return base44.entities.Notification.update(editingNotification.id, data);
      }
      return base44.entities.Notification.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowDialog(false);
      setEditingNotification(null);
      setFormData({ 
        title: '', 
        message: '', 
        link: '', 
        button_text: '',
        button_url: '',
        button_color: '#8b5cf6',
        allow_save: true,
        target_audience: 'all' 
      });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const toggleNotificationMutation = useMutation({
    mutationFn: ({ id, isActive }) => base44.entities.Notification.update(id, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.message) return;
    createNotificationMutation.mutate(formData);
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      link: notification.link || '',
      button_text: notification.button_text || '',
      button_url: notification.button_url || '',
      button_color: notification.button_color || '#8b5cf6',
      allow_save: notification.allow_save !== false,
      target_audience: notification.target_audience
    });
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Send announcements to users</CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={(open) => {
              setShowDialog(open);
              if (!open) {
                setEditingNotification(null);
                setFormData({ 
                  title: '', 
                  message: '', 
                  link: '', 
                  button_text: '',
                  button_url: '',
                  button_color: '#8b5cf6',
                  allow_save: true,
                  target_audience: 'all' 
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingNotification ? 'Edit Notification' : 'Create New Notification'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Notification title"
                    />
                  </div>
                  <div>
                    <Label>Message (Supports rich formatting)</Label>
                    <ReactQuill
                      value={formData.message}
                      onChange={(value) => setFormData({ ...formData, message: value })}
                      theme="snow"
                      modules={{
                        toolbar: [
                          ['bold', 'italic', 'underline', 'strike'],
                          ['link'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          [{ 'color': [] }, { 'background': [] }],
                          ['clean']
                        ]
                      }}
                    />
                  </div>
                  
                  <div className="border-t pt-4">
                    <Label className="font-semibold mb-2 block">Call-to-Action Button (Optional)</Label>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Button Text</Label>
                        <Input
                          value={formData.button_text}
                          onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                          placeholder="e.g., Learn More"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Button URL</Label>
                        <Input
                          value={formData.button_url}
                          onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <Label className="text-xs">Button Color</Label>
                      <input
                        type="color"
                        value={formData.button_color}
                        onChange={(e) => setFormData({ ...formData, button_color: e.target.value })}
                        className="w-12 h-8 rounded cursor-pointer"
                      />
                      <Input
                        value={formData.button_color}
                        onChange={(e) => setFormData({ ...formData, button_color: e.target.value })}
                        placeholder="#8b5cf6"
                        className="w-32"
                      />
                      {formData.button_text && (
                        <Button
                          size="sm"
                          style={{ backgroundColor: formData.button_color }}
                          className="text-white"
                        >
                          {formData.button_text}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="font-medium">Allow users to save this notification</Label>
                      <p className="text-xs text-gray-500">Users can save it to their notification history</p>
                    </div>
                    <Switch
                      checked={formData.allow_save}
                      onCheckedChange={(checked) => setFormData({ ...formData, allow_save: checked })}
                    />
                  </div>

                  <div>
                    <Label>Target Audience</Label>
                    <Select value={formData.target_audience} onValueChange={(v) => setFormData({ ...formData, target_audience: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="tiktok_users">TikTok Users Only</SelectItem>
                        <SelectItem value="admin">Admins Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSubmit} disabled={createNotificationMutation.isPending} className="w-full">
                    {createNotificationMutation.isPending ? 'Saving...' : editingNotification ? 'Update Notification' : 'Create Notification'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notif) => (
            <Card key={notif.id} className="border-2">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{notif.title}</span>
                    {notif.user_email && <span className="text-xs text-blue-600">Target: {notif.user_email}</span>}
                    {notif.type && <span className="text-xs text-gray-500">Type: {notif.type}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={notif.is_active ? 'default' : 'secondary'}>
                      {notif.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{notif.target_audience}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(notif)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleNotificationMutation.mutate({ id: notif.id, isActive: !notif.is_active })}
                    >
                      {notif.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowHistory(notif.id)}
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotificationMutation.mutate(notif.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: notif.message }} />
                {notif.button_text && notif.button_url && (
                  <Button
                    size="sm"
                    className="mt-2 text-white"
                    style={{ backgroundColor: notif.button_color || '#8b5cf6' }}
                    asChild
                  >
                    <a href={notif.button_url} target="_blank" rel="noopener noreferrer">
                      {notif.button_text}
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Read History Dialog */}
      <Dialog open={!!showHistory} onOpenChange={() => setShowHistory(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Read History</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {readHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No one has read this notification yet</p>
            ) : (
              readHistory.map((read) => (
                <div key={read.id} className="p-2 bg-gray-50 rounded flex justify-between text-sm">
                  <span>{read.user_email}</span>
                  <span className="text-gray-500">{new Date(read.read_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}