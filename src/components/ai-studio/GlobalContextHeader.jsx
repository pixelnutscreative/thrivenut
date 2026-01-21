import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { User, Briefcase, Package, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AddCharacterModal from './AddCharacterModal';
import AddBrandModal from './AddBrandModal';
import AddProductModal from './AddProductModal';

export default function GlobalContextHeader({ primaryColor, accentColor }) {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const queryClient = useQueryClient();
  
  // Modals
  const [showAddCharacter, setShowAddCharacter] = useState(false);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  
  // Load from localStorage
  const [selectedCharacter, setSelectedCharacter] = useState(() => 
    localStorage.getItem('ai_global_character') || null
  );
  const [selectedBrand, setSelectedBrand] = useState(() => 
    localStorage.getItem('ai_global_brand') || null
  );
  const [selectedProduct, setSelectedProduct] = useState(() => 
    localStorage.getItem('ai_global_product') || null
  );

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Save to localStorage and window for global access
  useEffect(() => {
    if (selectedCharacter) {
      localStorage.setItem('ai_global_character', selectedCharacter);
      window.AI_GLOBAL_CHARACTER = selectedCharacter;
    } else {
      localStorage.removeItem('ai_global_character');
      delete window.AI_GLOBAL_CHARACTER;
    }
  }, [selectedCharacter]);

  useEffect(() => {
    if (selectedBrand) {
      localStorage.setItem('ai_global_brand', selectedBrand);
      window.AI_GLOBAL_BRAND = selectedBrand;
    } else {
      localStorage.removeItem('ai_global_brand');
      delete window.AI_GLOBAL_BRAND;
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedProduct) {
      localStorage.setItem('ai_global_product', selectedProduct);
      window.AI_GLOBAL_PRODUCT = selectedProduct;
    } else {
      localStorage.removeItem('ai_global_product');
      delete window.AI_GLOBAL_PRODUCT;
    }
  }, [selectedProduct]);

  // Fetch data
  const { data: characters = [] } = useQuery({
    queryKey: ['characters', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.CharacterReference.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Brand.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

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
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-4">
          <CollapsibleTrigger className="w-full flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-purple-600">✨</span>
              Global Context - Active Across All Apps
            </h3>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {/* Character Reference */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    Character Reference
                  </label>
                  {selectedCharacter && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2"
                      onClick={() => setSelectedCharacter(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <Select value={selectedCharacter || ''} onValueChange={setSelectedCharacter}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="None - Optional" />
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
                {selectedCharacterData && (
                  <div className="p-2 bg-white rounded border border-blue-100 space-y-1">
                    <p className="text-xs text-gray-600">{selectedCharacterData.description}</p>
                    {selectedCharacterData.images?.length > 0 && (
                      <div className="flex gap-1 overflow-x-auto">
                        {selectedCharacterData.images.slice(0, 3).map((img, idx) => (
                          <img key={idx} src={img} alt="" className="w-12 h-12 object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                    Brand
                  </label>
                  {selectedBrand && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2"
                      onClick={() => {
                        setSelectedBrand(null);
                        setSelectedProduct(null);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <Select value={selectedBrand || ''} onValueChange={(val) => {
                  setSelectedBrand(val);
                  setSelectedProduct(null);
                }}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="None - Optional" />
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
                {selectedBrandData && (
                  <div className="p-2 bg-white rounded border border-purple-100 space-y-1">
                    <p className="text-xs text-gray-600">{selectedBrandData.description}</p>
                    {selectedBrandData.tone_voice && (
                      <p className="text-xs text-gray-500 italic">Tone: {selectedBrandData.tone_voice}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Product */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-orange-500" />
                    Product/Offer
                  </label>
                  {selectedProduct && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2"
                      onClick={() => setSelectedProduct(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <Select 
                  value={selectedProduct || ''} 
                  onValueChange={setSelectedProduct}
                  disabled={!selectedBrand}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder={selectedBrand ? "None - Optional" : "Select brand first"} />
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
                {selectedProductData && (
                  <div className="p-2 bg-white rounded border border-orange-100 space-y-1">
                    <p className="text-xs text-gray-600">{selectedProductData.description}</p>
                    {selectedProductData.image_url && (
                      <img src={selectedProductData.image_url} alt="" className="w-full h-20 object-cover rounded" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>

      <AddCharacterModal 
        isOpen={showAddCharacter} 
        onClose={() => setShowAddCharacter(false)}
        onSuccess={(newChar) => {
          queryClient.invalidateQueries(['characters']);
          setSelectedCharacter(newChar.id);
          setShowAddCharacter(false);
        }}
        primaryColor={primaryColor}
      />

      <AddBrandModal 
        isOpen={showAddBrand} 
        onClose={() => setShowAddBrand(false)}
        onSuccess={(newBrand) => {
          queryClient.invalidateQueries(['brands']);
          setSelectedBrand(newBrand.id);
          setShowAddBrand(false);
        }}
        primaryColor={primaryColor}
      />

      <AddProductModal 
        isOpen={showAddProduct} 
        onClose={() => setShowAddProduct(false)}
        brandId={selectedBrand}
        onSuccess={(newProduct) => {
          queryClient.invalidateQueries(['products']);
          setSelectedProduct(newProduct.id);
          setShowAddProduct(false);
        }}
        primaryColor={primaryColor}
      />
    </Card>
  );
}