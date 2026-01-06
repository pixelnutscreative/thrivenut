import React, { useState } from 'react';
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
import { Plus, Trash2, Edit, Clock, Pill, Phone, PawPrint, Camera, CheckCircle, Circle, History, Dog, Calendar } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import QuickPetCareCheck from '../components/wellness/QuickPetCareCheck';

const activityTypes = [
  { value: 'walk', label: '🚶 Walk', icon: Dog },
  { value: 'playtime', label: '🎾 Playtime', icon: Dog },
  { value: 'outdoor_time', label: '🌳 Outdoor Time', icon: Dog },
  { value: 'training', label: '🎓 Training', icon: Dog },
  { value: 'grooming', label: '✂️ Grooming', icon: Dog },
  { value: 'other', label: '🐾 Other', icon: Dog }
];

const petTypes = [
  { value: 'dog', label: '🐕 Dog' },
  { value: 'cat', label: '🐱 Cat' },
  { value: 'bird', label: '🐦 Bird' },
  { value: 'fish', label: '🐠 Fish' },
  { value: 'reptile', label: '🦎 Reptile' },
  { value: 'rabbit', label: '🐰 Rabbit' },
  { value: 'hamster', label: '🐹 Hamster' },
  { value: 'other', label: '🐾 Other' }
];

