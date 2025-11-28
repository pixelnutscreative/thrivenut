import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building2 } from 'lucide-react';
import BusinessCard from './BusinessCard';

const serviceTypes = [
  { value: 'first_responder', label: 'First Responder' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'ministry', label: 'Ministry' },
  { value: 'military_family', label: 'Military Family' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' }
];

export default function BusinessTabContent({ formData, setFormData }) {
  const businesses = formData.businesses || [];

  const handleAddBusiness = () => {
    const newBusiness = {
      id: Date.now().toString(),
      business_name: '',
      business_phone: '',
      business_email: '',
      business_website: '',
      social_links: {},
      business_notes: []
    };
    setFormData({
      ...formData,
      businesses: [...businesses, newBusiness]
    });
  };

  const handleUpdateBusiness = (index, updatedBusiness) => {
    const updated = [...businesses];
    updated[index] = updatedBusiness;
    setFormData({ ...formData, businesses: updated });
  };

  const handleDeleteBusiness = (index) => {
    const updated = businesses.filter((_, i) => i !== index);
    setFormData({ ...formData, businesses: updated });
  };

  return (
    <div className="space-y-4">
      {/* Work Info Section */}
      <div className="p-4 border rounded-lg bg-amber-50/50 space-y-3">
        <h3 className="font-bold text-md text-amber-800">Work</h3>
        
        <div className="space-y-1">
          <Label className="text-xs">Job Title / Occupation</Label>
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
          <Label className="cursor-pointer font-semibold text-amber-800">Service Professional</Label>
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

      {/* Businesses Section */}
      <div className="space-y-3">
        <h3 className="font-bold text-md text-gray-800">Businesses</h3>
        
        {businesses.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm mb-3">No businesses added yet</p>
            <Button onClick={handleAddBusiness} variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Business
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {businesses.map((business, index) => (
                <BusinessCard
                  key={business.id || index}
                  business={business}
                  onUpdate={(updated) => handleUpdateBusiness(index, updated)}
                  onDelete={() => handleDeleteBusiness(index)}
                />
              ))}
            </div>
            <Button onClick={handleAddBusiness} variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Add Another Business
            </Button>
          </>
        )}
      </div>
    </div>
  );
}