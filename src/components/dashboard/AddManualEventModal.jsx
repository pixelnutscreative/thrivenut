import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, AlertTriangle, Link as LinkIcon, Save, Loader2 } from 'lucide-react';

export default function AddManualEventModal({ isOpen, onClose, userEmail }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    platform: 'TikTok',
    host_username: '',
    link: '',
    is_urgent: true,
    notes: ''
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.ExternalEvent.create({
      ...data,
      created_by: userEmail
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalEvents'] });
      queryClient.invalidateQueries({ queryKey: ['myDay'] }); // Assuming MyDay uses this key or similar
      onClose();
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        platform: 'TikTok',
        host_username: '',
        link: '',
        is_urgent: true,
        notes: ''
      });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add External Event</DialogTitle>
          <DialogDescription>
            Manually add a battle, special live, or event you don't want to miss.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Event Title</Label>
            <Input 
              placeholder="e.g. Pixel's Big Battle" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input 
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData({...formData, platform: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Discord">Discord</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Host Username</Label>
              <Input 
                placeholder="@username"
                value={formData.host_username}
                onChange={(e) => setFormData({...formData, host_username: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Link (Optional)</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                className="pl-9"
                placeholder="https://..."
                value={formData.link}
                onChange={(e) => setFormData({...formData, link: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              placeholder="Details about the event..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="flex items-center space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <Checkbox 
              id="urgent" 
              checked={formData.is_urgent}
              onCheckedChange={(c) => setFormData({...formData, is_urgent: c})}
            />
            <label
              htmlFor="urgent"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-amber-800 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Mark as Urgent / Must Attend
            </label>
          </div>

          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            onClick={() => createEventMutation.mutate(formData)}
            disabled={!formData.title || createEventMutation.isPending}
          >
            {createEventMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}