export default function PetCare() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'dog',
    other_type: '',
    breed: '',
    birthday: '',
    photo_url: '',
    feeding_schedule: [],
    activity_schedule: [],
    medication_schedule: [],
    vet_name: '',
    vet_phone: '',
    notes: ''
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPetForHistory, setSelectedPetForHistory] = useState(null);

  const [user, setUser] = useState(null);
  
  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: pets = [] } = useQuery({
    queryKey: ['pets', user?.email],
    queryFn: () => base44.entities.Pet.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todaysActivityLogs = [] } = useQuery({
    queryKey: ['petActivityLogs', today, user?.email],
    queryFn: () => base44.entities.PetActivityLog.filter({ date: today, created_by: user.email }),
    enabled: !!user,
  });

  const { data: allActivityLogs = [] } = useQuery({
    queryKey: ['petActivityLogs', selectedPetForHistory?.id],
    queryFn: () => base44.entities.PetActivityLog.filter({ pet_id: selectedPetForHistory?.id }, '-date', 50),
    enabled: !!selectedPetForHistory,
  });

  const logActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.PetActivityLog.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['petActivityLogs'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Pet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pet.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Pet.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pets'] }),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingPet(null);
    setFormData({
      name: '', type: 'dog', other_type: '', breed: '', birthday: '',
      photo_url: '', feeding_schedule: [], activity_schedule: [], medication_schedule: [],
      vet_name: '', vet_phone: '', notes: ''
    });
  };

  const handleEdit = (pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name || '',
      type: pet.type || 'dog',
      other_type: pet.other_type || '',
      breed: pet.breed || '',
      birthday: pet.birthday || '',
      photo_url: pet.photo_url || '',
      feeding_schedule: pet.feeding_schedule || [],
      activity_schedule: pet.activity_schedule || [],
      medication_schedule: pet.medication_schedule || [],
      vet_name: pet.vet_name || '',
      vet_phone: pet.vet_phone || '',
      notes: pet.notes || ''
    });
    setShowModal(true);
  };

  // Activity schedule functions
  const addActivity = () => {
    setFormData({
      ...formData,
      activity_schedule: [...formData.activity_schedule, { activity_type: 'walk', times_per_day: 1, preferred_time: '', duration_minutes: 30, notes: '' }]
    });
  };

  const updateActivity = (index, field, value) => {
    const updated = [...formData.activity_schedule];
    updated[index][field] = value;
    setFormData({ ...formData, activity_schedule: updated });
  };

  const removeActivity = (index) => {
    setFormData({
      ...formData,
      activity_schedule: formData.activity_schedule.filter((_, i) => i !== index)
    });
  };

  // Check if activity is completed today
  const getActivityCompletedCount = (petId, activityType) => {
    return todaysActivityLogs.filter(log => log.pet_id === petId && log.activity_type === activityType).length;
  };

  const handleLogActivity = (pet, activity) => {
    logActivityMutation.mutate({
      pet_id: pet.id,
      pet_name: pet.name,
      activity_type: activity.activity_type,
      date: today,
      time_completed: format(new Date(), 'HH:mm'),
      duration_minutes: activity.duration_minutes,
      notes: ''
    });
  };

  const openHistory = (pet) => {
    setSelectedPetForHistory(pet);
    setShowHistoryModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, photo_url: file_url });
    setUploading(false);
  };

  const addFeedingTime = () => {
    setFormData({
      ...formData,
      feeding_schedule: [...formData.feeding_schedule, { time: '', food_type: '', amount: '' }]
    });
  };

  const updateFeeding = (index, field, value) => {
    const updated = [...formData.feeding_schedule];
    updated[index][field] = value;
    setFormData({ ...formData, feeding_schedule: updated });
  };

  const removeFeeding = (index) => {
    setFormData({
      ...formData,
      feeding_schedule: formData.feeding_schedule.filter((_, i) => i !== index)
    });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medication_schedule: [...formData.medication_schedule, { name: '', time: '', dosage: '', frequency: '' }]
    });
  };

  const updateMedication = (index, field, value) => {
    const updated = [...formData.medication_schedule];
    updated[index][field] = value;
    setFormData({ ...formData, medication_schedule: updated });
  };

  const removeMedication = (index) => {
    setFormData({
      ...formData,
      medication_schedule: formData.medication_schedule.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = () => {
    if (editingPet) {
      updateMutation.mutate({ id: editingPet.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getPetEmoji = (type) => petTypes.find(t => t.value === type)?.label?.split(' ')[0] || '🐾';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Pet Care</h1>
            <p className="text-gray-600 mt-1">Manage feeding schedules, medications & more</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
            <Plus className="w-4 h-4 mr-2" /> Add Pet
          </Button>
        </div>

        {/* Quick Check List moved here from Wellness */}
        <div className="mb-6">
          <QuickPetCareCheck userEmail={user?.email} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {pets.map((pet, index) => (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  {pet.photo_url && (
                    <div className="h-48 overflow-hidden">
                      <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className={!pet.photo_url ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : ''}>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{getPetEmoji(pet.type)}</span>
                      {pet.name}
                    </CardTitle>
                    {pet.breed && <p className="text-sm opacity-80">{pet.breed}</p>}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {pet.birthday && (
                      <p className="text-sm text-gray-600">🎂 {format(new Date(pet.birthday), 'MMM d, yyyy')}</p>
                    )}

                    {pet.feeding_schedule?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> Feeding Schedule
                        </h4>
                        <div className="space-y-1">
                          {pet.feeding_schedule.map((f, i) => (
                            <Badge key={i} variant="outline" className="mr-1">
                              {f.time} - {f.food_type} ({f.amount})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {pet.activity_schedule?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <Dog className="w-4 h-4" /> Daily Activities
                        </h4>
                        <div className="space-y-2">
                          {pet.activity_schedule.map((a, i) => {
                            const completed = getActivityCompletedCount(pet.id, a.activity_type);
                            const target = a.times_per_day || 1;
                            const isFullyDone = completed >= target;
                            const actLabel = activityTypes.find(t => t.value === a.activity_type)?.label || a.activity_type;
                            return (
                              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleLogActivity(pet, a)}
                                    disabled={isFullyDone}
                                    className="flex-shrink-0"
                                  >
                                    {isFullyDone ? (
                                      <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-gray-300 hover:text-purple-500" />
                                    )}
                                  </button>
                                  <span className={`text-sm ${isFullyDone ? 'line-through text-gray-400' : ''}`}>
                                    {actLabel}
                                  </span>
                                </div>
                                <Badge variant="outline" className={isFullyDone ? 'bg-green-100' : ''}>
                                  {completed}/{target}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {pet.medication_schedule?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <Pill className="w-4 h-4" /> Medications
                        </h4>
                        <div className="space-y-1">
                          {pet.medication_schedule.map((m, i) => (
                            <Badge key={i} variant="outline" className="mr-1 bg-pink-50">
                              {m.name} - {m.dosage}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {pet.vet_name && (
                      <div className="text-sm">
                        <p className="font-semibold">Vet: {pet.vet_name}</p>
                        {pet.vet_phone && (
                          <a href={`tel:${pet.vet_phone}`} className="text-purple-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {pet.vet_phone}
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(pet)}>
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openHistory(pet)}>
                        <History className="w-4 h-4 mr-1" /> History
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="text-red-500"
                        onClick={() => confirm('Delete this pet?') && deleteMutation.mutate(pet.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {pets.length === 0 && (
          <div className="text-center py-12">
            <PawPrint className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No pets yet</h3>
            <p className="text-gray-500 mb-4">Add your furry (or scaly) friends!</p>
            <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-2" /> Add Pet</Button>
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPet ? 'Edit Pet' : 'Add Pet'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="flex items-center gap-4">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="Pet" className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {petTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'other' && (
              <div className="space-y-2">
                <Label>What kind of pet?</Label>
                <Input value={formData.other_type} onChange={(e) => setFormData({ ...formData, other_type: e.target.value })} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Breed</Label>
                <Input value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Birthday</Label>
                <Input type="date" value={formData.birthday} onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} />
              </div>
            </div>

            {/* Feeding Schedule */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Feeding Schedule</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFeedingTime}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {formData.feeding_schedule.map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input type="time" value={f.time} onChange={(e) => updateFeeding(i, 'time', e.target.value)} className="w-24" />
                  <Input placeholder="Food type" value={f.food_type} onChange={(e) => updateFeeding(i, 'food_type', e.target.value)} />
                  <Input placeholder="Amount" value={f.amount} onChange={(e) => updateFeeding(i, 'amount', e.target.value)} className="w-24" />
                  <Button variant="ghost" size="sm" onClick={() => removeFeeding(i)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              ))}
            </div>

            {/* Activity Schedule */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Activity Schedule (Walks, Playtime, etc.)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addActivity}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {formData.activity_schedule.map((a, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex gap-2 items-center">
                    <Select value={a.activity_type} onValueChange={(v) => updateActivity(i, 'activity_type', v)}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {activityTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input 
                      type="number" 
                      placeholder="Times/day" 
                      value={a.times_per_day} 
                      onChange={(e) => updateActivity(i, 'times_per_day', parseInt(e.target.value) || 1)} 
                      className="w-24" 
                    />
                    <span className="text-sm text-gray-500">x/day</span>
                    <Button variant="ghost" size="sm" onClick={() => removeActivity(i)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="time" 
                      value={a.preferred_time} 
                      onChange={(e) => updateActivity(i, 'preferred_time', e.target.value)} 
                      className="w-28" 
                      placeholder="Time"
                    />
                    <Input 
                      type="number" 
                      placeholder="Duration" 
                      value={a.duration_minutes} 
                      onChange={(e) => updateActivity(i, 'duration_minutes', parseInt(e.target.value) || 0)} 
                      className="w-20" 
                    />
                    <span className="text-sm text-gray-500">mins</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Medications */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Medications</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {formData.medication_schedule.map((m, i) => (
                <div key={i} className="flex gap-2 items-center flex-wrap">
                  <Input placeholder="Medication name" value={m.name} onChange={(e) => updateMedication(i, 'name', e.target.value)} />
                  <Input placeholder="Dosage" value={m.dosage} onChange={(e) => updateMedication(i, 'dosage', e.target.value)} className="w-24" />
                  <Input type="time" value={m.time} onChange={(e) => updateMedication(i, 'time', e.target.value)} className="w-24" />
                  <Button variant="ghost" size="sm" onClick={() => removeMedication(i)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vet Name</Label>
                <Input value={formData.vet_name} onChange={(e) => setFormData({ ...formData, vet_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Vet Phone</Label>
                <Input value={formData.vet_phone} onChange={(e) => setFormData({ ...formData, vet_phone: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.name} className="bg-purple-600 hover:bg-purple-700">
              {editingPet ? 'Update' : 'Add Pet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={() => setShowHistoryModal(false)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity History - {selectedPetForHistory?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {allActivityLogs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No activity history yet</p>
            ) : (
              allActivityLogs.map((log) => {
                const actLabel = activityTypes.find(t => t.value === log.activity_type)?.label || log.activity_type;
                return (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{actLabel}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(log.date), 'MMM d, yyyy')} at {log.time_completed}
                        {log.duration_minutes && ` • ${log.duration_minutes} mins`}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}