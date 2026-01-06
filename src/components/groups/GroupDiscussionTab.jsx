import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function UserAvatar({ email, className }) {
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', email],
    queryFn: async () => {
       const prefs = await base44.entities.UserPreferences.filter({ user_email: email });
       return prefs[0];
    },
    staleTime: 1000 * 60 * 5 // 5 mins
  });
  
  return (
    <Avatar className={className}>
      <AvatarImage src={userProfile?.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`} />
      <AvatarFallback>{email ? email[0].toUpperCase() : '?'}</AvatarFallback>
    </Avatar>
  );
}
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, Image as ImageIcon, BarChart2, MoreVertical, Trash2, Send, ThumbsUp, Loader2, Plus, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

export default function GroupDiscussionTab({ group, currentUser, isAdmin }) {
  const [isCreating, setIsCreating] = useState(false);
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['groupDiscussion', group.id],
    queryFn: () => base44.entities.GroupDiscussionPost.filter({ group_id: group.id }, '-created_date'),
  });

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {!isCreating ? (
        <Button onClick={() => setIsCreating(true)} className="w-full h-14 bg-white border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 justify-start px-6 shadow-sm">
          <Plus className="w-5 h-5 mr-3" /> Start a discussion...
        </Button>
      ) : (
        <CreatePostForm group={group} currentUser={currentUser} onCancel={() => setIsCreating(false)} />
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No discussions yet. Be the first to post!</p>
          </div>
        ) : (
          posts.map(post => (
            <DiscussionPost key={post.id} post={post} currentUser={currentUser} isAdmin={isAdmin} />
          ))
        )}
      </div>
    </div>
  );
}

function CreatePostForm({ group, currentUser, onCancel }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isUploading, setIsUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupDiscussionPost.create({ ...data, group_id: group.id, author_email: currentUser.email }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupDiscussion', group.id]);
      onCancel();
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMediaUrl(file_url);
    } catch (err) {
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    const finalOptions = type === 'poll' ? pollOptions.filter(o => o.trim()) : [];
    if (type === 'poll' && finalOptions.length < 2) return alert("Poll needs at least 2 options");
    
    createMutation.mutate({
      content,
      type,
      media_url: type === 'image' ? mediaUrl : null,
      poll_options: finalOptions
    });
  };

  return (
    <Card className="animate-in fade-in zoom-in-95 duration-200">
      <CardContent className="p-4 space-y-4">
        <Tabs value={type} onValueChange={setType}>
          <TabsList className="w-full justify-start bg-transparent p-0 border-b rounded-none mb-4">
            <TabsTrigger value="text" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-4"><MessageSquare className="w-4 h-4 mr-2" /> Discussion</TabsTrigger>
            <TabsTrigger value="image" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-4"><ImageIcon className="w-4 h-4 mr-2" /> Image</TabsTrigger>
            <TabsTrigger value="poll" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-4"><BarChart2 className="w-4 h-4 mr-2" /> Poll</TabsTrigger>
          </TabsList>

          <Textarea 
            placeholder="What's on your mind?" 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            className="min-h-[100px] text-lg resize-none border-0 focus-visible:ring-0 px-0"
          />

          {type === 'image' && (
            <div className="mt-4 border-2 border-dashed rounded-lg p-6 text-center">
              {mediaUrl ? (
                <div className="relative inline-block">
                  <img src={mediaUrl} alt="Upload" className="max-h-60 rounded-lg" />
                  <button onClick={() => setMediaUrl('')} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow border"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <Input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="post-image" disabled={isUploading} />
                  <label htmlFor="post-image" className="cursor-pointer block">
                    {isUploading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /> : <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />}
                    <span className="text-sm text-indigo-600 font-medium hover:underline">Click to upload image</span>
                  </label>
                </>
              )}
            </div>
          )}

          {type === 'poll' && (
            <div className="mt-4 space-y-3">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input 
                    placeholder={`Option ${idx + 1}`} 
                    value={opt} 
                    onChange={e => {
                      const newOpts = [...pollOptions];
                      newOpts[idx] = e.target.value;
                      setPollOptions(newOpts);
                    }} 
                  />
                  {pollOptions.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}><X className="w-4 h-4" /></Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setPollOptions([...pollOptions, ''])} className="w-full border-dashed"><Plus className="w-3 h-3 mr-2" /> Add Option</Button>
            </div>
          )}
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!content.trim() && !mediaUrl}>Post</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DiscussionPost({ post, currentUser, isAdmin }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  
  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.GroupDiscussionPost.delete(post.id),
    onSuccess: () => queryClient.invalidateQueries(['groupDiscussion'])
  });

  const isAuthor = post.author_email === currentUser?.email;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
        <div className="flex gap-3">
          <UserAvatar email={post.author_email} className="w-10 h-10" />
          <div>
             <div className="font-semibold text-sm">{post.author_email}</div>
             <div className="text-xs text-gray-500">{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</div>
          </div>
        </div>
        {(isAuthor || isAdmin) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => deleteMutation.mutate()} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      
      <CardContent className="p-4 pt-2 space-y-4">
        <div className="whitespace-pre-wrap text-gray-800">{post.content}</div>
        
        {post.type === 'image' && post.media_url && (
          <img src={post.media_url} alt="Post content" className="rounded-lg max-h-96 w-full object-cover bg-gray-100" />
        )}

        {post.type === 'poll' && (
          <PollWidget post={post} currentUser={currentUser} />
        )}
      </CardContent>

      <CardFooter className="p-0 border-t bg-gray-50/50">
         <div className="w-full">
            <Button 
                variant="ghost" 
                className="w-full rounded-none h-10 text-gray-500 hover:text-indigo-600"
                onClick={() => setShowComments(!showComments)}
            >
                <MessageSquare className="w-4 h-4 mr-2" /> 
                {showComments ? 'Hide Comments' : 'Comments'}
            </Button>
            {showComments && <CommentSection post={post} currentUser={currentUser} isAdmin={isAdmin} />}
         </div>
      </CardFooter>
    </Card>
  );
}

function PollWidget({ post, currentUser }) {
  const queryClient = useQueryClient();
  const { data: votes = [] } = useQuery({
    queryKey: ['pollVotes', post.id],
    queryFn: () => base44.entities.GroupDiscussionVote.filter({ post_id: post.id }),
  });

  const myVote = votes.find(v => v.user_email === currentUser?.email);
  const totalVotes = votes.length;

  const voteMutation = useMutation({
    mutationFn: async (optionIndex) => {
       if (myVote) await base44.entities.GroupDiscussionVote.delete(myVote.id);
       return base44.entities.GroupDiscussionVote.create({
         post_id: post.id,
         user_email: currentUser.email,
         option_index: optionIndex
       });
    },
    onSuccess: () => queryClient.invalidateQueries(['pollVotes', post.id])
  });

  return (
    <div className="space-y-2 mt-2">
      {post.poll_options.map((option, idx) => {
        const count = votes.filter(v => v.option_index === idx).length;
        const percentage = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
        const isSelected = myVote?.option_index === idx;

        return (
          <div key={idx} className="relative group cursor-pointer" onClick={() => voteMutation.mutate(idx)}>
            <div className="absolute inset-0 bg-gray-100 rounded-lg overflow-hidden">
               <div className="h-full bg-indigo-100 transition-all duration-500" style={{ width: `${percentage}%` }} />
            </div>
            <div className="relative p-3 flex justify-between items-center z-10">
               <span className={`font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                 {option} {isSelected && <Badge variant="secondary" className="ml-2 bg-white/50 text-indigo-700 text-[10px]">You</Badge>}
               </span>
               <span className="text-sm text-gray-500">{percentage}%</span>
            </div>
          </div>
        );
      })}
      <div className="text-xs text-gray-400 text-right">{totalVotes} votes</div>
    </div>
  );
}

