import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pin, MessageSquare, Trash2, Pencil, Calendar, Link as LinkIcon, Video, CheckCircle, Eye, EyeOff, FileText, Share2, CalendarPlus, Globe, History, ExternalLink, Briefcase, Printer, Sparkles, Clock } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import LevelSelector from './LevelSelector';
import ShareDialog from './ShareDialog';
import AddToDayDialog from './AddToDayDialog';
import { useTheme } from '../shared/useTheme';

export default function GroupFeedTab({ group, currentUser, myMembership, isAdmin }) {
  const { preferences } = useTheme();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', is_pinned: false, is_public: false, target_levels: [], target_roles: [] });
  const [showHidden, setShowHidden] = useState(false);
  const canPostPublicly = isAdmin || preferences?.can_create_public_ads;

  // 1. Fetch Posts (Announcements)
  const { data: posts = [] } = useQuery({
    queryKey: ['groupPosts', group.id],
    queryFn: () => base44.entities.GroupPost.filter({ group_id: group.id }, '-created_date'),
  });

  // 1b. Fetch Discussion Posts
  const { data: discussions = [] } = useQuery({
    queryKey: ['groupDiscussion', group.id],
    queryFn: () => base44.entities.GroupDiscussionPost.filter({ group_id: group.id }, '-updated_date'),
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

  // 5. Fetch Q&A
  const { data: qnas = [] } = useQuery({
    queryKey: ['groupQnA', group.id],
    queryFn: () => base44.entities.GroupQnA.filter({ group_id: group.id, is_public: true }, '-created_date'),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['myCompletions', group.id, currentUser?.email],
    queryFn: () => base44.entities.GroupTrainingCompletion.filter({ user_email: currentUser?.email }),
  });

  // 6. Fetch Meetings
  const { data: meetings = [] } = useQuery({
    queryKey: ['groupMeetings', group.id],
    queryFn: () => base44.entities.MeetingRecording.filter({ group_id: group.id }, '-meeting_date'),
  });

  // 7. Fetch Projects
  const { data: projects = [] } = useQuery({
    queryKey: ['groupProjects', group.id],
    queryFn: () => base44.entities.GroupProject.filter({ group_id: group.id }, '-updated_date'),
  });

  // 8. Fetch Marketing Orders
  const { data: orders = [] } = useQuery({
    queryKey: ['groupOrders', group.id],
    queryFn: () => base44.entities.MarketingOrder.filter({ group_id: group.id }, '-updated_date'),
  });

  // 9. Fetch Assets
  const { data: assets = [] } = useQuery({
    queryKey: ['groupAssets', group.id],
    queryFn: () => base44.entities.MarketingAsset.filter({ group_id: group.id }, '-created_date'),
  });
  
  // 6. Fetch Hidden Preferences
  // 10. Fetch Hidden Preferences
  const { data: userGroupPref } = useQuery({
    queryKey: ['userGroupPref', group.id, currentUser?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserGroupPreference.filter({ 
        group_id: group.id, 
        user_email: currentUser?.email 
      });
      return prefs[0] || null;
    }
  });

  const hiddenIds = userGroupPref?.hidden_feed_items || [];

  // --- Mutations ---
  const createPostMutation = useMutation({
    mutationFn: async (data) => {
      const post = await base44.entities.GroupPost.create({ ...data, group_id: group.id, author_email: currentUser?.email });
      
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
          user_email: currentUser?.email,
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
          user_email: currentUser?.email,
          completed_date: new Date().toISOString()
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['myCompletions'])
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, type, currentPinnedState }) => {
      const field = type === 'discussion' ? 'pinned' : 'is_pinned';
      const entityMap = {
        'post': 'GroupPost',
        'discussion': 'GroupDiscussionPost',
        'event': 'GroupEvent',
        'resource': 'GroupResource',
        'training': 'GroupTraining'
      };
      
      const entityName = entityMap[type];
      if (!entityName) return; // Not pinnable

      return base44.entities[entityName].update(id, { [field]: !currentPinnedState });
    },
    onSuccess: () => {
      // Invalidate all potential queries to refresh the feed
      queryClient.invalidateQueries(['groupPosts', group.id]);
      queryClient.invalidateQueries(['groupDiscussion', group.id]);
      queryClient.invalidateQueries(['groupEvents', group.id]);
      queryClient.invalidateQueries(['groupResources', group.id]);
      queryClient.invalidateQueries(['groupTraining', group.id]);
    }
  });

  // --- Handlers ---
  const handleEdit = (item) => {
    if (item.type === 'post') {
        setEditingId(item.id);
        setFormData({
        title: item.title,
        content: item.content || '',
        is_pinned: item.is_pinned || false,
        is_public: item.is_public || false,
        target_levels: item.target_levels || [],
        target_roles: item.target_roles || []
        });
        setIsDialogOpen(true);
    } else {
        // Switch tab and pass editId
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', item.type === 'event' ? 'events' : item.type === 'resource' ? 'resources' : 'training');
        newParams.set('editId', item.id);
        setSearchParams(newParams);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ title: '', content: '', is_pinned: false, is_public: false, target_levels: [], target_roles: [] });
  };

  const handleSubmit = () => {
    if (editingId) {
      updatePostMutation.mutate(formData);
    } else {
      createPostMutation.mutate(formData);
    }
  };

  const navigateToTab = (item) => {
    const newParams = new URLSearchParams(searchParams);
    
    // Set tab based on type
    if (item.type === 'event') newParams.set('tab', 'events');
    else if (item.type === 'resource') newParams.set('tab', 'resources');
    else if (item.type === 'training') newParams.set('tab', 'training');
    else if (item.type === 'qna') newParams.set('tab', 'qna');
    else if (item.type === 'discussion') newParams.set('tab', 'discussion');
    else if (item.type === 'meeting') newParams.set('tab', 'meetings');
    else if (item.type === 'project') newParams.set('tab', 'projects');
    else if (item.type === 'order') newParams.set('tab', 'marketing');
    else if (item.type === 'asset') newParams.set('tab', 'assets');
    
    setSearchParams(newParams);
  };

  // --- Aggregation & Sorting ---
  const feedItems = useMemo(() => {
    const allItems = [
      ...posts.map(i => ({ ...i, type: 'post' })),
      ...discussions.map(i => ({ ...i, type: 'discussion', title: `Discussion: ${i.content?.substring(0, 50)}...`, is_pinned: i.pinned })),
      ...events.map(i => ({ ...i, type: 'event' })),
      ...resources.map(i => ({ ...i, type: 'resource' })),
      ...trainings.map(i => ({ ...i, type: 'training' })),
      ...qnas.map(i => ({ ...i, type: 'qna', title: `Q&A: ${i.question}` })),
      ...meetings.map(i => ({ ...i, type: 'meeting', title: i.title || 'Meeting Recording', created_date: i.meeting_date })),
      ...projects.map(i => ({ ...i, type: 'project' })),
      ...orders.map(i => ({ ...i, type: 'order' })),
      ...assets.map(i => ({ ...i, type: 'asset', title: i.name })),
    ];

    // Filter by visibility (admin or matching level) AND not hidden
    const visible = allItems.filter(item => {
      // 0. Marketing Orders Visibility
      if (item.type === 'order') {
        if (!isAdmin && item.client_email !== currentUser?.email) return false;
      }

      // 1. Pending/Approval Check
      const isPending = item.status && ['pending', 'review', 'draft'].includes(item.status);
      const isAuthor = item.submitted_by === currentUser?.email || item.created_by === currentUser?.email || item.author_email === currentUser?.email;

      if (isPending && !isAdmin && !isAuthor) return false;

      // 2. Hidden Check
      if (!showHidden && hiddenIds.includes(item.id)) return false;

      if (isAdmin) return true; // Admins see everything
      if (isAuthor) return true; // Authors see their own items

      // 3. Role Check
      // If role is undefined/null, we check if target_roles is empty (visible to all roles)
      const myRole = myMembership?.role;
      const roleMatch = !item.target_roles || item.target_roles.length === 0 || (myRole && item.target_roles.includes(myRole));

      // 4. Level Check
      // If level is undefined/null (e.g. legacy members), allow if target_levels is empty.
      const myLevel = myMembership?.level;
      const levelMatch = !item.target_levels || item.target_levels.length === 0 || (myLevel && item.target_levels.includes(myLevel));

      return roleMatch && levelMatch;
    });

    // Sort: Pinned items first, then by last activity (updated_date or created_date) desc
    return visible.sort((a, b) => {
      const aPinned = a.is_pinned || a.pinned;
      const bPinned = b.is_pinned || b.pinned;

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      const dateA = new Date(a.updated_date || a.created_date || a.start_time || 0);
      const dateB = new Date(b.updated_date || b.created_date || b.start_time || 0);
      return dateB - dateA;
    });
  }, [posts, discussions, events, resources, trainings, qnas, meetings, projects, orders, assets, hiddenIds, isAdmin, myMembership, currentUser, showHidden]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
            Feed
            {showHidden && <Badge variant="secondary" className="text-xs font-normal">Viewing History</Badge>}
        </h3>
        <div className="flex gap-2">
            <Button 
              variant={showHidden ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setShowHidden(!showHidden)}
              className="text-gray-500"
              title="View History (Hidden Items)"
            >
              <History className="w-4 h-4 mr-2" />
              {showHidden ? "Hide History" : "View History"}
            </Button>
        
            {isAdmin && (
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
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.is_pinned} 
                            onChange={e => setFormData({...formData, is_pinned: e.target.checked})} 
                            className="rounded border-gray-300"
                          />
                          Pin to top
                        </label>
                        
                        {canPostPublicly && (
                          <label className="flex items-center gap-2 text-sm cursor-pointer text-indigo-600 font-medium">
                            <input 
                              type="checkbox" 
                              checked={formData.is_public} 
                              onChange={e => setFormData({...formData, is_public: e.target.checked})} 
                              className="rounded border-indigo-300"
                            />
                            <Globe className="w-3 h-3" /> Make Public (Ad)
                          </label>
                        )}
                      </div>
                      
                      <LevelSelector 
                        group={group} 
                        selectedLevels={formData.target_levels} 
                        onChange={(levels) => setFormData({...formData, target_levels: levels})} 
                      />

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Target Roles (Optional)</label>
                        <div className="flex flex-wrap gap-2">
                          {['client', 'virtual-assistant', 'member'].map(role => (
                            <label key={role} className="flex items-center gap-2 text-sm border p-2 rounded-md cursor-pointer bg-white hover:bg-gray-50">
                              <input 
                                type="checkbox"
                                checked={(formData.target_roles || []).includes(role)}
                                onChange={(e) => {
                                  const current = formData.target_roles || [];
                                  const updated = e.target.checked 
                                    ? [...current, role]
                                    : current.filter(r => r !== role);
                                  setFormData({...formData, target_roles: updated});
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="capitalize">{role.replace('-', ' ')}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">If selected, only users with these roles will see this post.</p>
                      </div>
                    </div>
                    <Button onClick={handleSubmit} disabled={!formData.title} className="w-full bg-indigo-600 hover:bg-indigo-700">
                      {editingId ? 'Update Post' : 'Post'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
        </div>
      </div>

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
              onEdit={() => handleEdit(item)}
              onDelete={item.type === 'post' ? () => deletePostMutation.mutate(item.id) : null}
              onHide={() => hideItemMutation.mutate(item.id)}
              onToggleComplete={() => toggleTrainingCompletion.mutate(item.id)}
              onTogglePin={() => togglePinMutation.mutate({ id: item.id, type: item.type, currentPinnedState: item.is_pinned || item.pinned })}
              isCompleted={completions.some(c => c.training_id === item.id)}
              onClick={() => item.type !== 'post' && navigateToTab(item)}
              isHidden={hiddenIds.includes(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FeedContentDisplay({ content, className = "" }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!content) return null;
  
  // Strip HTML to get rough text length for "isLong" check
  const textLength = content.replace(/<[^>]*>?/gm, '').length;
  const isLong = textLength > 300;

  return (
    <div>
      <div 
        className={`prose prose-sm max-w-none text-gray-700 ${className} ${!expanded && isLong ? 'max-h-24 overflow-hidden relative' : ''}`}
      >
        <div dangerouslySetInnerHTML={{ __html: content }} />
        {!expanded && isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>
      {isLong && (
        <Button 
          variant="link" 
          size="sm" 
          onClick={() => setExpanded(!expanded)} 
          className="p-0 h-auto mt-1 text-purple-600 font-medium"
        >
          {expanded ? 'Show Less' : 'Read More'}
        </Button>
      )}
    </div>
  );
}

function FeedItemCard({ item, isAdmin, currentUser, onEdit, onDelete, onHide, onToggleComplete, onTogglePin, isCompleted, onClick, isHidden }) {
  const { preferences } = useTheme();
  const [shareOpen, setShareOpen] = useState(false);
  const [addToDayOpen, setAddToDayOpen] = useState(false);

  const getIcon = () => {
    switch(item.type) {
      case 'post': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'discussion': return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case 'event': return <Calendar className="w-5 h-5 text-green-500" />;
      case 'resource': return <LinkIcon className="w-5 h-5 text-purple-500" />;
      case 'training': return <Video className="w-5 h-5 text-red-500" />;
      case 'qna': return <MessageSquare className="w-5 h-5 text-teal-500" />;
      case 'meeting': return <Video className="w-5 h-5 text-rose-500" />;
      case 'project': return <Briefcase className="w-5 h-5 text-indigo-500" />;
      case 'order': return <Printer className="w-5 h-5 text-purple-500" />;
      case 'asset': return <Sparkles className="w-5 h-5 text-pink-500" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    switch(item.type) {
      case 'post': return 'Announcement';
      case 'discussion': return 'Discussion';
      case 'event': return 'Event';
      case 'resource': return 'Resource';
      case 'training': return 'Training';
      case 'qna': return 'Q&A';
      case 'meeting': return 'Meeting';
      case 'project': return 'Project';
      case 'order': return 'Order';
      case 'asset': return 'Asset';
      default: return 'Item';
    }
  };

  return (
    <Card 
        className={`transition-all hover:shadow-md ${item.is_pinned ? 'border-l-4 border-l-blue-500' : ''} ${isHidden ? 'opacity-60 bg-gray-50' : ''}`}
    >
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} item={item} />
      <AddToDayDialog open={addToDayOpen} onOpenChange={setAddToDayOpen} item={item} user={currentUser} />

      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div 
            onClick={onClick} 
            className={`flex-1 ${item.type !== 'post' ? 'cursor-pointer group' : ''}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-[10px] flex items-center gap-1 group-hover:bg-gray-200 transition-colors">
              {getIcon()} {getLabel()}
            </Badge>
            {(item.is_pinned || item.pinned) && <Badge className="bg-blue-100 text-blue-700 text-[10px]"><Pin className="w-3 h-3 mr-1" /> Pinned</Badge>}
            {item.is_public && <Badge className="bg-indigo-100 text-indigo-700 text-[10px]"><Globe className="w-3 h-3 mr-1" /> Public</Badge>}
            <span className="text-xs text-gray-400">
              {new Date(item.created_date || item.start_time).toLocaleString('en-US', { 
                month: 'numeric', day: 'numeric', year: 'numeric', 
                hour: 'numeric', minute: '2-digit', 
                timeZone: preferences?.user_timezone 
              })}
            </span>
          </div>
          <CardTitle className="text-lg group-hover:text-purple-600 transition-colors flex items-center gap-2">
            {item.title}
            {item.type !== 'post' && <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />}
          </CardTitle>
          {item.target_levels?.length > 0 && (
            <div className="mt-1">
              <Badge variant="outline" className="text-[10px] text-gray-400">{item.target_levels.join(', ')} only</Badge>
            </div>
          )}
        </div>
        
        <div className="flex gap-1 items-center">
          {/* Action Buttons */}
          <Button variant="ghost" size="icon" onClick={() => setAddToDayOpen(true)} title="Add to My Day" className="text-gray-500 hover:text-green-600">
            <CalendarPlus className="w-5 h-5" />
          </Button>
          
          <Button variant="ghost" size="icon" onClick={() => setShareOpen(true)} title="Share" className="text-gray-500 hover:text-blue-600">
            <Share2 className="w-5 h-5" />
          </Button>

          {item.type === 'training' && (
          <Button 
            variant="ghost"
            size="icon"
            onClick={onToggleComplete} 
            title={isCompleted ? "Mark Incomplete" : "Mark Complete"}
            className={`${isCompleted ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <CheckCircle className="w-5 h-5" />
          </Button>
          )}

          {isAdmin && ['post', 'discussion', 'event', 'resource', 'training'].includes(item.type) && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onTogglePin} 
            title={(item.is_pinned || item.pinned) ? "Unpin" : "Pin to Top"}
            className={`${(item.is_pinned || item.pinned) ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
          >
            <Pin className="w-5 h-5" />
          </Button>
          )}

          <div className="flex gap-1 ml-2 pl-2 border-l">
            {/* Edit Button for All Types */}
            {(isAdmin || 
              (item.type === 'post' && item.author_email === currentUser?.email) ||
              (item.type === 'event' && item.created_by === currentUser?.email) ||
              (item.type === 'resource' && item.submitted_by === currentUser?.email)
             ) && (
              <Button variant="ghost" size="icon" onClick={onEdit} className="text-gray-400 hover:text-purple-600" title="Edit">
                <Pencil className="w-5 h-5" />
              </Button>
            )}

            {/* Delete Button */}
            {(item.type === 'post' && (isAdmin || item.author_email === currentUser?.email)) && (
                <Button variant="ghost" size="icon" onClick={onDelete} className="text-gray-400 hover:text-red-500" title="Delete">
                  <Trash2 className="w-5 h-5" />
                </Button>
            )}
            
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={onHide} 
                className={`${isHidden ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600'}`} 
                title={isHidden ? "Unhide" : "Mark as Seen / Hide"}
            >
              {isHidden ? <Eye className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {item.type === 'post' && (
          <FeedContentDisplay content={item.content} />
        )}

        {item.type === 'discussion' && (
          <div className="text-sm text-gray-600 space-y-2">
             <FeedContentDisplay content={item.content} />
             {item.media_url && (
                <div className="mt-2">
                   <img src={item.media_url} alt="Post content" className="rounded-lg max-h-48 object-cover bg-gray-100" />
                </div>
             )}
             <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">by {item.author_email}</span>
             </div>
          </div>
        )}
        
        {item.type === 'event' && (
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="font-semibold">
                {new Date(item.start_time).toLocaleString('en-US', { 
                  weekday: 'short', month: 'short', day: 'numeric', 
                  hour: 'numeric', minute: '2-digit', 
                  timeZone: preferences?.user_timezone 
                })}
              </span>
            </div>
            <FeedContentDisplay content={item.description} />
          </div>
        )}

        {item.type === 'resource' && (
          <div className="text-sm text-gray-600 space-y-2">
            <FeedContentDisplay content={item.description} />
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> Open Resource
              </a>
            )}
          </div>
        )}

        {item.type === 'training' && (
          <div className="text-sm text-gray-600 space-y-2">
             <FeedContentDisplay content={item.description} />
             {item.video_url && (
                <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline flex items-center gap-1">
                  <Video className="w-3 h-3" /> Watch Video
                </a>
             )}
          </div>
        )}
        
        {item.type === 'qna' && (
            <div className="text-sm text-gray-600 space-y-2">
                <p>{item.answer ? "Answered" : "Waiting for answer"}</p>
            </div>
        )}

        {item.type === 'meeting' && (
            <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(item.meeting_date).toLocaleString()}</span>
                </div>
                {item.video_url && (
                    <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        <Video className="w-3 h-3" /> Watch Recording
                    </a>
                )}
            </div>
        )}

        {item.type === 'project' && (
            <div className="text-sm text-gray-600 space-y-2">
                <p>{item.description}</p>
                <Badge variant="outline" className="mt-1">{item.status}</Badge>
            </div>
        )}

        {item.type === 'order' && (
            <div className="text-sm text-gray-600 space-y-2">
                <p>Status: <Badge variant="outline">{item.status}</Badge></p>
                {item.custom_status_label && <p className="text-xs text-gray-500">"{item.custom_status_label}"</p>}
            </div>
        )}

        {item.type === 'asset' && (
            <div className="text-sm text-gray-600 space-y-2">
                {item.file_url && (
                    <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> View Asset
                    </a>
                )}
                {item.file_type && <Badge variant="secondary" className="ml-2">{item.file_type}</Badge>}
            </div>
        )}
      </CardContent>
    </Card>
  );
}