import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, ExternalLink, Link as LinkIcon, Star, Eye, EyeOff, LayoutGrid, Search, Loader2 } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

const platformConfig = {
  tiktok: { label: 'TikTok', color: 'bg-black text-white', icon: '🎵' },
  instagram: { label: 'Instagram', color: 'bg-pink-600 text-white', icon: '📸' },
  facebook: { label: 'Facebook', color: 'bg-blue-600 text-white', icon: '📘' },
  youtube: { label: 'YouTube', color: 'bg-red-600 text-white', icon: '▶️' },
  twitter: { label: 'X (Twitter)', color: 'bg-gray-900 text-white', icon: '✖️' },
  linkedin: { label: 'LinkedIn', color: 'bg-blue-700 text-white', icon: '💼' },
  pinterest: { label: 'Pinterest', color: 'bg-red-500 text-white', icon: '📌' },
  other: { label: 'Other', color: 'bg-gray-500 text-white', icon: '🌐' }
};

const starterLinks = {
  tiktok: [
    { title: "Profile", url: "https://www.tiktok.com/@{handle}" },
    { title: "Wallet (Coins)", url: "https://www.tiktok.com/coin" },
    { title: "LIVE Stats", url: "https://www.tiktok.com/@{handle}/live?tab=stats" },
    { title: "Top GIFters", url: "https://www.tiktok.com/@{handle}/live?tab=gift" },
    { title: "Analytics", url: "https://www.tiktok.com/creator-tool/analytics" },
    { title: "Q&A", url: "https://www.tiktok.com/@{handle}?tab=qanda" },
    { title: "Settings", url: "https://www.tiktok.com/setting" },
    { title: "Creator Marketplace", url: "https://www.tiktok.com/creator-marketplace/profile/{handle}" }
  ],
  instagram: [
    { title: "Profile", url: "https://www.instagram.com/{handle}" },
    { title: "Insights", url: "https://www.instagram.com/insights" }, // Web doesn't have deep insights usually but profile works
    { title: "Saved", url: "https://www.instagram.com/{handle}/saved/" },
    { title: "Settings", url: "https://www.instagram.com/accounts/edit/" }
  ],
  facebook: [
    { title: "Page", url: "https://www.facebook.com/{handle}" },
    { title: "Meta Business Suite", url: "https://business.facebook.com/latest/home" },
    { title: "Ad Center", url: "https://www.facebook.com/ad_center/create/landing" }
  ],
  youtube: [
    { title: "Channel", url: "https://www.youtube.com/@{handle}" },
    { title: "Studio", url: "https://studio.youtube.com/" },
    { title: "Analytics", url: "https://studio.youtube.com/channel/analytics/tab-overview" }
  ]
};

