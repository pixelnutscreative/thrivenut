import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Building2, Package } from 'lucide-react';

export default function GlobalContextHeader({ primaryColor, accentColor }) {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [brandName, setBrandName] = useState('');
  const [offerName, setOfferName] = useState('');

  // Fetch character references
  const { data: characters = [] } = useQuery({
    queryKey: ['characterReferences'],
    queryFn: () => base44.entities.CharacterReference.list('-updated_date'),
    staleTime: 300000,
  });

  return (
    <Card 
      className="text-white shadow-xl"
      style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
    >
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Brand Name
            </label>
            <Input 
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter brand name..."
              className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
            />
          </div>

          {/* Offer */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Offer Name
            </label>
            <Input 
              value={offerName}
              onChange={(e) => setOfferName(e.target.value)}
              placeholder="Enter offer name..."
              className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
            />
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            + Add Character
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}