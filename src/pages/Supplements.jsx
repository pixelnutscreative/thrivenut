import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pill, CheckCircle2, Circle, Trash2, Edit, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import SupplementForm from '../components/supplements/SupplementForm';
import SupplementChecklistItem from '../components/supplements/SupplementChecklistItem';

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

export default function Supplements() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  const { data: supplements = [] } = useQuery({
    queryKey: ['supplements'],
    queryFn: () => base44.entities.Supplement.filter({ is_active: true }),
    initialData: [],
  });

  const { data: todaysLogs = [] } = useQuery({
    queryKey: ['supplementLogs', today],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.SupplementLog.filter({ date: today, created_by: user.email });
    },
    initialData: [],
  });

  const createSupplementMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
      setShowForm(false);
      setEditingSupplement(null);
    },
  });

  const updateSupplementMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Supplement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
      setShowForm(false);
      setEditingSupplement(null);
    },
  });

  const deleteSupplementMutation = useMutation({
    mutationFn: (id) => base44.entities.Supplement.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
    },
  });

  const logSupplementMutation = useMutation({
    mutationFn: (data) => base44.entities.SupplementLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplementLogs', today] });
    },
  });

  const handleEdit = (supplement) => {
    setEditingSupplement(supplement);
    setShowForm(true);
  };

  const handleLogSupplement = (supplementId) => {
    logSupplementMutation.mutate({
      supplement_id: supplementId,
      date: today,
      time_taken: new Date().toLocaleTimeString(),
      marked_as_taken: true
    });
  };

  const isSupplementTaken = (supplementId) => {
    return todaysLogs.some(log => log.supplement_id === supplementId && log.marked_as_taken);
  };

  // Group supplements by time category
  const groupedSupplements = supplements.reduce((acc, supp) => {
    const category = supp.time_category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(supp);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Supplements & Vitamins</h1>
            <p className="text-gray-600 mt-1">Track your daily supplements and vitamins</p>
          </div>
          <Button
            onClick={() => {
              setEditingSupplement(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Supplement
          </Button>
        </div>

        {/* Today's Checklist */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Today's Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {supplements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No supplements added yet. Add your first supplement to get started!</p>
            ) : (
              <div className="space-y-3">
                {supplements.map((supplement) => (
                  <SupplementChecklistItem
                    key={supplement.id}
                    supplement={supplement}
                    isTaken={isSupplementTaken(supplement.id)}
                    onLog={() => handleLogSupplement(supplement.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplements by Time Category */}
        {Object.keys(groupedSupplements).map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Pill className="w-5 h-5 text-purple-500" />
                {timeCategories[category] || category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {groupedSupplements[category].map((supplement, index) => (
                  <motion.div
                    key={supplement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{supplement.name}</h3>
                        <p className="text-sm text-gray-600">{supplement.dosage}</p>
                        <Badge className="mt-2 bg-purple-100 text-purple-700">
                          {supplement.frequency?.replace('_', ' ')}
                        </Badge>
                      </div>
                      {supplement.label_image_url && (
                        <Camera className="w-5 h-5 text-purple-400" />
                      )}
                    </div>

                    {supplement.notes && (
                      <div className="mb-3 p-2 bg-white rounded text-sm text-gray-700">
                        <strong>Notes:</strong> {supplement.notes}
                      </div>
                    )}

                    {supplement.other_time_category && (
                      <p className="text-xs text-gray-500 mb-3">
                        Custom timing: {supplement.other_time_category}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(supplement)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSupplementMutation.mutate(supplement.id)}
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

        {/* General Health Tip */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700">
              <strong>💡 General Wellness Tip:</strong> Avoid taking caffeine-containing supplements close to bedtime as they may interfere with sleep. Always consult with your healthcare provider about supplement timing and dosages.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <SupplementForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingSupplement(null);
          }}
          supplement={editingSupplement}
          onSave={(data) => {
            if (editingSupplement) {
              updateSupplementMutation.mutate({ id: editingSupplement.id, data });
            } else {
              createSupplementMutation.mutate(data);
            }
          }}
        />
      )}
    </div>
  );
}