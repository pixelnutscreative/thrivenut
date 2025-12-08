import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Briefcase, Clock, MapPin, Calendar, Trash2, Edit } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WorkSchedules() {
  const queryClient = useQueryClient();
  const { isDark, bgClass, primaryColor, textClass, cardBgClass } = useTheme();
  const [showDialog, setShowDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [formData, setFormData] = useState({
    job_title: '',
    employer: '',
    work_location: 'office',
    address: '',
    commute_minutes: 0,
    schedule_type: 'fixed',
    regular_hours: [],
    show_on_dashboard: true,
    suggest_commute_content: false,
    is_primary_job: true,
    is_active: true
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['workSchedules'],
    queryFn: () => base44.entities.WorkSchedule.list('-updated_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workSchedules'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkSchedule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workSchedules'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkSchedule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workSchedules'] })
  });

  const resetForm = () => {
    setFormData({
      job_title: '',
      employer: '',
      work_location: 'office',
      address: '',
      commute_minutes: 0,
      schedule_type: 'fixed',
      regular_hours: [],
      show_on_dashboard: true,
      suggest_commute_content: false,
      is_primary_job: true,
      is_active: true
    });
    setEditingJob(null);
    setShowDialog(false);
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData(job);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingJob) {
      updateMutation.mutate({ id: editingJob.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addWorkDay = () => {
    setFormData({
      ...formData,
      regular_hours: [
        ...formData.regular_hours,
        { day: 'Monday', start_time: '09:00', end_time: '17:00' }
      ]
    });
  };

  const updateWorkDay = (index, field, value) => {
    const updated = [...formData.regular_hours];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, regular_hours: updated });
  };

  const removeWorkDay = (index) => {
    setFormData({
      ...formData,
      regular_hours: formData.regular_hours.filter((_, i) => i !== index)
    });
  };

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${textClass}`}>Work Schedules</h1>
            <p className="text-gray-500 mt-1">Manage your work hours and commute</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: primaryColor }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingJob ? 'Edit Job' : 'Add Job'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Job Title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                />
                <Input
                  placeholder="Employer"
                  value={formData.employer}
                  onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select value={formData.work_location} onValueChange={(v) => setFormData({ ...formData, work_location: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="on_site">On Site</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={formData.schedule_type} onValueChange={(v) => setFormData({ ...formData, schedule_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Schedule</SelectItem>
                      <SelectItem value="rotating">Rotating</SelectItem>
                      <SelectItem value="on_call">On Call</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.work_location !== 'home' && formData.work_location !== 'remote' && (
                  <>
                    <Input
                      placeholder="Work Address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Commute Minutes (one way)"
                      value={formData.commute_minutes}
                      onChange={(e) => setFormData({ ...formData, commute_minutes: parseInt(e.target.value) || 0 })}
                    />
                  </>
                )}

                {formData.schedule_type === 'fixed' && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Work Hours</h3>
                      <Button size="sm" onClick={addWorkDay}>Add Day</Button>
                    </div>
                    {formData.regular_hours.map((day, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Select value={day.day} onValueChange={(v) => updateWorkDay(idx, 'day', v)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="time"
                          value={day.start_time}
                          onChange={(e) => updateWorkDay(idx, 'start_time', e.target.value)}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={day.end_time}
                          onChange={(e) => updateWorkDay(idx, 'end_time', e.target.value)}
                          className="w-32"
                        />
                        <Button size="icon" variant="ghost" onClick={() => removeWorkDay(idx)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.show_on_dashboard}
                      onCheckedChange={(checked) => setFormData({ ...formData, show_on_dashboard: checked })}
                    />
                    <label className="text-sm">Show on My Day dashboard</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.suggest_commute_content}
                      onCheckedChange={(checked) => setFormData({ ...formData, suggest_commute_content: checked })}
                    />
                    <label className="text-sm">Suggest content during commute</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.is_primary_job}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_primary_job: checked })}
                    />
                    <label className="text-sm">Primary job</label>
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full" style={{ backgroundColor: primaryColor }}>
                  {editingJob ? 'Update Job' : 'Add Job'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map(job => (
            <Card key={job.id} className={cardBgClass}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" style={{ color: primaryColor }} />
                      {job.job_title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{job.employer}</p>
                  </div>
                  {job.is_primary_job && (
                    <Badge style={{ backgroundColor: primaryColor }}>Primary</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="capitalize">{job.work_location.replace('_', ' ')}</span>
                </div>
                {job.commute_minutes > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{job.commute_minutes} min commute</span>
                  </div>
                )}
                {job.regular_hours?.length > 0 && (
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">Schedule:</span>
                    </div>
                    {job.regular_hours.map((day, idx) => (
                      <div key={idx} className="ml-6 text-gray-600">
                        {day.day}: {day.start_time} - {day.end_time}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(job)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(job.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {jobs.length === 0 && (
          <Card className={cardBgClass}>
            <CardContent className="py-12 text-center text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No jobs added yet. Add your work schedule!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}