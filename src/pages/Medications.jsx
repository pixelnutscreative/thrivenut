import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pill, CheckCircle2, Circle, Trash2, Edit, Camera, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import MedicationForm from '../components/medications/MedicationForm';
import MedicationChecklistItem from '../components/medications/MedicationChecklistItem';

const timeCategories = {
  upon_awakening: 'Upon Awakening',
  with_breakfast: 'With Breakfast',
  morning_snack: 'Morning Snack',
  '30_min_before_lunch': '30 Min Before Lunch',
  with_lunch: 'With Lunch',
  afternoon_snack: 'Afternoon Snack',
  with_dinner: 'With Dinner',
  before_bed: 'Before Bed',
  empty_stomach_morning: 'Empty Stomach (Morning)',
  empty_stomach_evening: 'Empty Stomach (Evening)',
  other: 'Other'
};

export default function Medications() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  const { data: medications = [] } = useQuery({
    queryKey: ['medications'],
    queryFn: () => base44.entities.Medication.filter({ is_active: true }),
    initialData: [],
  });

  const { data: todaysLogs = [] } = useQuery({
    queryKey: ['medicationLogs', today],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.MedicationLog.filter({ date: today, created_by: user.email });
    },
    initialData: [],
  });

  const createMedicationMutation = useMutation({
    mutationFn: (data) => base44.entities.Medication.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setShowForm(false);
      setEditingMedication(null);
    },
  });

  const updateMedicationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Medication.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setShowForm(false);
      setEditingMedication(null);
    },
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: (id) => base44.entities.Medication.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });

  const logMedicationMutation = useMutation({
    mutationFn: (data) => base44.entities.MedicationLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationLogs', today] });
    },
  });

  const handleEdit = (medication) => {
    setEditingMedication(medication);
    setShowForm(true);
  };

  const handleLogMedication = (medicationId) => {
    logMedicationMutation.mutate({
      medication_id: medicationId,
      date: today,
      time_taken: new Date().toLocaleTimeString(),
      marked_as_taken: true
    });
  };

  const isMedicationTaken = (medicationId) => {
    return todaysLogs.some(log => log.medication_id === medicationId && log.marked_as_taken);
  };

  // Group medications by time category
  const groupedMedications = medications.reduce((acc, med) => {
    const category = med.time_category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(med);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Medications</h1>
            <p className="text-gray-600 mt-1">Track your prescription medications</p>
          </div>
          <Button
            onClick={() => {
              setEditingMedication(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Medication
          </Button>
        </div>

        {/* Important Disclaimer */}
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Important Disclaimer</p>
                <p>This medication tracker is for personal record-keeping only. Always consult with your healthcare provider regarding medication dosages, timing, and any concerns. The information you enter is your responsibility. This app does not provide medical advice.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Checklist */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Today's Medication Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {medications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No medications added yet. Add your first medication to get started!</p>
            ) : (
              <div className="space-y-3">
                {medications.map((medication) => (
                  <MedicationChecklistItem
                    key={medication.id}
                    medication={medication}
                    isTaken={isMedicationTaken(medication.id)}
                    onLog={() => handleLogMedication(medication.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medications by Time Category */}
        {Object.keys(groupedMedications).map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Pill className="w-5 h-5 text-purple-500" />
                {timeCategories[category] || category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {groupedMedications[category].map((medication, index) => (
                  <motion.div
                    key={medication.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{medication.name}</h3>
                        <p className="text-sm text-gray-600">{medication.dosage}</p>
                        <Badge className="mt-2 bg-purple-100 text-purple-700">
                          {medication.frequency?.replace('_', ' ')}
                        </Badge>
                      </div>
                      {medication.label_image_url && (
                        <Camera className="w-5 h-5 text-purple-400" />
                      )}
                    </div>

                    {medication.prescribing_doctor && (
                      <p className="text-xs text-gray-600 mb-2">
                        Prescribed by: {medication.prescribing_doctor}
                      </p>
                    )}

                    {medication.notes && (
                      <div className="mb-3 p-2 bg-white rounded text-sm text-gray-700">
                        <strong>Notes:</strong> {medication.notes}
                      </div>
                    )}

                    {medication.other_time_category && (
                      <p className="text-xs text-gray-500 mb-3">
                        Custom timing: {medication.other_time_category}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(medication)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMedicationMutation.mutate(medication.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <MedicationForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingMedication(null);
          }}
          medication={editingMedication}
          onSave={(data) => {
            if (editingMedication) {
              updateMedicationMutation.mutate({ id: editingMedication.id, data });
            } else {
              createMedicationMutation.mutate(data);
            }
          }}
        />
      )}
    </div>
  );
}