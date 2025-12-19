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
import { Plus, Pin, MessageSquare, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function GroupFeedTab({ group, currentUser, myMembership, isAdmin }) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', is_pinned: false, target_levels: [] });

  const { data: posts = [] } = useQuery({
    queryKey: ['groupPosts', group.id],
    queryFn: () => base44.entities.GroupPost.filter({ group_id: group.id }, '-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupPost.create({ ...data, group_id: group.id, author_email: currentUser.email }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupPosts', group.id]);
      setIsCreateOpen(false);
      setNewPost({ title: '', content: '', is_pinned: false, target_levels: [] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupPosts', group.id])
  });

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
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> New Post</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input 
                  placeholder="Title" 
                  value={newPost.title} 
                  onChange={e => setNewPost({...newPost, title: e.target.value})} 
                />
                <div className="h-64 mb-12">
                  <ReactQuill 
                    theme="snow" 
                    value={newPost.content} 
                    onChange={v => setNewPost({...newPost, content: v})} 
                    className="h-48"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={newPost.is_pinned} 
                      onChange={e => setNewPost({...newPost, is_pinned: e.target.checked})} 
                    />
                    Pin to top
                  </label>
                  {group.member_levels?.length > 0 && (
                    <div className="flex-1">
                      <Select 
                        value={newPost.target_levels[0] || 'all'} 
                        onValueChange={v => setNewPost({...newPost, target_levels: v === 'all' ? [] : [v]})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Target Audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Everyone</SelectItem>
                          {group.member_levels.map(level => (
                            <SelectItem key={level} value={level}>{level} Only</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <Button onClick={() => createMutation.mutate(newPost)} disabled={!newPost.title} className="w-full">Post</Button>
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
            <PostCard key={post.id} post={post} isAdmin={isAdmin} onDelete={() => deleteMutation.mutate(post.id)} />
          ))}
        </div>
      )}

      <div className="space-y-4">
        {regularPosts.map(post => (
          <PostCard key={post.id} post={post} isAdmin={isAdmin} onDelete={() => deleteMutation.mutate(post.id)} />
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
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: post.content }} />
      </CardContent>
    </Card>
  );
}