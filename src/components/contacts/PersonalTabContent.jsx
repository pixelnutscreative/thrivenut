import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NotesWithHistory from './NotesWithHistory';

const veteranBranches = [
  { value: 'ARMY', label: 'Army' },
  { value: 'NAVY', label: 'Navy' },
  { value: 'AF', label: 'Air Force' },
  { value: 'USMC', label: 'Marines' },
  { value: 'USCG', label: 'Coast Guard' },
  { value: 'NG', label: 'National Guard' },
  { value: 'Other', label: 'Other/Unknown' }
];

const serviceTypes = [
  { value: 'first_responder', label: 'First Responder' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'ministry', label: 'Ministry' },
  { value: 'military_family', label: 'Military Family' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' }
];

const generations = ['Gen Z', 'Millennial', 'Gen X', 'Boomer', 'Silent', 'Other'];
const genders = ['Female', 'Male', 'Non-binary', 'Other'];

const defaultFamilyRoles = [
  'Mom', 'Dad', 'Single Mom', 'Single Dad', 'SAHM', 'SAHD', 
  'Grandma', 'Grandpa', 'Widow', 'Widower', 'Empty Nester', 
  'Foster Parent', 'Step-Parent', 'Caregiver'
];

export default function PersonalTabContent({ formData, setFormData }) {
  const handleAddNote = (note) => {
    setFormData(prev => ({
      ...prev,
      personal_notes: [...(prev.personal_notes || []), note]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Phone</Label>
          <Input
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input
            type="email"
            placeholder="email@example.com"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      {/* Birthday & Demographics */}
      <div className="p-3 bg-blue-50 rounded-lg space-y-3">
        <h4 className="font-semibold text-sm text-blue-800">Demographics</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Birthday</Label>
            <Input
              type="date"
              value={formData.birthday || ''}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Generation</Label>
            <Select 
              value={formData.generation || ''} 
              onValueChange={(v) => setFormData({ ...formData, generation: v })}
            >
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {generations.map(gen => (
                  <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gender</Label>
            <Select 
              value={formData.gender || ''} 
              onValueChange={(v) => setFormData({ ...formData, gender: v })}
            >
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {genders.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Veteran Section */}
      <div className="p-3 rounded-lg bg-gradient-to-r from-red-50 via-white to-blue-50 border border-red-200 space-y-3">
        <div
          onClick={() => setFormData({ ...formData, is_veteran: !formData.is_veteran })}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Checkbox checked={formData.is_veteran} />
          <span className="text-lg">🇺🇸</span>
          <Label className="cursor-pointer font-semibold text-blue-800">Veteran</Label>
        </div>

        {formData.is_veteran && (
          <Select 
            value={formData.veteran_branch || ''} 
            onValueChange={(v) => setFormData({ ...formData, veteran_branch: v })}
          >
            <SelectTrigger><SelectValue placeholder="Select branch..." /></SelectTrigger>
            <SelectContent>
              {veteranBranches.map(branch => (
                <SelectItem key={branch.value} value={branch.value}>{branch.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Recovery Section */}
      <div className="p-3 rounded-lg bg-green-50 border border-green-200 space-y-3">
        <div
          onClick={() => setFormData({ ...formData, is_in_recovery: !formData.is_in_recovery })}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Checkbox checked={formData.is_in_recovery} />
          <span className="text-lg">💚</span>
          <Label className="cursor-pointer font-semibold text-green-800">In Recovery</Label>
        </div>

        {formData.is_in_recovery && (
          <div className="space-y-1">
            <Label className="text-xs">Sobriety Date</Label>
            <Input
              type="date"
              value={formData.sobriety_date || ''}
              onChange={(e) => setFormData({ ...formData, sobriety_date: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Family Roles */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Family Roles</Label>
        <div className="flex flex-wrap gap-1">
          {defaultFamilyRoles.map(role => (
            <Badge
              key={role}
              variant={formData.family_roles?.includes(role) ? 'default' : 'outline'}
              className={`cursor-pointer text-xs ${formData.family_roles?.includes(role) ? 'bg-rose-600' : 'bg-rose-50 text-rose-700'}`}
              onClick={() => {
                const current = formData.family_roles || [];
                setFormData({
                  ...formData,
                  family_roles: current.includes(role) 
                    ? current.filter(r => r !== role)
                    : [...current, role]
                });
              }}
            >
              {role}
            </Badge>
          ))}
        </div>
      </div>

      {/* Occupation & Service */}
      <div className="p-3 rounded-lg bg-pink-50 border border-pink-200 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Occupation / Job Title</Label>
          <Input
            placeholder="e.g., Nurse, Teacher, Engineer"
            value={formData.occupation || ''}
            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
          />
        </div>

        <div
          onClick={() => setFormData({ ...formData, is_service_professional: !formData.is_service_professional })}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Checkbox checked={formData.is_service_professional} />
          <span className="text-lg">❤️</span>
          <Label className="cursor-pointer font-semibold text-pink-800">Service Professional</Label>
        </div>

        {formData.is_service_professional && (
          <Select 
            value={formData.service_type || ''} 
            onValueChange={(v) => setFormData({ ...formData, service_type: v })}
          >
            <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
            <SelectContent>
              {serviceTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div
          onClick={() => setFormData({ ...formData, is_mlm: !formData.is_mlm })}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Checkbox checked={formData.is_mlm} />
          <Label className="cursor-pointer text-sm">MLM / Network Marketing</Label>
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Social Media</Label>
        <div className="grid grid-cols-2 gap-2">
          {['instagram', 'facebook', 'youtube', 'twitter', 'linkedin', 'threads', 'twitch', 'discord', 'snapchat', 'pinterest'].map(platform => (
            <Input
              key={platform}
              placeholder={platform.charAt(0).toUpperCase() + platform.slice(1)}
              value={formData.social_links?.[platform] || ''}
              onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, [platform]: e.target.value } })}
              className="h-8 text-xs"
            />
          ))}
        </div>
      </div>

      {/* Personal Notes */}
      <NotesWithHistory
        notes={formData.personal_notes || []}
        onAddNote={handleAddNote}
        label="Personal Notes"
      />
    </div>
  );
}