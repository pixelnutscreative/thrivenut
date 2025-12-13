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
import { Plus, Trash2, Bell } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminNotificationsContent({ userEmail }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    link: '',
    target_audience: 'all',
    is_active: true
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date'),
  });

  const { data: allReads = [] } = useQuery({
    queryKey: ['allNotificationReads'],
    queryFn: () => base44.entities.NotificationRead.list('-created_date'),
    enabled: showHistory,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.create({ ...data, created_by: userEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowDialog(false);
      setFormData({ title: '', message: '', link: '', target_audience: 'all', is_active: true });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Notification.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Push Notifications</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? 'Hide History' : 'View History'}
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Notification
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {notifications.map(notification => (
          <Card key={notification.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Bell className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <Badge variant={notification.is_active ? 'default' : 'secondary'}>
                        {notification.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{notification.target_audience}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    {notification.link && (
                      <a href={notification.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                        {notification.link}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActiveMutation.mutate({ id: notification.id, is_active: !notification.is_active })}
                  >
                    {notification.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(notification.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showHistory && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notification Read History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allReads.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No read history yet</p>
              ) : (
                allReads.map(read => {
                  const notification = notifications.find(n => n.id === read.notification_id);
                  return (
                    <div key={read.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notification?.title || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">
                          Read by: {read.user_email} on {format(new Date(read.read_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="New feature available!"
              />
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Check out our new Creator Command Center..."
                rows={3}
              />
            </div>
            <div>
              <Label>Link (Optional)</Label>
              <Input
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Target Audience</Label>
              <Select value={formData.target_audience} onValueChange={(v) => setFormData({ ...formData, target_audience: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="tiktok_users">TikTok Users Only</SelectItem>
                  <SelectItem value="admin">Admin Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.title || !formData.message}
              className="w-full"
            >
              Send Notification
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}