export default function SocialShortcuts() {
  const { user, effectiveEmail, bgClass } = useTheme();
  const queryClient = useQueryClient();
  const [activeBrandId, setActiveBrandId] = useState(null);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddNetwork, setShowAddNetwork] = useState(false);
  const [showAddShortcut, setShowAddShortcut] = useState(null); // networkId
  const [newBrandName, setNewBrandName] = useState('');
  
  const [newNetwork, setNewNetwork] = useState({ platform: 'tiktok', handle: '' });
  const [newShortcut, setNewShortcut] = useState({ title: '', url: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Queries
  const { data: brands = [] } = useQuery({
    queryKey: ['socialBrands', effectiveEmail],
    queryFn: () => base44.entities.SocialBrand.filter({ user_email: effectiveEmail }),
    enabled: !!effectiveEmail
  });

  const { data: networks = [] } = useQuery({
    queryKey: ['socialNetworks', activeBrandId],
    queryFn: () => base44.entities.SocialNetwork.filter({ brand_id: activeBrandId }),
    enabled: !!activeBrandId
  });

  const { data: shortcuts = [] } = useQuery({
    queryKey: ['socialShortcuts', activeBrandId], // Fetch all for brand networks? Or fetch per network. 
    // Better to fetch all for the brand via network IDs
    queryFn: async () => {
      if (!networks.length) return [];
      const networkIds = networks.map(n => n.id);
      // Base44 filter doesn't support 'in' array efficiently in one call unless specified, 
      // but we can fetch per network or fetch all and filter.
      // Assuming we fetch all for now or loop.
      const allShortcuts = [];
      for (const net of networks) {
        const res = await base44.entities.SocialShortcut.filter({ network_id: net.id });
        allShortcuts.push(...res);
      }
      return allShortcuts;
    },
    enabled: networks.length > 0
  });

  // Mutations
  const createBrandMutation = useMutation({
    mutationFn: (name) => base44.entities.SocialBrand.create({ name, user_email: effectiveEmail }),
    onSuccess: (newBrand) => {
      queryClient.invalidateQueries(['socialBrands']);
      setShowAddBrand(false);
      setNewBrandName('');
      if (!activeBrandId) setActiveBrandId(newBrand.id);
    }
  });

  const createNetworkMutation = useMutation({
    mutationFn: async (data) => {
      const network = await base44.entities.SocialNetwork.create({ ...data, brand_id: activeBrandId });
      
      // Auto-generate starter links
      const templates = starterLinks[data.platform];
      if (templates) {
        const shortcuts = templates.map((tmpl, idx) => ({
          network_id: network.id,
          title: tmpl.title,
          url: tmpl.url.replace('{handle}', data.handle),
          sort_order: idx
        }));
        await base44.entities.SocialShortcut.bulkCreate(shortcuts);
      }
      return network;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['socialNetworks']);
      queryClient.invalidateQueries(['socialShortcuts']);
      setShowAddNetwork(false);
      setNewNetwork({ platform: 'tiktok', handle: '' });
    }
  });

  const createShortcutMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialShortcut.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialShortcuts']);
      setShowAddShortcut(null);
      setNewShortcut({ title: '', url: '' });
    }
  });

  const deleteShortcutMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialShortcut.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['socialShortcuts'])
  });

  const deleteNetworkMutation = useMutation({
    mutationFn: async (id) => {
      // Delete shortcuts first (optional but cleaner)
      const netShortcuts = shortcuts.filter(s => s.network_id === id);
      if (netShortcuts.length) {
        // Bulk delete not available in standard SDK for now, loop
        for (const s of netShortcuts) await base44.entities.SocialShortcut.delete(s.id);
      }
      return base44.entities.SocialNetwork.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['socialNetworks']);
      queryClient.invalidateQueries(['socialShortcuts']);
    }
  });

  // Effect to set active brand
  React.useEffect(() => {
    if (brands.length > 0 && !activeBrandId) {
      setActiveBrandId(brands[0].id);
    }
  }, [brands]);

  // Filter shortcuts
  const getFilteredShortcuts = (networkId) => {
    return shortcuts.filter(s => 
      s.network_id === networkId && 
      (s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
       s.url.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  };

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Brand Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Social Shortcuts</h1>
            <p className="text-gray-500">Quick access to all your social media tools and pages</p>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {brands.map(brand => (
              <Button
                key={brand.id}
                variant={activeBrandId === brand.id ? 'default' : 'outline'}
                onClick={() => setActiveBrandId(brand.id)}
                className="whitespace-nowrap"
              >
                {brand.name}
              </Button>
            ))}
            <Dialog open={showAddBrand} onOpenChange={setShowAddBrand}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><Plus className="w-4 h-4" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Brand / Client</DialogTitle></DialogHeader>
                <div className="py-4">
                  <Input 
                    placeholder="Brand Name" 
                    value={newBrandName} 
                    onChange={e => setNewBrandName(e.target.value)} 
                  />
                </div>
                <DialogFooter>
                  <Button onClick={() => createBrandMutation.mutate(newBrandName)} disabled={!newBrandName}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search shortcuts..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="pl-9 bg-white"
          />
        </div>

        {/* Networks Grid */}
        {activeBrandId && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {networks.map(network => {
              const config = platformConfig[network.platform] || platformConfig.other;
              const netShortcuts = getFilteredShortcuts(network.id);

              return (
                <Card key={network.id} className="overflow-hidden">
                  <CardHeader className={`py-3 px-4 flex flex-row items-center justify-between ${config.color}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{config.icon}</span>
                      <div>
                        <CardTitle className="text-base">{config.label}</CardTitle>
                        <p className="text-xs opacity-80">@{network.handle}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:bg-white/20 h-8 w-8"
                      onClick={() => {
                        if(confirm('Delete network and all shortcuts?')) deleteNetworkMutation.mutate(network.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y max-h-[400px] overflow-y-auto">
                      {netShortcuts.map(shortcut => (
                        <div key={shortcut.id} className="flex items-center justify-between p-3 hover:bg-gray-50 group transition-colors">
                          <a 
                            href={shortcut.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center gap-3 min-w-0"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium text-sm truncate text-gray-700 group-hover:text-purple-600">
                              {shortcut.title}
                            </span>
                          </a>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-red-500"
                              onClick={() => deleteShortcutMutation.mutate(shortcut.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {netShortcuts.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-500 italic">No shortcuts found</div>
                      )}
                    </div>
                    <div className="p-2 border-t bg-gray-50">
                      <Dialog open={showAddShortcut === network.id} onOpenChange={(open) => setShowAddShortcut(open ? network.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full text-gray-500 hover:text-purple-600">
                            <Plus className="w-4 h-4 mr-2" /> Add Shortcut
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Add Shortcut to {config.label}</DialogTitle></DialogHeader>
                          <div className="space-y-4 py-4">
                            <Input 
                              placeholder="Title (e.g. Analytics)" 
                              value={newShortcut.title} 
                              onChange={e => setNewShortcut({...newShortcut, title: e.target.value})} 
                            />
                            <Input 
                              placeholder="URL" 
                              value={newShortcut.url} 
                              onChange={e => setNewShortcut({...newShortcut, url: e.target.value})} 
                            />
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={() => createShortcutMutation.mutate({ ...newShortcut, network_id: network.id })}
                              disabled={!newShortcut.title || !newShortcut.url}
                            >
                              Add
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add Network Card */}
            <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center min-h-[200px]">
              <Dialog open={showAddNetwork} onOpenChange={setShowAddNetwork}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="h-full w-full flex flex-col gap-2">
                    <div className="w-12 h-12 rounded-full bg-white border flex items-center justify-center shadow-sm">
                      <Plus className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-600">Add Network</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Social Network</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Platform</label>
                      <Select 
                        value={newNetwork.platform} 
                        onValueChange={v => setNewNetwork({...newNetwork, platform: v})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.keys(platformConfig).map(key => (
                            <SelectItem key={key} value={key}>{platformConfig[key].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Handle / Username (no @)</label>
                      <Input 
                        placeholder="username" 
                        value={newNetwork.handle} 
                        onChange={e => setNewNetwork({...newNetwork, handle: e.target.value})} 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={() => createNetworkMutation.mutate(newNetwork)} 
                      disabled={!newNetwork.handle || createNetworkMutation.isPending}
                    >
                      {createNetworkMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Add & Generate Links
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Card>
          </div>
        )}

        {brands.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No Brands Yet</h3>
            <p className="text-gray-500 mb-4">Create your first brand (e.g. "Personal") to get started.</p>
            <Button onClick={() => setShowAddBrand(true)}>Create Brand</Button>
          </div>
        )}
      </div>
    </div>
  );
}