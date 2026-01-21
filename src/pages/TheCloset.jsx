import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, Search, Download, Sparkles } from 'lucide-react';

export default function TheCloset() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterApp, setFilterApp] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCharacter, setFilterCharacter] = useState('all');

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user?.email,
  });

  const primaryColor = preferences?.primary_color || '#1fd2ea';
  const accentColor = preferences?.accent_color || '#bd84f5';

  // Fetch all outputs
  const { data: allOutputs = [] } = useQuery({
    queryKey: ['allOutputs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.AIAppOutput.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  // Fetch apps, brands, characters for filters
  const { data: apps = [] } = useQuery({
    queryKey: ['apps', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.AIApp.filter({ created_by: user.email });
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

  const { data: characters = [] } = useQuery({
    queryKey: ['characters', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.CharacterReference.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  // Filter outputs
  const filteredOutputs = allOutputs.filter(output => {
    const matchesSearch = searchTerm === '' || 
      output.prompt_text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesApp = filterApp === 'all' || output.app_id === filterApp;
    const matchesBrand = filterBrand === 'all' || output.brand_id === filterBrand;
    const matchesCharacter = filterCharacter === 'all' || output.character_reference_id === filterCharacter;
    
    return matchesSearch && matchesApp && matchesBrand && matchesCharacter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FolderOpen className="w-10 h-10" style={{ color: primaryColor }} />
            <h1 
              className="text-4xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
            >
              The Closet
            </h1>
          </div>
          <p className="text-gray-600">All your AI-generated images in one place</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search prompts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterApp} onValueChange={setFilterApp}>
                <SelectTrigger>
                  <SelectValue placeholder="All Apps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Apps</SelectItem>
                  {apps.map(app => (
                    <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCharacter} onValueChange={setFilterCharacter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Characters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Characters</SelectItem>
                  {characters.map(char => (
                    <SelectItem key={char.id} value={char.id}>{char.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredOutputs.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-gray-400">No Images Yet</h3>
            <p className="text-gray-500 mb-6">Start creating with your AI apps!</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredOutputs.length} {filteredOutputs.length === 1 ? 'image' : 'images'}
            </div>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredOutputs.map(output => {
                const app = apps.find(a => a.id === output.app_id);
                const brand = brands.find(b => b.id === output.brand_id);
                const character = characters.find(c => c.id === output.character_reference_id);

                return (
                  <Card key={output.id} className="overflow-hidden hover:shadow-xl transition-shadow group">
                    <div className="relative">
                      <img 
                        src={output.output_url} 
                        alt="Generated" 
                        className="w-full h-64 object-cover cursor-pointer"
                        onClick={() => window.open(output.output_url, '_blank')}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => window.open(output.output_url, '_blank')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardContent className="p-3 text-xs space-y-1">
                      {app && (
                        <div className="flex items-center gap-1 text-purple-600">
                          <Sparkles className="w-3 h-3" />
                          <span className="font-medium">{app.name}</span>
                        </div>
                      )}
                      {brand && <p className="text-gray-500">Brand: {brand.name}</p>}
                      {character && <p className="text-gray-500">Character: {character.name}</p>}
                      {output.prompt_text && (
                        <details className="text-xs">
                          <summary className="cursor-pointer font-medium text-gray-700">Prompt</summary>
                          <p className="mt-1 text-gray-600 line-clamp-3">{output.prompt_text}</p>
                        </details>
                      )}
                      <p className="text-gray-400">{new Date(output.created_date).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}