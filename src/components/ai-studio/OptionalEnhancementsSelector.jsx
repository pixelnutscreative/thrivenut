import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { User, Briefcase, Package, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OptionalEnhancementsSelector({ 
  selectedCharacter, 
  setSelectedCharacter,
  selectedBrand,
  setSelectedBrand,
  selectedProduct,
  setSelectedProduct
}) {
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Fetch Character References
  const { data: characters = [] } = useQuery({
    queryKey: ['characters', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.CharacterReference.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  // Fetch Brands
  const { data: brands = [] } = useQuery({
    queryKey: ['brands', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Brand.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  // Fetch Products for selected brand
  const { data: products = [] } = useQuery({
    queryKey: ['products', selectedBrand],
    queryFn: async () => {
      if (!selectedBrand) return [];
      return await base44.entities.BrandProduct.filter({ brand_id: selectedBrand });
    },
    enabled: !!selectedBrand,
  });

  const selectedCharacterData = characters.find(c => c.id === selectedCharacter);
  const selectedBrandData = brands.find(b => b.id === selectedBrand);
  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="text-purple-600">✨</span>
          Optional Enhancements
        </CardTitle>
        <CardDescription>Add character references, brands, or products (all optional)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Character Reference */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            Character Reference
          </Label>
          <div className="flex gap-2">
            <Select value={selectedCharacter || ''} onValueChange={setSelectedCharacter}>
              <SelectTrigger>
                <SelectValue placeholder="None - Skip this" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {characters.map((char) => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCharacter && (
              <Button variant="ghost" size="icon" onClick={() => setSelectedCharacter(null)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {selectedCharacterData && (
            <p className="text-xs text-gray-500 italic">"{selectedCharacterData.description}"</p>
          )}
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-500" />
            Brand
          </Label>
          <div className="flex gap-2">
            <Select value={selectedBrand || ''} onValueChange={(val) => {
              setSelectedBrand(val);
              setSelectedProduct(null); // Reset product when brand changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="None - Skip this" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBrand && (
              <Button variant="ghost" size="icon" onClick={() => {
                setSelectedBrand(null);
                setSelectedProduct(null);
              }}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {selectedBrandData && (
            <p className="text-xs text-gray-500 italic">{selectedBrandData.description}</p>
          )}
        </div>

        {/* Product/Offer (only show if brand selected) */}
        {selectedBrand && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" />
              Product/Offer
            </Label>
            <div className="flex gap-2">
              <Select value={selectedProduct || ''} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="None - Skip this" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <Button variant="ghost" size="icon" onClick={() => setSelectedProduct(null)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {selectedProductData && (
              <p className="text-xs text-gray-500 italic">{selectedProductData.description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}