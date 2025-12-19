import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, FileText, Link as LinkIcon, Plus, Check, X, ExternalLink } from 'lucide-react';

export default function GroupResourcesTab({ group, currentUser, myMembership, isAdmin }) {
  const queryClient = useQueryClient();
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', description: '', type: 'link', url: '' });

  const { data: resources = [] } = useQuery({
    queryKey: ['groupResources', group.id],
    queryFn: () => base44.entities.GroupResource.filter({ group_id: group.id }, '-created_date'),
  });

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupResource.create({ 
      ...data, 
      group_id: group.id, 
      submitted_by: currentUser.email,
      status: isAdmin ? 'approved' : 'pending', // Admins auto-approve their own
      approved_by: isAdmin ? currentUser.email : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupResources', group.id]);
      setIsSubmitOpen(false);
      setNewResource({ title: '', description: '', type: 'link', url: '' });
    }
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.GroupResource.update(id, { 
      status, 
      approved_by: currentUser.email 
    }),
    onSuccess: () => queryClient.invalidateQueries(['groupResources', group.id])
  });

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
        <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Share Resource</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share with Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select value={newResource.type} onValueChange={v => setNewResource({...newResource, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">YouTube Video</SelectItem>
                  <SelectItem value="article">Article / Blog</SelectItem>
                  <SelectItem value="link">Other Link</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Title" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} />
              <Input placeholder="URL" value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} />
              <Textarea placeholder="Why is this helpful?" value={newResource.description} onChange={e => setNewResource({...newResource, description: e.target.value})} />
              
              <Button onClick={() => submitMutation.mutate(newResource)} disabled={!newResource.url} className="w-full">
                {isAdmin ? 'Add Resource' : 'Submit for Review'}
              </Button>
            </div>
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
                  <h4 className="font-semibold">{resource.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{resource.description}</p>
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 text-sm text-purple-600 mt-2 hover:underline"
                  >
                    Open Resource <ExternalLink className="w-3 h-3" />
                  </a>
                  {resource.submitted_by && isAdmin && (
                    <p className="text-xs text-gray-400 mt-2">Shared by: {resource.submitted_by}</p>
                  )}
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