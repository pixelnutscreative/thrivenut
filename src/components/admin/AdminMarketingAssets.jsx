import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2, Edit, Plus, Image as ImageIcon, Link as LinkIcon, Video, Save } from 'lucide-react';
import ImageUploader from '../settings/ImageUploader';

export default function AdminMarketingAssets() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'thrive',
    type: 'image',
    asset_url: '',
    caption: '',
    keywords: '',
    is_active: true
  });

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['adminMarketingAssets'],
    queryFn: async () => {
      return await base44.entities.MarketingAsset.list('-created_date');
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MarketingAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMarketingAssets'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MarketingAsset.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMarketingAssets'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MarketingAsset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMarketingAssets'] });
    }
  });

  const resetForm = () => {
    setIsEditing(false);
    setCurrentAsset(null);
    setFormData({
      title: '',
      description: '',
      category: 'thrive',
      type: 'image',
      asset_url: '',
      caption: '',
      keywords: '',
      is_active: true
    });
  };

  const handleEdit = (asset) => {
    setCurrentAsset(asset);
    setFormData({
      title: asset.title,
      description: asset.description || '',
      category: asset.category,
      type: asset.type,
      asset_url: asset.asset_url,
      caption: asset.caption || '',
      keywords: asset.keywords || '',
      is_active: asset.is_active
    });
    setIsEditing(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentAsset) {
      updateMutation.mutate({ id: currentAsset.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Marketing Assets Library</h2>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add New Asset
          </Button>
        )}
      </div>

      {isEditing && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle>{currentAsset ? 'Edit Asset' : 'Add New Asset'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData({...formData, category: v})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thrive">Thrive Nut (UGC)</SelectItem>
                      <SelectItem value="ai">Pixel's AI Toolbox</SelectItem>
                      <SelectItem value="nuts">The Nuts + Bots</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({...formData, type: v})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={formData.is_active ? "true" : "false"} 
                    onValueChange={(v) => setFormData({...formData, is_active: v === "true"})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.type === 'image' ? (
                <div className="space-y-2">
                  <Label>Upload Image</Label>
                  <ImageUploader 
                    label="Asset Image"
                    currentImage={formData.asset_url}
                    onUpload={(url) => setFormData({...formData, asset_url: url})}
                    onRemove={() => setFormData({...formData, asset_url: ''})}
                    aspectRatio="wide"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Asset URL</Label>
                  <Input 
                    value={formData.asset_url} 
                    onChange={(e) => setFormData({...formData, asset_url: e.target.value})} 
                    placeholder="https://..."
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Caption / Copy</Label>
                <Textarea 
                  value={formData.caption} 
                  onChange={(e) => setFormData({...formData, caption: e.target.value})} 
                  placeholder="Suggested caption for this asset..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Keywords (comma separated)</Label>
                <Input 
                  value={formData.keywords} 
                  onChange={(e) => setFormData({...formData, keywords: e.target.value})} 
                  placeholder="marketing, instagram, story"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  <Save className="w-4 h-4 mr-2" /> Save Asset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    {asset.type === 'image' ? (
                      <img src={asset.asset_url} alt={asset.title} className="w-16 h-10 object-cover rounded bg-gray-100" />
                    ) : (
                      <div className="w-16 h-10 flex items-center justify-center bg-gray-100 rounded">
                        {asset.type === 'video' ? <Video className="w-4 h-4 text-gray-400" /> : <LinkIcon className="w-4 h-4 text-gray-400" />}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{asset.title}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{asset.caption}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      asset.category === 'thrive' ? 'bg-teal-50 text-teal-700' :
                      asset.category === 'ai' ? 'bg-pink-50 text-pink-700' :
                      'bg-blue-50 text-blue-700'
                    }>
                      {asset.category === 'thrive' ? 'Thrive Nut' :
                       asset.category === 'ai' ? 'AI Toolbox' : 'Nuts + Bots'}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{asset.type}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(asset)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                        if(confirm('Are you sure you want to delete this asset?')) deleteMutation.mutate(asset.id);
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No assets found. Add one above!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}