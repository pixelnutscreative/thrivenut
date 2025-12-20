import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pin, MessageSquare, Trash2, Pencil, Calendar, Link as LinkIcon, Video, CheckCircle, EyeOff, FileText, Check, Circle } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import LevelSelector from './LevelSelector';

export default function GroupFeedTab({ group, currentUser, myMembership, isAdmin }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', is_pinned: false, target_levels: [] });

  // 1. Fetch Posts
  const { data: posts = [] } = useQuery({
    queryKey: ['groupPosts', group.id],
    queryFn: () => base44.entities.GroupPost.filter({ group_id: group.id }, '-created_date'),
  });

  // 2. Fetch Events
  const { data: events = [] } = useQuery({
    queryKey: ['groupEvents', group.id],
    queryFn: () => base44.entities.GroupEvent.filter({ group_id: group.id }, '-created_date'),
  });

  // 3. Fetch Resources
  const { data: resources = [] } = useQuery({
    queryKey: ['groupResources', group.id],
    queryFn: () => base44.entities.GroupResource.filter({ group_id: group.id }, '-created_date'),
  });

  // 4. Fetch Trainings & Completions
  const { data: trainings = [] } = useQuery({
    queryKey: ['groupTraining', group.id],
    queryFn: () => base44.entities.GroupTraining.filter({ group_id: group.id, active: true }, '-created_date'),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['myCompletions', group.id, currentUser.email],
    queryFn: () => base44.entities.GroupTrainingCompletion.filter({ user_email: currentUser.email }),
  });
  
  // 5. Fetch Hidden Preferences
  const { data: userGroupPref } = useQuery({
    queryKey: ['userGroupPref', group.id, currentUser.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserGroupPreference.filter({ 
        group_id: group.id, 
        user_email: currentUser.email 
      });
      return prefs[0] || null;
    }
  });

  const hiddenIds = userGroupPref?.hidden_feed_items || [];

  // --- Mutations ---
  const createPostMutation = useMutation({
    mutationFn: async (data) => {
      const post = await base44.entities.GroupPost.create({ ...data, group_id: group.id, author_email: currentUser.email });
      
      // Send notifications to group members
      try {
        await base44.functions.invoke('notifyGroupMembers', {
          group_id: group.id,
          title: `New Post: ${group.name}`,
          message: data.title,
          type: 'group_post',
          link: `/CreatorGroups?id=${group.id}&tab=feed`
        });
      } catch (err) {
        console.error("Failed to send notifications", err);
      }
      
      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupPosts', group.id]);
      handleCloseDialog();
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupPost.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupPosts', group.id]);
      handleCloseDialog();
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupPosts', group.id])
  });

  const hideItemMutation = useMutation({
    mutationFn: async (itemId) => {
      const newHidden = [...hiddenIds, itemId];
      if (userGroupPref) {
        return base44.entities.UserGroupPreference.update(userGroupPref.id, { hidden_feed_items: newHidden });
      } else {
        return base44.entities.UserGroupPreference.create({
          group_id: group.id,
          user_email: currentUser.email,
          hidden_feed_items: newHidden
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['userGroupPref'])
  });

  const toggleTrainingCompletion = useMutation({
    mutationFn: async (trainingId) => {
      const existing = completions.find(c => c.training_id === trainingId);
      if (existing) {
        return base44.entities.GroupTrainingCompletion.delete(existing.id);
      } else {
        return base44.entities.GroupTrainingCompletion.create({
          training_id: trainingId,
          user_email: currentUser.email,
          completed_date: new Date().toISOString()
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['myCompletions'])
  });

  // --- Handlers ---
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
      updatePostMutation.mutate(formData);
    } else {
      createPostMutation.mutate(formData);
    }
  };

  // --- Aggregation & Sorting ---
  const feedItems = useMemo(() => {
    const allItems = [
      ...posts.map(i => ({ ...i, type: 'post' })),
      ...events.map(i => ({ ...i, type: 'event' })),
      ...resources.map(i => ({ ...i, type: 'resource' })),
      ...trainings.map(i => ({ ...i, type: 'training' })),
    ];

    // Filter by visibility (admin or matching level) AND not hidden
    const visible = allItems.filter(item => {
      if (hiddenIds.includes(item.id)) return false;
      if (isAdmin) return true;
      if (!item.target_levels || item.target_levels.length === 0) return true;
      return item.target_levels.includes(myMembership?.level);
    });

    // Sort: Pinned posts first, then by created_date desc
    return visible.sort((a, b) => {
      if (a.type === 'post' && a.is_pinned && !(b.type === 'post' && b.is_pinned)) return -1;
      if (!(a.type === 'post' && a.is_pinned) && b.type === 'post' && b.is_pinned) return 1;
      return new Date(b.created_date) - new Date(a.created_date);
    });
  }, [posts, events, resources, trainings, hiddenIds, isAdmin, myMembership]);

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

      <div className="space-y-4">
        {feedItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No activity yet.</div>
        ) : (
          feedItems.map(item => (
            <FeedItemCard 
              key={`${item.type}-${item.id}`} 
              item={item} 
              isAdmin={isAdmin}
              currentUser={currentUser}
              onEdit={item.type === 'post' ? () => handleEdit(item) : null}
              onDelete={item.type === 'post' ? () => deletePostMutation.mutate(item.id) : null}
              onHide={() => hideItemMutation.mutate(item.id)}
              onToggleComplete={() => toggleTrainingCompletion.mutate(item.id)}
              isCompleted={completions.some(c => c.training_id === item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FeedItemCard({ item, isAdmin, currentUser, onEdit, onDelete, onHide, onToggleComplete, isCompleted }) {
  const getIcon = () => {
    switch(item.type) {
      case 'post': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'event': return <Calendar className="w-4 h-4 text-green-500" />;
      case 'resource': return <LinkIcon className="w-4 h-4 text-purple-500" />;
      case 'training': return <Video className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch(item.type) {
      case 'post': return 'Post';
      case 'event': return 'Event';
      case 'resource': return 'Resource';
      case 'training': return 'Training';
      default: return 'Item';
    }
  };

  return (
    <Card className={`transition-all hover:shadow-md ${item.is_pinned ? 'border-l-4 border-l-blue-500' : ''}`}>
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
              {getIcon()} {getLabel()}
            </Badge>
            {item.is_pinned && <Badge className="bg-blue-100 text-blue-700 text-[10px]"><Pin className="w-3 h-3 mr-1" /> Pinned</Badge>}
            <span className="text-xs text-gray-400">{new Date(item.created_date).toLocaleDateString()}</span>
          </div>
          <CardTitle className="text-lg">{item.title}</CardTitle>
          {item.target_levels?.length > 0 && (
            <div className="mt-1">
              <Badge variant="outline" className="text-[10px] text-gray-400">{item.target_levels.join(', ')} only</Badge>
            </div>
          )}
        </div>
        
        <div className="flex gap-1">
          {item.type === 'training' && (
            <Button 
              variant={isCompleted ? "default" : "outline"} 
              size="sm" 
              onClick={onToggleComplete} 
              className={`h-8 gap-1 ${isCompleted ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              {isCompleted ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
              {isCompleted ? 'Completed' : 'Mark Complete'}
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={onHide} className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0" title="Hide from feed">
            <EyeOff className="w-4 h-4" />
          </Button>

          {isAdmin && item.type === 'post' && (
            <>
              <Button variant="ghost" size="sm" onClick={onEdit} className="text-gray-400 hover:text-purple-600 h-8 w-8 p-0">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete} className="text-gray-400 hover:text-red-500 h-8 w-8 p-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {item.type === 'post' && (
          <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: item.content }} />
        )}
        
        {item.type === 'event' && (
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="font-semibold">{new Date(item.start_time).toLocaleString()}</span>
            </div>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.description }} />
          </div>
        )}

        {item.type === 'resource' && (
          <div className="text-sm text-gray-600 space-y-2">
            <p>{item.description}</p>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> Open Resource
            </a>
          </div>
        )}

        {item.type === 'training' && (
          <div className="text-sm text-gray-600 space-y-2">
             <p>{item.description}</p>
             {item.video_url && (
                <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline flex items-center gap-1">
                  <Video className="w-3 h-3" /> Watch Video
                </a>
             )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}