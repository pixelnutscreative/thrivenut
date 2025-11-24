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
import { Plus, Trash2, Edit, Clock, Pill, Phone, PawPrint, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

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
    medication_schedule: [],
    vet_name: '',
    vet_phone: '',
    notes: ''
  });

  const { data: pets = [] } = useQuery({
    queryKey: ['pets'],
    queryFn: () => base44.entities.Pet.list('-created_date'),
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
      photo_url: '', feeding_schedule: [], medication_schedule: [],
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
      medication_schedule: pet.medication_schedule || [],
      vet_name: pet.vet_name || '',
      vet_phone: pet.vet_phone || '',
      notes: pet.notes || ''
    });
    setShowModal(true);
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
    </div>
  );
}