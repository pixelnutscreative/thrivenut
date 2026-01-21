import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Building2, Package, Sparkles } from 'lucide-react';

export default function GlobalContextHeader() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);

  // Fetch character references
  const { data: characters = [] } = useQuery({
    queryKey: ['characterReferences'],
    queryFn: () => base44.entities.CharacterReference.list('-updated_date'),
    staleTime: 300000,
  });

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('-updated_date'),
    staleTime: 300000,
  });

  // Fetch offers for selected brand
  const { data: offers = [] } = useQuery({
    queryKey: ['brandProducts', selectedBrand],
    queryFn: () => base44.entities.BrandProduct.filter({ brand_id: selectedBrand }),
    enabled: !!selectedBrand,
    staleTime: 300000,
  });

  return (
    <Card className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white shadow-xl">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Character Reference */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Character Reference
            </label>
            <Select value={selectedCharacter || ''} onValueChange={setSelectedCharacter}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Select character..." />
              </SelectTrigger>
              <SelectContent>
                {characters.map(char => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Brand
            </label>
            <Select value={selectedBrand || ''} onValueChange={setSelectedBrand}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Select brand..." />
              </SelectTrigger>
              <SelectContent>
                {brands.map(brand => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Offer */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Offer
            </label>
            <Select value={selectedOffer || ''} onValueChange={setSelectedOffer} disabled={!selectedBrand}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Select offer..." />
              </SelectTrigger>
              <SelectContent>
                {offers.map(offer => (
                  <SelectItem key={offer.id} value={offer.id}>
                    {offer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create Button */}
          <div>
            <Button 
              size="lg" 
              className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold shadow-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create with Current Settings
            </Button>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            + Add Character
          </Button>
          <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            + Add Brand
          </Button>
          <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            + Add Offer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}