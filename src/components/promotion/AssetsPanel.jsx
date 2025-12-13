import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Save, Trash2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const assetTypeLabels = {
  raw_clip: 'Raw Clip',
  thumbnail: 'Thumbnail',
  cover: 'Cover',
  overlay: 'Overlay',
  background: 'Background',
  final_export: 'Final Export',
  transcript: 'Transcript',
  project_link: 'Project Link'
};

const statusColors = {
  planned: 'bg-gray-100 text-gray-700',
  generated: 'bg-blue-100 text-blue-700',
  edited: 'bg-purple-100 text-purple-700',
  final: 'bg-green-100 text-green-700'
};

export default function AssetsPanel({ contentCardId, isLocked }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({
    asset_type: 'raw_clip',
    url: '',
    status: 'planned',
    format: '',
    layer_role: '',
    version_label: 'v1',
    notes: ''
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assetLinks', contentCardId],
    queryFn: () => base44.entities.AssetLink.filter({ content_card_id: contentCardId }),
    enabled: !!contentCardId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AssetLink.create({ ...data, content_card_id: contentCardId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetLinks'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AssetLink.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetLinks'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AssetLink.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assetLinks'] }),
  });

  const handleAdd = () => {
    setEditingAsset(null);
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      asset_type: asset.asset_type,
      url: asset.url,
      status: asset.status || 'planned',
      format: asset.format || '',
      layer_role: asset.layer_role || '',
      version_label: asset.version_label || 'v1',
      notes: asset.notes || ''
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Delete this asset link?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      asset_type: 'raw_clip',
      url: '',
      status: 'planned',
      format: '',
      layer_role: '',
      version_label: 'v1',
      notes: ''
    });
    setEditingAsset(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assets</CardTitle>
          <Button size="sm" onClick={handleAdd} disabled={isLocked}>
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {assets.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-4">No assets yet</p>
        ) : (
          assets.map(asset => (
            <div key={asset.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{assetTypeLabels[asset.asset_type]}</span>
                    <Badge className={`text-xs ${statusColors[asset.status]}`}>
                      {asset.status}
                    </Badge>
                    {asset.version_label && (
                      <Badge variant="outline" className="text-xs">{asset.version_label}</Badge>
                    )}
                  </div>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                  >
                    {asset.url}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                  {asset.format && (
                    <p className="text-xs text-gray-500 mt-1">Format: {asset.format}</p>
                  )}
                  {asset.layer_role && (
                    <p className="text-xs text-gray-500">Layer: {asset.layer_role}</p>
                  )}
                  {asset.notes && (
                    <p className="text-xs text-gray-600 mt-1 italic">{asset.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(asset)} disabled={isLocked}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(asset.id)} disabled={isLocked}>
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAsset ? 'Edit Asset Link' : 'Add Asset Link'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Asset Type</Label>
              <Select value={formData.asset_type} onValueChange={(v) => setFormData({ ...formData, asset_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(assetTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>URL *</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="generated">Generated</SelectItem>
                    <SelectItem value="edited">Edited</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Version</Label>
                <Select value={formData.version_label} onValueChange={(v) => setFormData({ ...formData, version_label: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v1">v1</SelectItem>
                    <SelectItem value="v2">v2</SelectItem>
                    <SelectItem value="final">final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Format</Label>
                <Select value={formData.format} onValueChange={(v) => setFormData({ ...formData, format: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Layer Role</Label>
                <Select value={formData.layer_role} onValueChange={(v) => setFormData({ ...formData, layer_role: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    <SelectItem value="background">Background</SelectItem>
                    <SelectItem value="overlay">Overlay</SelectItem>
                    <SelectItem value="transparent">Transparent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Asset notes..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={!formData.url}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}