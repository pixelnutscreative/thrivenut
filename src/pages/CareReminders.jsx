import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit, Clock, Pill, Moon, Utensils, Heart, Calendar, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const reminderTypes = [
  { value: 'medication', label: 'Medication', icon: Pill, color: 'bg-pink-100 text-pink-700' },
  { value: 'bedtime', label: 'Bedtime', icon: Moon, color: 'bg-indigo-100 text-indigo-700' },
  { value: 'meal', label: 'Meal/Eating', icon: Utensils, color: 'bg-green-100 text-green-700' },
  { value: 'goodnight_message', label: 'Goodnight Message', icon: Heart, color: 'bg-purple-100 text-purple-700' },
  { value: 'checkup', label: 'Check In', icon: Bell, color: 'bg-blue-100 text-blue-700' },
  { value: 'appointment', label: 'Appointment', icon: Calendar, color: 'bg-amber-100 text-amber-700' },
  { value: 'exercise', label: 'Exercise/Activity', icon: Heart, color: 'bg-cyan-100 text-cyan-700' },
  { value: 'other', label: 'Other', icon: Bell, color: 'bg-gray-100 text-gray-700' }
];

const relationships = [
  { value: 'parent', label: 'Parent' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'child', label: 'Child' },
  { value: 'spouse', label: 'Spouse/Partner' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other_family', label: 'Other Family' },
  { value: 'friend', label: 'Friend' },
  { value: 'client', label: 'Client' }
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CareReminders() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [filterPerson, setFilterPerson] = useState('all');
  const [formData, setFormData] = useState({
    person_name: '',
    relationship: 'parent',
    reminder_type: 'medication',
    title: '',
    description: '',
    time: '',
    days: [],
    is_active: true,
    notes: ''
  });

  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: reminders = [] } = useQuery({
    queryKey: ['careReminders', user?.email],
    queryFn: () => base44.entities.CareReminder.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CareReminder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careReminders'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CareReminder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careReminders'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CareReminder.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['careReminders'] }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => base44.entities.CareReminder.update(id, { is_active: !isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['careReminders'] }),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingReminder(null);
    setFormData({
      person_name: '', relationship: 'parent', reminder_type: 'medication',
      title: '', description: '', time: '', days: [], is_active: true, notes: ''
    });
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      person_name: reminder.person_name || '',
      relationship: reminder.relationship || 'parent',
      reminder_type: reminder.reminder_type || 'medication',
      title: reminder.title || '',
      description: reminder.description || '',
      time: reminder.time || '',
      days: reminder.days || [],
      is_active: reminder.is_active !== false,
      notes: reminder.notes || ''
    });
    setShowModal(true);
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));
  };

  const handleSubmit = () => {
    if (editingReminder) {
      updateMutation.mutate({ id: editingReminder.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const uniquePeople = [...new Set(reminders.map(r => r.person_name))];

  const filteredReminders = reminders.filter(r => 
    filterPerson === 'all' || r.person_name === filterPerson
  );

  // Group by person
  const remindersByPerson = filteredReminders.reduce((acc, r) => {
    if (!acc[r.person_name]) acc[r.person_name] = [];
    acc[r.person_name].push(r);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Care Reminders</h1>
            <p className="text-gray-600 mt-1">Track caregiving tasks, medication times & goodnight messages</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
            <Plus className="w-4 h-4 mr-2" /> Add Reminder
          </Button>
        </div>

        {/* Filter by person */}
        {uniquePeople.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={filterPerson === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterPerson('all')}
            >
              All
            </Badge>
            {uniquePeople.map(person => (
              <Badge
                key={person}
                variant={filterPerson === person ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterPerson(person)}
              >
                {person}
              </Badge>
            ))}
          </div>
        )}

        {/* Reminders grouped by person */}
        <div className="space-y-6">
          {Object.entries(remindersByPerson).map(([personName, personReminders]) => (
            <Card key={personName}>
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-xl">
                <CardTitle>{personName}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {personReminders.map((reminder, index) => {
                      const typeConfig = reminderTypes.find(t => t.value === reminder.reminder_type);
                      const Icon = typeConfig?.icon || Bell;
                      return (
                        <motion.div
                          key={reminder.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-lg border ${reminder.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${typeConfig?.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{reminder.title}</h4>
                                {reminder.description && (
                                  <p className="text-sm text-gray-600">{reminder.description}</p>
                                )}
                                {reminder.time && (
                                  <p className="text-sm text-purple-600 flex items-center gap-1 mt-1">
                                    <Clock className="w-3 h-3" /> {reminder.time}
                                  </p>
                                )}
                                {reminder.days?.length > 0 && (
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {reminder.days.map(d => (
                                      <Badge key={d} variant="outline" className="text-xs">{d.slice(0, 3)}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Switch
                              checked={reminder.is_active}
                              onCheckedChange={() => toggleActiveMutation.mutate({ id: reminder.id, isActive: reminder.is_active })}
                            />
                          </div>
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(reminder)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm" className="text-red-500"
                              onClick={() => confirm('Delete this reminder?') && deleteMutation.mutate(reminder.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reminders.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No care reminders yet</h3>
            <p className="text-gray-500 mb-4">Add reminders for loved ones you're caring for</p>
            <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-2" /> Add Reminder</Button>
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReminder ? 'Edit Reminder' : 'Add Care Reminder'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Person's Name *</Label>
                <Input
                  placeholder="e.g., Mom, Grandpa Joe"
                  value={formData.person_name}
                  onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Select value={formData.relationship} onValueChange={(v) => setFormData({ ...formData, relationship: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {relationships.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reminder Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {reminderTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.value}
                      onClick={() => setFormData({ ...formData, reminder_type: type.value })}
                      className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                        formData.reminder_type === type.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g., Give blood pressure medication"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Additional details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Days</Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <div
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1 rounded-full border cursor-pointer text-sm ${
                      formData.days.includes(day) ? 'bg-purple-500 text-white border-purple-500' : 'border-gray-300'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.person_name || !formData.title} className="bg-purple-600 hover:bg-purple-700">
              {editingReminder ? 'Update' : 'Add Reminder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}