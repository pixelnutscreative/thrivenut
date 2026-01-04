import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Upload, Trash2, Link as LinkIcon, FileText, Image as ImageIcon, Type, Palette, ExternalLink, X, Filter } from 'lucide-react';
import ColorPicker from '../shared/ColorPicker';

export default function GroupAssetsTab({ group, isAdmin }) {
  const [activeTab, setActiveTab] = useState('brand');

  if (!group) return <div className="p-4 text-center text-gray-500">Group data unavailable</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-pink-600" />
            Brand & Assets
          </h2>
          <p className="text-sm text-gray-500">Manage brand identity and creative assets.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('brand')}
            className={`px-4 py-2 text-sm rounded-md transition-all ${activeTab === 'brand' ? 'bg-white shadow-sm font-medium text-pink-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Brand Kit
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 text-sm rounded-md transition-all ${activeTab === 'library' ? 'bg-white shadow-sm font-medium text-pink-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Asset Library
          </button>
        </div>
      </div>

      {activeTab === 'brand' ? (
        <BrandKitSection group={group} isAdmin={isAdmin} />
      ) : (
        <AssetLibrarySection group={group} isAdmin={isAdmin} />
      )}
    </div>
  );
}

function BrandKitSection({ group, isAdmin }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['groupBrand', group.id],
    queryFn: async () => {
       try {
         return await base44.entities.Brand.filter({ group_id: group.id });
       } catch (e) {
         console.error("Brand fetch error", e);
         return [];
       }
    },
  });

  const brand = brands[0] || { colors: [], fonts: [] };

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (brand.id) {
        return base44.entities.Brand.update(brand.id, data);
      } else {
        return base44.entities.Brand.create({ ...data, group_id: group.id, name: group.name + ' Brand' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupBrand', group.id]);
      setIsEditing(false);
    }
  });

  const [formData, setFormData] = useState({});

  const handleEdit = () => {
    setFormData({
      colors: brand.colors || [],
      fonts: brand.fonts || [],
      canva_brandkit_link: brand.canva_brandkit_link || '',
      uvp_or_secret_sauce: brand.uvp_or_secret_sauce || '',
      tone_and_voice_notes: brand.tone_and_voice_notes || ''
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const addColor = (color) => {
    if (!formData.colors.includes(color)) {
      setFormData({ ...formData, colors: [...formData.colors, color] });
    }
  };

  const removeColor = (color) => {
    setFormData({ ...formData, colors: formData.colors.filter(c => c !== color) });
  };

  const addFont = (font) => {
    if (font && !formData.fonts.includes(font)) {
      setFormData({ ...formData, fonts: [...formData.fonts, font] });
    }
  };

  const removeFont = (font) => {
    setFormData({ ...formData, fonts: formData.fonts.filter(f => f !== font) });
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-300" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4" /> Brand Colors
            </CardTitle>
            <CardDescription>Your primary brand palette.</CardDescription>
          </div>
          {!isEditing && <Button variant="outline" size="sm" onClick={handleEdit}>Edit Brand Kit</Button>}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.colors.map((color, idx) => (
                  <div key={idx} className="relative group">
                    <div className="w-12 h-12 rounded-full shadow-sm border" style={{ backgroundColor: color }} />
                    <button 
                      onClick={() => removeColor(color)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <ColorPicker 
                  color="#000000" 
                  onChange={addColor}
                  trigger={
                    <button className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500">
                      <Plus className="w-5 h-5" />
                    </button>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {(brand.colors || []).length > 0 ? (
                brand.colors.map((color, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="w-16 h-16 rounded-full shadow-sm border" style={{ backgroundColor: color }} />
                    <span className="text-xs font-mono text-gray-500">{color}</span>
                  </div>
                ))
              ) : (
                <span className="text-gray-400 italic text-sm">No colors defined.</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="w-4 h-4" /> Typography & Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-xs uppercase text-gray-500 mb-2 block">Brand Fonts</Label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.fonts.map((font, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 pl-2">
                      {font}
                      <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeFont(font)} />
                    </Badge>
                  ))}
                </div>
                <Input 
                  placeholder="Add font name and press Enter" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFont(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(brand.fonts || []).length > 0 ? (
                  brand.fonts.map((font, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm py-1">{font}</Badge>
                  ))
                ) : (
                  <span className="text-gray-400 italic text-sm">No fonts defined.</span>
                )}
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs uppercase text-gray-500 mb-2 block">Brand Kit Link</Label>
            {isEditing ? (
              <Input 
                value={formData.canva_brandkit_link} 
                onChange={e => setFormData({ ...formData, canva_brandkit_link: e.target.value })}
                placeholder="https://canva.com/..." 
              />
            ) : brand.canva_brandkit_link ? (
              <a 
                href={brand.canva_brandkit_link} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2 text-indigo-600 hover:underline bg-indigo-50 p-3 rounded-lg border border-indigo-100"
              >
                <ExternalLink className="w-4 h-4" /> Open Brand Kit
              </a>
            ) : (
              <span className="text-gray-400 italic text-sm">No link provided.</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="w-4 h-4" /> Voice & Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-xs uppercase text-gray-500 mb-2 block">Tone of Voice</Label>
            {isEditing ? (
              <Input 
                value={formData.tone_and_voice_notes} 
                onChange={e => setFormData({ ...formData, tone_and_voice_notes: e.target.value })}
                placeholder="e.g. Professional, Friendly, Witty" 
              />
            ) : (
              <p className="text-sm text-gray-700">{brand.tone_and_voice_notes || 'Not specified'}</p>
            )}
          </div>
          <div>
            <Label className="text-xs uppercase text-gray-500 mb-2 block">Unique Value Prop</Label>
            {isEditing ? (
              <Input 
                value={formData.uvp_or_secret_sauce} 
                onChange={e => setFormData({ ...formData, uvp_or_secret_sauce: e.target.value })}
                placeholder="e.g. We do X better than Y because Z" 
              />
            ) : (
              <p className="text-sm text-gray-700">{brand.uvp_or_secret_sauce || 'Not specified'}</p>
            )}
          </div>
        </CardContent>
        {isEditing && (
          <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function AssetLibrarySection({ group, isAdmin }) {
  const queryClient = useQueryClient();
  const [filterProject, setFilterProject] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['groupAssets', group.id],
    queryFn: async () => {
      try {
        return await base44.entities.MarketingAsset.filter({ group_id: group.id }, '-created_date');
      } catch (e) {
        console.error("Asset fetch error", e);
        return [];
      }
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['groupProjects', group.id],
    queryFn: async () => {
      try {
        return await base44.entities.GroupProject.filter({ group_id: group.id });
      } catch (e) { return []; }
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['marketingOrders', group.id],
    queryFn: async () => {
      try {
        return await base44.entities.MarketingOrder.filter({ group_id: group.id });
      } catch (e) { return []; }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MarketingAsset.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupAssets', group.id])
  });

  const filteredAssets = assets.filter(a => {
    if (filterProject === 'all') return true;
    if (filterProject === 'brand') return a.linked_brand_id;
    return (a.linked_project_ids || []).includes(filterProject) || (a.linked_order_ids || []).includes(filterProject);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-[200px] h-9 text-sm">
              <SelectValue placeholder="Filter by Context" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assets</SelectItem>
              <SelectItem value="brand">Brand Assets</SelectItem>
              {projects.length > 0 && <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase">Projects</div>}
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
              {orders.length > 0 && <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase">Marketing Orders</div>}
              {orders.map(o => (
                <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white shadow-sm">
          <Upload className="w-4 h-4 mr-2" /> Upload Asset
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-300" /></div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No assets found</h3>
          <p className="text-gray-500 mb-6">Upload logos, images, or documents for your projects.</p>
          <Button variant="outline" onClick={() => setIsUploadOpen(true)}>Upload Asset</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map(asset => (
            <AssetCard 
              key={asset.id} 
              asset={asset} 
              projects={projects}
              orders={orders}
              onDelete={() => {
                if(window.confirm('Delete this asset?')) deleteMutation.mutate(asset.id);
              }}
            />
          ))}
        </div>
      )}

      <UploadAssetDialog 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        group={group}
        projects={projects}
        orders={orders}
      />
    </div>
  );
}

function AssetCard({ asset, projects, orders, onDelete }) {
  const fileUrl = asset.file_url || '';
  // Safer image check
  const isImage = asset.file_type === 'image' || (fileUrl && /\.(jpeg|jpg|png|gif|webp)$/i.test(fileUrl));
  
  const linkedNames = [];
  if (asset.linked_brand_id) linkedNames.push('Brand Kit');
  (asset.linked_project_ids || []).forEach(pid => {
    const p = projects.find(pr => pr.id === pid);
    if (p) linkedNames.push(p.title);
  });
  (asset.linked_order_ids || []).forEach(oid => {
    const o = orders.find(ord => ord.id === oid);
    if (o) linkedNames.push(o.title);
  });

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-all border-gray-200">
      <div className="aspect-square bg-gray-100 relative flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img src={fileUrl} alt={asset.name} className="w-full h-full object-cover" />
        ) : (
          <FileText className="w-16 h-16 text-gray-300" />
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {fileUrl && (
            <Button variant="secondary" size="icon" className="rounded-full" onClick={() => window.open(fileUrl, '_blank')}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button variant="destructive" size="icon" className="rounded-full" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-medium text-sm truncate" title={asset.name}>{asset.name}</h4>
        <div className="flex flex-wrap gap-1 mt-2">
          {linkedNames.slice(0, 2).map((name, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 h-5">{name}</Badge>
          ))}
          {linkedNames.length > 2 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 h-5">+{linkedNames.length - 2}</Badge>
          )}
          {linkedNames.length === 0 && <span className="text-xs text-gray-400">Unlinked</span>}
        </div>
      </div>
    </Card>
  );
}

function UploadAssetDialog({ isOpen, onClose, group, projects, orders }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [selectedContexts, setSelectedContexts] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);
      try {
        if (!file) return;
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        const linked_project_ids = selectedContexts.filter(id => projects.some(p => p.id === id));
        const linked_order_ids = selectedContexts.filter(id => orders.some(o => o.id === id));
        const isBrand = selectedContexts.includes('brand');

        await base44.entities.MarketingAsset.create({
          group_id: group.id,
          name: name || file.name,
          file_url,
          file_type: file.type.includes('image') ? 'image' : 'document',
          linked_brand_id: isBrand ? 'true' : null,
          linked_project_ids,
          linked_order_ids,
          uploaded_by: 'user'
        });
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupAssets', group.id]);
      onClose();
      setFile(null);
      setName('');
      setSelectedContexts([]);
    }
  });

  const toggleContext = (id) => {
    setSelectedContexts(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Asset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>File</Label>
            <Input type="file" onChange={e => {
              const f = e.target.files?.[0];
              if (f) {
                setFile(f);
                if (!name) setName(f.name);
              }
            }} />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Asset Name" />
          </div>
          <div className="space-y-2">
            <Label>Link to... (Optional)</Label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
              <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input type="checkbox" checked={selectedContexts.includes('brand')} onChange={() => toggleContext('brand')} className="rounded border-gray-300" />
                <span className="text-sm font-medium">Brand Kit</span>
              </label>
              
              {projects.length > 0 && <div className="text-xs font-bold text-gray-400 mt-2 px-2">PROJECTS</div>}
              {projects.map(p => (
                <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox" checked={selectedContexts.includes(p.id)} onChange={() => toggleContext(p.id)} className="rounded border-gray-300" />
                  <span className="text-sm">{p.title}</span>
                </label>
              ))}

              {orders.length > 0 && <div className="text-xs font-bold text-gray-400 mt-2 px-2">MARKETING ORDERS</div>}
              {orders.map(o => (
                <label key={o.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox" checked={selectedContexts.includes(o.id)} onChange={() => toggleContext(o.id)} className="rounded border-gray-300" />
                  <span className="text-sm">{o.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => uploadMutation.mutate()} disabled={!file || isUploading}>
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}