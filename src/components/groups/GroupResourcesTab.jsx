import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, FileText, Link as LinkIcon, Plus, Check, X, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import LevelSelector from './LevelSelector';

export default function GroupResourcesTab({ group, currentUser, myMembership, isAdmin }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', description: '', type: 'link', url: '', target_levels: [] 
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['groupResources', group.id],
    queryFn: () => base44.entities.GroupResource.filter({ group_id: group.id }, '-created_date'),
  });

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupResource.create({ 
      ...data, 
      group_id: group.id, 
      submitted_by: currentUser?.email,
      status: isAdmin ? 'approved' : 'pending', 
      approved_by: isAdmin ? currentUser?.email : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupResources', group.id]);
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupResource.update(editingId, {
      ...data,
      edited_by: currentUser?.email,
      edited_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupResources', group.id]);
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupResource.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupResources', group.id])
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.GroupResource.update(id, { 
      status, 
      approved_by: currentUser?.email 
    }),
    onSuccess: () => queryClient.invalidateQueries(['groupResources', group.id])
  });

  const handleEdit = (resource) => {
    setEditingId(resource.id);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      url: resource.url,
      target_levels: resource.target_levels || []
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ title: '', description: '', type: 'link', url: '', target_levels: [] });
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      submitMutation.mutate(formData);
    }
  };

  const approvedResources = resources.filter(r => r.status === 'approved');
  const pendingResources = resources.filter(r => r.status === 'pending');

  const visibleResources = approvedResources.filter(r => {
    if (isAdmin) return true;
    if (!r.target_levels || r.target_levels.length === 0) return true;
    return r.target_levels.includes(myMembership?.level);
  });

  const getIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-red-500" />;
      case 'article': return <FileText className="w-5 h-5 text-blue-500" />;
      default: return <LinkIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Shared Resources</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Share Resource</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Resource' : 'Share with Group'}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">YouTube Video</SelectItem>
                  <SelectItem value="article">Article / Blog</SelectItem>
                  <SelectItem value="link">Website Link</SelectItem>
                  <SelectItem value="text">Message / Contact Info</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              
              {formData.type !== 'text' && (
                <Input placeholder="URL (https://...)" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
              )}
              
              <div className="h-48 mb-12">
                <ReactQuill 
                  theme="snow" 
                  value={formData.description} 
                  onChange={v => setFormData({...formData, description: v})} 
                  className="h-36"
                  placeholder="Why is this helpful?"
                />
              </div>

              {isAdmin && (
                <LevelSelector 
                  group={group} 
                  selectedLevels={formData.target_levels} 
                  onChange={(levels) => setFormData({...formData, target_levels: levels})} 
                />
              )}
              
              </div>
            </div>
              <DialogFooter className="mt-auto">
                <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!formData.title || (formData.type !== 'text' && !formData.url)}>
                  {editingId ? 'Update Resource' : (isAdmin ? 'Add Resource' : 'Submit for Review')}
                </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="library" className="w-full">
        <TabsList>
          <TabsTrigger value="library">Library ({visibleResources.length})</TabsTrigger>
          {isAdmin && pendingResources.length > 0 && (
            <TabsTrigger value="pending" className="text-amber-600">Pending Review ({pendingResources.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="library" className="grid gap-4 mt-4">
          {visibleResources.map(resource => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex gap-4 items-start">
                <div className="p-3 bg-gray-100 rounded-lg">{getIcon(resource.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-semibold">{resource.title}</h4>
                    {(isAdmin || resource.submitted_by === currentUser?.email) && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(resource)} className="text-gray-500 h-6 w-6 p-0 hover:text-purple-600" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(resource.id)} className="text-red-500 h-6 w-6 p-0" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="prose prose-sm text-gray-600 max-w-none" dangerouslySetInnerHTML={{ __html: resource.description }} />
                  {resource.url && (
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-sm text-purple-600 mt-2 hover:underline"
                    >
                      Open Resource <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <div className="text-xs text-gray-400 mt-2 space-y-1">
                    {resource.submitted_by && isAdmin && (
                      <p>Shared by: {resource.submitted_by}</p>
                    )}
                    {resource.edited_by && (
                      <p className="italic text-purple-400">
                        Edited by {resource.edited_by === currentUser?.email ? 'you' : resource.edited_by} on {new Date(resource.edited_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {visibleResources.length === 0 && <div className="text-center py-8 text-gray-500">No resources shared yet.</div>}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending" className="grid gap-4 mt-4">
            {pendingResources.map(resource => (
              <Card key={resource.id} className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-white">{resource.type}</Badge>
                        <span className="text-sm text-gray-500">Submitted by: {resource.submitted_by}</span>
                      </div>
                      <h4 className="font-bold">{resource.title}</h4>
                      <p className="text-sm text-gray-700 my-2">{resource.description}</p>
                      <a href={resource.url} target="_blank" className="text-blue-600 underline text-sm truncate block max-w-md">{resource.url}</a>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(resource)} className="text-gray-600 border-gray-200 bg-white">
                        <Pencil className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate({ id: resource.id, status: 'rejected' })} className="text-red-600 border-red-200 bg-white">
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => reviewMutation.mutate({ id: resource.id, status: 'approved' })} className="bg-green-600 hover:bg-green-700 text-white">
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}