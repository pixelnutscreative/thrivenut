import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Shield, Users, Save, Sparkles } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

const ALL_MODULES = [
  { id: 'journal', label: 'Journal (Kids Journal)' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'habits', label: 'Habits' },
  { id: 'wellness', label: 'Daily Wellness' },
];

export default function KidControls() {
  const queryClient = useQueryClient();
  const { bgClass, cardBgClass, textClass, subtextClass, user } = useTheme();
  const [selectedId, setSelectedId] = useState('');
  const [modules, setModules] = useState(['journal']);
  const [defaultLanding, setDefaultLanding] = useState('KidsJournal');

  // Family children with linked accounts
  const { data: familyMembers = [] } = useQuery({
    queryKey: ['kidControls.family', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const list = await base44.entities.FamilyMember.filter({ created_by: user.email, is_child_account: true }, 'name');
      return list.filter(m => !!m.linked_user_email);
    },
    enabled: !!user?.email
  });

  // Load current child prefs
  const { data: childPrefs } = useQuery({
    queryKey: ['kidControls.prefs', selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const { data } = await base44.functions.invoke('kidControls', { action: 'get', familyMemberId: selectedId });
      return data || null;
    },
    enabled: !!selectedId,
    onSuccess: (res) => {
      if (res?.preferences) {
        setModules(res.preferences.enabled_modules?.length ? res.preferences.enabled_modules : ['journal']);
        setDefaultLanding(res.preferences.default_landing_page || 'KidsJournal');
      } else {
        setModules(['journal']);
        setDefaultLanding('KidsJournal');
      }
    }
  });

  const selectedMember = useMemo(() => familyMembers.find(f => f.id === selectedId), [familyMembers, selectedId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMember) return;
      await base44.functions.invoke('kidControls', {
        action: 'set',
        familyMemberId: selectedMember.id,
        linkedEmail: selectedMember.linked_user_email,
        enabledModules: modules,
        defaultLandingPage: defaultLanding
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kidControls.prefs', selectedId] });
      alert('Kid settings saved!');
    }
  });

  const toggleModule = (id) => {
    setModules((prev) => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-purple-600" />
          <h1 className={`text-2xl font-bold ${textClass}`}>Kid Controls</h1>
        </div>
        <p className={subtextClass}>Choose what each child can see. Kids land on Kids Journal by default.</p>

        <Card className={cardBgClass}>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Child</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder={familyMembers.length ? 'Select a child...' : 'No linked child accounts found'} />
                </SelectTrigger>
                <SelectContent>
                  {familyMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} <span className="text-gray-400">({m.linked_user_email})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMember && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm">Kid Mode is active for this child.</span>
                </div>

                <div>
                  <Label>Allowed Pages</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {ALL_MODULES.map((m) => (
                      <label key={m.id} className="flex items-center gap-2 p-2 rounded-md border bg-white">
                        <Checkbox checked={modules.includes(m.id)} onCheckedChange={() => toggleModule(m.id)} />
                        <span className="text-sm">{m.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={() => setModules(['journal'])}>Journal Only</Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Default Landing</Label>
                    <Input value={defaultLanding} onChange={(e) => setDefaultLanding(e.target.value)} />
                    <p className="text-xs text-gray-500">Recommend: KidsJournal</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => saveMutation.mutate()} className="bg-purple-600 text-white">
                    <Save className="w-4 h-4 mr-2" /> Save Settings
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}