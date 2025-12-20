import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pin, MessageSquare, Trash2, Pencil } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import LevelSelector from './LevelSelector';

export default function GroupFeedTab({ group, currentUser, myMembership, isAdmin }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', is_pinned: false, target_levels: [] });

  const { data: posts = [] } = useQuery({
    queryKey: ['groupPosts', group.id],
    queryFn: () => base44.entities.GroupPost.filter({ group_id: group.id }, '-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupPost.create({ ...data, group_id: group.id, author_email: currentUser.email }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupPosts', group.id]);
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupPost.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupPosts', group.id]);
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupPosts', group.id])
  });

  const handleEdit = (post) => {
    setEditingId(post.id);
    setFormData({
      title: post.title,
      content: post.content || '',
      is_pinned: post.is_pinned || false,
      target_levels: post.target_levels || []
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ title: '', content: '', is_pinned: false, target_levels: [] });
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filter posts based on visibility
  const visiblePosts = posts.filter(post => {
    if (isAdmin) return true;
    if (!post.target_levels || post.target_levels.length === 0) return true;
    return post.target_levels.includes(myMembership?.level);
  });

  const pinnedPosts = visiblePosts.filter(p => p.is_pinned);
  const regularPosts = visiblePosts.filter(p => !p.is_pinned);

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Post</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Post' : 'Create Announcement'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input 
                  placeholder="Title" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                />
                <div className="h-64 mb-12">
                  <ReactQuill 
                    theme="snow" 
                    value={formData.content} 
                    onChange={v => setFormData({...formData, content: v})} 
                    className="h-48"
                  />
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={formData.is_pinned} 
                      onChange={e => setFormData({...formData, is_pinned: e.target.checked})} 
                    />
                    Pin to top
                  </label>
                  
                  <LevelSelector 
                    group={group} 
                    selectedLevels={formData.target_levels} 
                    onChange={(levels) => setFormData({...formData, target_levels: levels})} 
                  />
                </div>
                <Button onClick={handleSubmit} disabled={!formData.title} className="w-full">
                  {editingId ? 'Update Post' : 'Post'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {pinnedPosts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
            <Pin className="w-4 h-4" /> Pinned
          </h3>
          {pinnedPosts.map(post => (
            <PostCard 
              key={post.id} 
              post={{...post, onEdit: () => handleEdit(post)}} 
              isAdmin={isAdmin} 
              onDelete={() => deleteMutation.mutate(post.id)} 
            />
          ))}
        </div>
      )}

      <div className="space-y-4">
        {regularPosts.map(post => (
          <PostCard 
            key={post.id} 
            post={{...post, onEdit: () => handleEdit(post)}} 
            isAdmin={isAdmin} 
            onDelete={() => deleteMutation.mutate(post.id)} 
          />
        ))}
        {visiblePosts.length === 0 && (
          <div className="text-center py-12 text-gray-500">No posts yet.</div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, isAdmin, onDelete }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-lg">{post.title}</CardTitle>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <span>{new Date(post.created_date).toLocaleDateString()}</span>
            {post.target_levels?.length > 0 && (
              <Badge variant="outline" className="text-[10px]">{post.target_levels.join(', ')} only</Badge>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={post.onEdit} className="text-gray-500 hover:text-purple-600">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: post.content }} />
      </CardContent>
    </Card>
  );
}