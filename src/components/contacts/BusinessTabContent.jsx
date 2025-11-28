import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
import BusinessCard from './BusinessCard';

export default function BusinessTabContent({ formData, setFormData }) {
  const businesses = formData.businesses || [];

  const handleAddBusiness = () => {
    const newBusiness = {
      id: Date.now().toString(),
      business_name: '',
      business_phone: '',
      business_email: '',
      business_website: '',
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
      {businesses.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 mb-4">No businesses added yet</p>
          <Button onClick={handleAddBusiness} variant="outline" className="gap-2">
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
  );
}