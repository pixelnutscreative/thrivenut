import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Brain, Plus, X, Loader2, Heart, Phone, Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MentalHealth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [newCondition, setNewCondition] = useState('');
  const [formData, setFormData] = useState({
    conditions: [],
    diagnosed_by: '',
    diagnosis_date: '',
    treatment_plan: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    therapist_name: '',
    therapist_phone: '',
    require_medication_before_features: false,
    restricted_features: [],
    notes: ''
  });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['mentalHealthProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.MentalHealthProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        conditions: profile.conditions || [],
        diagnosed_by: profile.diagnosed_by || '',
        diagnosis_date: profile.diagnosis_date || '',
        treatment_plan: profile.treatment_plan || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        therapist_name: profile.therapist_name || '',
        therapist_phone: profile.therapist_phone || '',
        require_medication_before_features: profile.require_medication_before_features || false,
        restricted_features: profile.restricted_features || [],
        notes: profile.notes || ''
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) {
        return base44.entities.MentalHealthProfile.update(profile.id, data);
      } else {
        return base44.entities.MentalHealthProfile.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentalHealthProfile'] });
      setEditing(false);
    },
  });

  const addCondition = () => {
    if (newCondition.trim() && !formData.conditions.includes(newCondition.trim())) {
      setFormData({
        ...formData,
        conditions: [...formData.conditions, newCondition.trim()]
      });
      setNewCondition('');
    }
  };

  const removeCondition = (condition) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter(c => c !== condition)
    });
  };

  const toggleRestrictedFeature = (feature) => {
    setFormData({
      ...formData,
      restricted_features: formData.restricted_features.includes(feature)
        ? formData.restricted_features.filter(f => f !== feature)
        : [...formData.restricted_features, feature]
    });
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-600" />
              Mental Health Profile
            </h1>
            <p className="text-gray-600 mt-1">Private information for your wellness journey</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing(true)} className="bg-purple-600 hover:bg-purple-700">
              {profile ? 'Edit Profile' : 'Set Up Profile'}
            </Button>
          )}
        </div>

        {/* Privacy Notice */}
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900">Your Privacy Matters</p>
              <p className="text-sm text-purple-700">
                This information is completely private and only visible to you. 
                It's meant to help you track your wellness journey.
              </p>
            </div>
          </CardContent>
        </Card>

        {editing ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a condition..."
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                  />
                  <Button onClick={addCondition} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.conditions.map(condition => (
                    <Badge key={condition} variant="secondary" className="px-3 py-1">
                      {condition}
                      <button onClick={() => removeCondition(condition)} className="ml-2">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Diagnosed By</Label>
                    <Input
                      placeholder="Healthcare provider name"
                      value={formData.diagnosed_by}
                      onChange={(e) => setFormData({ ...formData, diagnosed_by: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Diagnosis Date</Label>
                    <Input
                      type="date"
                      value={formData.diagnosis_date}
                      onChange={(e) => setFormData({ ...formData, diagnosis_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Treatment Plan Notes</Label>
                  <Textarea
                    placeholder="General notes about your treatment plan..."
                    value={formData.treatment_plan}
                    onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Emergency Contact Name</Label>
                    <Input
                      placeholder="Name"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Contact Phone</Label>
                    <Input
                      placeholder="Phone number"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Therapist/Counselor Name</Label>
                    <Input
                      placeholder="Name"
                      value={formData.therapist_name}
                      onChange={(e) => setFormData({ ...formData, therapist_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Therapist Phone</Label>
                    <Input
                      placeholder="Phone number"
                      value={formData.therapist_phone}
                      onChange={(e) => setFormData({ ...formData, therapist_phone: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Restrictions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Medication Check-In
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => setFormData({ ...formData, require_medication_before_features: !formData.require_medication_before_features })}
                >
                  <Checkbox checked={formData.require_medication_before_features} />
                  <div>
                    <p className="font-medium">Require medication check-in before certain features</p>
                    <p className="text-sm text-gray-500">Help remind yourself to take medications before using selected features</p>
                  </div>
                </div>

                {formData.require_medication_before_features && (
                  <div className="space-y-2 pl-4">
                    <Label>Select features to restrict:</Label>
                    {['tiktok', 'social', 'goals', 'journal'].map(feature => (
                      <div 
                        key={feature}
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleRestrictedFeature(feature)}
                      >
                        <Checkbox checked={formData.restricted_features.includes(feature)} />
                        <span className="capitalize">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Any other notes about your mental health journey..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saveMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Profile
              </Button>
            </div>
          </motion.div>
        ) : profile ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* View Mode */}
            {profile.conditions?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">My Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.conditions.map(condition => (
                      <Badge key={condition} className="bg-purple-100 text-purple-700">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                  {profile.diagnosed_by && (
                    <p className="text-sm text-gray-600 mt-3">
                      Diagnosed by: {profile.diagnosed_by}
                      {profile.diagnosis_date && ` on ${profile.diagnosis_date}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {(profile.emergency_contact_name || profile.therapist_name) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.emergency_contact_name && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="font-medium text-red-900">Emergency Contact</p>
                      <p className="text-red-700">{profile.emergency_contact_name}</p>
                      {profile.emergency_contact_phone && (
                        <a href={`tel:${profile.emergency_contact_phone}`} className="text-red-600 underline">
                          {profile.emergency_contact_phone}
                        </a>
                      )}
                    </div>
                  )}
                  {profile.therapist_name && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-900">Therapist/Counselor</p>
                      <p className="text-blue-700">{profile.therapist_name}</p>
                      {profile.therapist_phone && (
                        <a href={`tel:${profile.therapist_phone}`} className="text-blue-600 underline">
                          {profile.therapist_phone}
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {profile.treatment_plan && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Treatment Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.treatment_plan}</p>
                </CardContent>
              </Card>
            )}

            {profile.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.notes}</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No mental health profile set up yet</p>
              <p className="text-sm text-gray-400 mt-2">
                This is optional and completely private
              </p>
            </CardContent>
          </Card>
        )}

        {/* Crisis Resources */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="font-medium text-red-900 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Crisis Resources
            </p>
            <div className="mt-2 space-y-1 text-sm text-red-700">
              <p>• National Suicide Prevention Lifeline: <a href="tel:988" className="underline font-medium">988</a></p>
              <p>• Crisis Text Line: Text HOME to <span className="font-medium">741741</span></p>
              <p>• National Alliance on Mental Illness: <a href="tel:1-800-950-6264" className="underline font-medium">1-800-950-NAMI</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}