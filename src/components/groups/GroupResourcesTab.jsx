import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useTheme } from '../shared/useTheme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, FileText, Link as LinkIcon, Plus, Check, X, ExternalLink, Pencil, Trash2, Loader2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import LevelSelector from './LevelSelector';
import ContentQAModal from './ContentQAModal';

export default function GroupResourcesTab({ group, currentUser, myMembership, isAdmin }) {
  const { preferences } = useTheme();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const customCategories = group.settings?.resource_categories || ['General', 'Important Links', 'Downloads'];
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [formData, setFormData] = useState({ 
    title: '', description: '', type: 'link', url: '', category: customCategories[0] || 'General', target_levels: [] 
  });

  const [expandedResource, setExpandedResource] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const mapUserResourceCategory = (cat) => {
    if (!cat) return 'link';
    const lower = cat.toLowerCase();
    if (lower.includes('video')) return 'video';
    if (lower.includes('audio') || lower.includes('podcast')) return 'audio';
    if (lower.includes('image') || lower.includes('photo')) return 'image';
    if (lower.includes('pdf') || lower.includes('doc')) return 'file';
    return 'link';
  };

  const { data: resources = [] } = useQuery({
    queryKey: ['groupResources', group.id],
    queryFn: async () => {
        const response = await base44.functions.invoke('fetchGroupResources', { groupId: group.id });
        return response.data.resources || [];
    },
  });

  // Handle Edit from URL
  useEffect(() => {
    const editId = searchParams.get('editId');
    if (editId && resources.length > 0 && !isDialogOpen && !editingId) {
      const resource = resources.find(r => r.id === editId);
      if (resource) {
        handleEdit(resource);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('editId');
        setSearchParams(newParams);
      }
    }
  }, [searchParams, resources]);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      // Validate mandatory fields
      if (!data.title) throw new Error('Title is required');
      if (data.type !== 'text' && !data.url) throw new Error('URL is required for this resource type');
      
      const resource = await base44.entities.GroupResource.create({ 
        ...data, 
        group_id: group.id, 
        submitted_by: currentUser?.email,
        status: isAdmin ? 'approved' : 'pending', 
        approved_by: isAdmin ? currentUser?.email : null
      });

      if (isAdmin) {
        try {
          await base44.functions.invoke('notifyGroupMembers', {
            group_id: group.id,
            title: `New Resource: ${group.name}`,
            message: `New resource added: ${data.title}`,
            type: 'group_resource',
            link: `/CreatorGroups?id=${group.id}&tab=resources`
          });
        } catch (err) {
          console.error("Failed to send notifications", err);
        }
      }
      return resource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupResources', group.id]);
      handleCloseDialog();
    },
    onError: (err) => {
      alert(`Error saving resource: ${err.message}`);
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
    mutationFn: async ({ id, status }) => {
      const updated = await base44.entities.GroupResource.update(id, { 
        status, 
        approved_by: currentUser?.email 
      });

      if (status === 'approved') {
        try {
          // Fetch resource title if needed, but we can just say "New Resource"
          await base44.functions.invoke('notifyGroupMembers', {
            group_id: group.id,
            title: `New Resource: ${group.name}`,
            message: `A new resource has been approved and added to the library.`,
            type: 'group_resource',
            link: `/CreatorGroups?id=${group.id}&tab=resources`
          });
        } catch (err) {
          console.error("Failed to send notifications", err);
        }
      }
      return updated;
    },
    onSuccess: () => queryClient.invalidateQueries(['groupResources', group.id])
  });

  const handleEdit = (resource) => {
    setEditingId(resource.id);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      url: resource.url,
      category: resource.category || customCategories[0] || 'General',
      target_levels: resource.target_levels || []
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ title: '', description: '', type: 'link', url: '', category: customCategories[0] || 'General', target_levels: [] });
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      submitMutation.mutate(formData);
    }
  };

  const handleDuplicate = (resource) => {
    const newResource = {
      ...resource,
      title: `${resource.title} (Copy)`,
      status: isAdmin ? 'approved' : 'pending',
      submitted_by: currentUser?.email,
      approved_by: isAdmin ? currentUser?.email : null
    };
    delete newResource.id;
    delete newResource.created_date;
    delete newResource.updated_date;
    
    submitMutation.mutate(newResource);
  };

  const approvedResources = resources.filter(r => r.status === 'approved');
  const pendingResources = resources.filter(r => r.status === 'pending');

  const visibleResources = approvedResources.filter(r => {
    // 1. Role Check
    let hasRoleAccess = false;
    if (isAdmin) hasRoleAccess = true;
    else if (!r.target_levels || r.target_levels.length === 0) hasRoleAccess = true;
    else if (r.target_levels.includes(myMembership?.level)) hasRoleAccess = true;

    if (!hasRoleAccess) return false;

    // 2. Category Check
    if (categoryFilter !== 'All') {
      const rCat = r.category || customCategories[0] || 'General';
      if (rCat !== categoryFilter) return false;
    }

    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-red-500" />;
      case 'article': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'file': return <FileText className="w-5 h-5 text-orange-500" />;
      default: return <LinkIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const allowedResourceLevels = group.settings?.allowed_resource_levels || ['Member'];
  const canUpload = isAdmin || allowedResourceLevels.includes(myMembership?.level);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Shared Resources</h3>
        {canUpload && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setIsDialogOpen(true)} 
              className="text-white hover:opacity-90"
              style={{ backgroundColor: preferences?.primary_color }}
            >
              <Plus className="w-4 h-4 mr-2" /> Share Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Resource' : 'Share with Group'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Resource Type</Label>
                  <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[60]">
                      <SelectItem value="video">YouTube Video</SelectItem>
                      <SelectItem value="article">Article / Blog</SelectItem>
                      <SelectItem value="link">Website Link</SelectItem>
                      <SelectItem value="file">PDF / File Upload</SelectItem>
                      <SelectItem value="text">Message / Contact Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[60]">
                      {customCategories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              
              {formData.type === 'file' ? (
                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="file" 
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setIsUploading(true);
                        try {
                           const res = await base44.integrations.Core.UploadFile({ file });
                           if (res.file_url) {
                              setFormData({...formData, url: res.file_url});
                           }
                        } catch (err) {
                           alert('Upload failed: ' + err.message);
                        } finally {
                           setIsUploading(false);
                        }
                      }}
                    />
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
                  </div>
                  {formData.url && <p className="text-xs text-green-600 break-all">{formData.url}</p>}
                </div>
              ) : formData.type !== 'text' && (
                <Input placeholder="URL (https://...)" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
              )}
              
              <div className="h-48 mb-12">
                <ReactQuill 
                  theme="snow" 
                  value={formData.description} 
                  onChange={v => setFormData({...formData, description: v})} 
                  className="h-36"
                  placeholder="Why is this helpful?"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, false] }],
                      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                      [{'list': 'ordered'}, {'list': 'bullet'}],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                />
              </div>

              {formData.type === 'video' && (
                  <div className="space-y-2">
                    <Label>Transcript (for AI)</Label>
                    <Textarea 
                        value={formData.transcript || ''} 
                        onChange={e => setFormData({...formData, transcript: e.target.value})} 
                        placeholder="Paste transcript..."
                        rows={3}
                    />
                  </div>
              )}

              {isAdmin && (
                <LevelSelector 
                  group={group} 
                  selectedLevels={formData.target_levels} 
                  onChange={(levels) => setFormData({...formData, target_levels: levels})} 
                />
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!formData.title || (formData.type !== 'text' && !formData.url) || submitMutation.isPending || updateMutation.isPending || isUploading}>
                  {submitMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingId ? 'Update Resource' : (isAdmin ? 'Add Resource' : 'Submit for Review'))}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Tabs defaultValue="library" className="w-full">
        <TabsList>
          <TabsTrigger value="library">Library ({visibleResources.length})</TabsTrigger>
          {isAdmin && pendingResources.length > 0 && (
            <TabsTrigger value="pending" className="text-amber-600">Pending Review ({pendingResources.length})</TabsTrigger>
          )}
        </TabsList>

        {/* Category Filters */}
        <div className="flex overflow-x-auto gap-2 py-4 custom-scrollbar">
          <Button 
            variant={categoryFilter === 'All' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-full shrink-0"
            onClick={() => setCategoryFilter('All')}
            style={categoryFilter === 'All' ? { backgroundColor: preferences?.primary_color } : {}}
          >
            All Resources
          </Button>
          {customCategories.map(cat => (
            <Button 
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'} 
              size="sm" 
              className="rounded-full shrink-0"
              onClick={() => setCategoryFilter(cat)}
              style={categoryFilter === cat ? { backgroundColor: preferences?.primary_color } : {}}
            >
              {cat}
            </Button>
          ))}
        </div>

        <TabsContent value="library" className="grid gap-4 mt-4">
          {visibleResources.map(resource => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex gap-4 items-start">
                <div className="p-3 bg-gray-100 rounded-lg">{getIcon(resource.type)}</div>
                <div className="flex-1 w-full" onClick={() => setExpandedResource(expandedResource === resource.id ? null : resource.id)}>
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold hover:text-purple-600 cursor-pointer pr-4">{resource.title}</h4>
                    <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {resource.is_shared ? (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50 h-6">
                          Shared from My Stuff
                        </Badge>
                      ) : (
                        (isAdmin || resource.submitted_by === currentUser?.email) && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(resource)} className="text-gray-500 hover:text-purple-600" title="Edit">
                              <Pencil className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDuplicate(resource)} className="text-gray-500 hover:text-blue-600" title="Duplicate">
                              <Plus className="w-5 h-5" />
                            </Button>
                            {isAdmin && (
                              <Button variant="ghost" size="icon" onClick={() => { if(window.confirm('Delete this resource?')) deleteMutation.mutate(resource.id) }} className="text-red-500" title="Delete">
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            )}
                          </>
                        )
                      )}
                    </div>
                  </div>
                  <div className={`prose prose-sm text-gray-600 max-w-none ${expandedResource === resource.id ? '' : 'line-clamp-3'}`} dangerouslySetInnerHTML={{ __html: resource.description }} />
                  {expandedResource !== resource.id && resource.description?.length > 100 && (
                    <div className="text-purple-600 text-sm mt-1 cursor-pointer hover:underline">Read more</div>
                  )}
                  {expandedResource === resource.id && (
                    <>
                      {resource.url && (
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 text-sm text-purple-600 mt-2 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          Open Resource <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      
                      {resource.transcript && (
                          <div className="mt-2" onClick={e => e.stopPropagation()}>
                              <ContentQAModal transcript={resource.transcript} contentTitle={resource.title} />
                          </div>
                      )}
                    </>
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