function CommentSection({ post, currentUser, isAdmin }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  
  const { data: comments = [] } = useQuery({
    queryKey: ['postComments', post.id],
    queryFn: () => base44.entities.GroupDiscussionComment.filter({ post_id: post.id }, 'created_date'),
  });

  const handleReply = (comment) => {
    const replyText = `> ${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}\n\n`;
    setNewComment(prev => replyText + prev);
    document.getElementById(`comment-input-${post.id}`)?.focus();
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.GroupDiscussionComment.create({
        post_id: post.id,
        author_email: currentUser.email,
        content: newComment
      });
      // Bump the parent post
      await base44.entities.GroupDiscussionPost.update(post.id, { updated_date: new Date().toISOString() });
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries(['postComments', post.id]);
      queryClient.invalidateQueries(['groupDiscussion']); // Refresh list to update sort order
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupDiscussionComment.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['postComments', post.id])
  });

  return (
    <div className="p-4 pt-0 border-t bg-gray-50/30">
       <div className="space-y-4 mb-4 pt-4">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-2 group">
               <UserAvatar email={comment.author_email} className="w-6 h-6 mt-1" />
               <div className="flex-1 bg-white p-2 rounded-lg rounded-tl-none border shadow-sm text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-gray-600">{comment.author_email}</span>
                    <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}</span>
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap">{comment.content}</div>
                  <div className="mt-1 flex items-center gap-2">
                      <button 
                          onClick={() => handleReply(comment)} 
                          className="text-[10px] text-gray-400 hover:text-indigo-600 font-medium"
                      >
                          Reply
                      </button>
                  </div>
               </div>
               {(comment.author_email === currentUser?.email || isAdmin) && (
                 <button onClick={() => deleteMutation.mutate(comment.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                 </button>
               )}
            </div>
          ))}
       </div>
       <div className="flex gap-2">
          <Input 
            id={`comment-input-${post.id}`}
            value={newComment} 
            onChange={e => setNewComment(e.target.value)} 
            placeholder="Write a comment..." 
            className="bg-white"
            onKeyDown={e => e.key === 'Enter' && newComment.trim() && createMutation.mutate()}
          />
          <Button size="icon" onClick={() => createMutation.mutate()} disabled={!newComment.trim()}>
             <Send className="w-4 h-4" />
          </Button>
       </div>
    </div>
  );
}