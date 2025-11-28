import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Upload, X, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const colorOptions = [
  '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', 
  '#3B82F6', '#6366F1', '#84CC16', '#14B8A6', '#F97316'
];

// Default clubs/groups with special formatting
const defaultClubs = [
  { id: 'gen_x', label: 'Gen ❌', display: 'Gen X' },
  { id: 'group_god', label: 'Group God', display: 'Group God' },
  { id: 'group_7', label: 'Group 7', display: 'Group 7' },
  { id: 'we_do_not_care', label: 'We Do Not Care Club', display: 'We Do Not Care Club' },
  { id: 'washed_up_moms', label: "Washed Up Mom's Club", display: "Washed Up Mom's Club" },
  { id: 'we_do_not_have', label: 'We Do Not Have Club', display: 'We Do Not Have Club' },
];

export default function ContactFormHeader({ formData, setFormData, onSave, isSaving, isEditing }) {
  const [newClub, setNewClub] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, image_url: file_url });
  };

  return (
    <div className="space-y-4 pb-4 border-b">
      {/* Top row with save button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_favorite: !formData.is_favorite })}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Star className={`w-5 h-5 ${formData.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
          </button>
          <div className="flex items-center gap-1">
            {colorOptions.slice(0, 5).map(color => (
              <div
                key={color}
                onClick={() => setFormData({ ...formData, color })}
                className={`w-5 h-5 rounded-full cursor-pointer ${formData.color === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
            <Input
              type="color"
              value={formData.color || '#6B7280'}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-6 h-6 p-0 cursor-pointer border-0"
            />
          </div>
        </div>
        <Button
          onClick={onSave}
          disabled={isSaving}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isEditing ? 'Update' : 'Add'}
        </Button>
      </div>

      {/* Photo and names row */}
      <div className="flex gap-4">
        {/* Photo upload */}
        <div className="flex-shrink-0">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
            {formData.image_url ? (
              <>
                <img src={formData.image_url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image_url: '' })}
                  className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full hover:bg-gray-50">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">Photo</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Name fields */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Real Name</Label>
            <Input
              placeholder="Their actual name"
              value={formData.real_name || ''}
              onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Nickname</Label>
            <Input
              placeholder="What you call them"
              value={formData.nickname || ''}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Clubs/Groups Section */}
      <div className="space-y-2 pt-2">
        <Label className="text-xs text-gray-500">Clubs & Groups</Label>
        <div className="flex flex-wrap gap-1">
          {defaultClubs.map(club => {
            const isActive = formData.clubs?.includes(club.id);
            return (
              <Badge
                key={club.id}
                variant={isActive ? 'default' : 'outline'}
                className={`cursor-pointer text-xs ${isActive ? 'bg-purple-600' : 'bg-white hover:bg-purple-50'}`}
                onClick={() => {
                  const current = formData.clubs || [];
                  setFormData({
                    ...formData,
                    clubs: isActive 
                      ? current.filter(c => c !== club.id)
                      : [...current, club.id]
                  });
                }}
              >
                {club.label}
              </Badge>
            );
          })}
          {/* Custom clubs */}
          {(formData.custom_clubs || []).map((club, idx) => (
            <Badge
              key={`custom-${idx}`}
              variant="default"
              className="cursor-pointer text-xs bg-teal-600 hover:bg-teal-700"
              onClick={() => {
                setFormData({
                  ...formData,
                  custom_clubs: formData.custom_clubs.filter((_, i) => i !== idx)
                });
              }}
            >
              {club} ✕
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add custom club/group..."
            value={newClub}
            onChange={(e) => setNewClub(e.target.value)}
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newClub.trim()) {
                e.preventDefault();
                setFormData({
                  ...formData,
                  custom_clubs: [...(formData.custom_clubs || []), newClub.trim()]
                });
                setNewClub('');
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => {
              if (newClub.trim()) {
                setFormData({
                  ...formData,
                  custom_clubs: [...(formData.custom_clubs || []), newClub.trim()]
                });
                setNewClub('');
              }
            }}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}