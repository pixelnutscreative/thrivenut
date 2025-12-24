import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Heart, ExternalLink, Image as ImageIcon, FileText, Music, Video, Sparkles, Loader2, Upload, X, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const contentTypeIcons = {
  image: ImageIcon,
  text: FileText,
  image_with_text: Sparkles,
  poem: FileText,
  song: Music,
  video: Video,
  nutpal: Palette,
  other: Sparkles
};

export default function PortfolioSection({ userEmail, isAuthenticated, primaryColor, accentColor, isDark }) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    ai_tool_name: '',
    content_type: 'image',
    title: '',
    description: '',
    image_urls: [],
    text_content: '',
    external_link: '',
    tags: [],
    is_nutpal: false,
    style_id: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch AI Tool Links for dropdown
  const { data: aiTools = [] } = useQuery({
    queryKey: ['aiToolLinks'],
    queryFn: () => base44.entities.AIToolLink.filter({ is_active: true }, 'sort_order'),
  });

  const { data: nutPalStyles = [] } = useQuery({
    queryKey: ['nutPalStyles'],
    queryFn: () => base44.entities.NutPalStyle.filter({ is_active: true }, 'sort_order'),
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', userEmail],
    queryFn: async () => {
      const p = await base44.entities.UserProfile.filter({ user_email: userEmail });
      return p[0] || null;
    },
    enabled: !!userEmail
  });

  const { data: aiUser } = useQuery({
    queryKey: ['aiPlatformUser', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;
      // Get effective email if impersonating? userEmail passed here is effective email
      const users = await base44.entities.AIPlatformUser.filter({ user_email: userEmail });
      return users[0] || null;
    },
    enabled: !!userEmail
  });

  // Fetch approved portfolio items
  const { data: portfolioItems = [] } = useQuery({
    queryKey: ['creatorPortfolio'],
    queryFn: () => base44.entities.CreatorPortfolio.filter({ approval_status: 'approved' }, '-created_date'),
  });

  // Fetch my portfolio items (all statuses)
  const { data: myItems = [] } = useQuery({
    queryKey: ['myPortfolio', userEmail],
    queryFn: () => base44.entities.CreatorPortfolio.filter({ created_by: userEmail }, '-created_date'),
    enabled: !!userEmail && isAuthenticated,
  });

  const createItemMutation = useMutation({
    mutationFn: (data) => {
      // Check trust in both UserProfile and AIPlatformUser
      const isTrusted = userProfile?.is_trusted_creator || aiUser?.is_trusted_creator;
      return base44.entities.CreatorPortfolio.create({
        ...data,
        approval_status: isTrusted ? 'approved' : 'pending',
        creator_name: userProfile?.nickname || userProfile?.real_name || data.creator_name,
        creator_email: userEmail
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPortfolio'] });
      queryClient.invalidateQueries({ queryKey: ['creatorPortfolio'] }); // Refresh public list if approved
      setShowAddModal(false);
      resetForm();
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        image_urls: [...formData.image_urls, file_url]
      });
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    setFormData({
      ...formData,
      image_urls: formData.image_urls.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = () => {
    createItemMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      ai_tool_name: '',
      content_type: 'image',
      title: '',
      description: '',
      image_urls: [],
      text_content: '',
      external_link: '',
      tags: [],
      is_nutpal: false,
      style_id: ''
    });
  };

  const PortfolioCard = ({ item }) => {
    const Icon = contentTypeIcons[item.content_type] || Sparkles;
    const isOwner = item.created_by === userEmail;

    return (
      <Card 
        className={`overflow-hidden cursor-pointer hover:shadow-lg transition-all ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        onClick={() => setSelectedItem(item)}
      >
        {item.image_urls?.length > 0 && (
          <div className="aspect-square overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
            <img 
              src={item.image_urls[0]} 
              alt={item.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </div>
        )}
        {item.image_urls?.length === 0 && item.content_type === 'text' && (
          <div className="aspect-square bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center p-6">
            <p className="text-gray-700 text-sm line-clamp-6 font-serif italic">
              {item.text_content}
            </p>
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge className="text-xs" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
              <Icon className="w-3 h-3 mr-1" />
              {item.is_nutpal ? 'NutPal' : item.ai_tool_name}
            </Badge>
            {item.is_featured && (
              <Badge className="bg-yellow-100 text-yellow-700 text-xs">⭐ Featured</Badge>
            )}
          </div>
          <h3 className={`font-bold text-sm mb-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
            {item.title || 'Untitled'}
          </h3>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
            {item.description}
          </p>
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {item.likes_count || 0}
            </span>
            {isOwner && (
              <Badge variant="secondary" className="text-xs">Your Creation</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'} flex items-center gap-2`}>
            <Sparkles className="w-6 h-6" style={{ color: primaryColor }} />
            Creator Showcase
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Share your AI creations and get inspired by the community
          </p>
        </div>
        
        {isAuthenticated && (
          <Button
            onClick={() => setShowAddModal(true)}
            className="text-white"
            style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Creation
          </Button>
        )}
      </div>

      {/* My Pending Items */}
      {myItems.filter(i => i.approval_status === 'pending').length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 font-medium mb-2">
            ⏳ You have {myItems.filter(i => i.approval_status === 'pending').length} submission(s) pending admin approval
          </p>
          <p className="text-xs text-amber-700">
            They'll show here once approved!
          </p>
        </div>
      )}

      {/* Portfolio Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {portfolioItems.map(item => (
          <PortfolioCard key={item.id} item={item} />
        ))}
      </div>

      {portfolioItems.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No creations shared yet. Be the first!
          </p>
        </div>
      )}

      {/* Add Creation Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
              Share Your Creation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              ℹ️ Submissions are reviewed before appearing in the showcase. This keeps the gallery safe and awesome!
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Content Type</Label>
                <Select value={formData.content_type} onValueChange={(v) => setFormData({ ...formData, content_type: v, is_nutpal: v === 'nutpal' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="nutpal">🐿️ NutPal Character</SelectItem>
                    <SelectItem value="image">🖼️ Image</SelectItem>
                    <SelectItem value="text">📝 Text/Poem</SelectItem>
                    <SelectItem value="image_with_text">✨ Image + Text</SelectItem>
                    <SelectItem value="song">🎵 Song</SelectItem>
                    <SelectItem value="video">🎬 Video</SelectItem>
                    <SelectItem value="other">🎨 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.content_type === 'nutpal' ? (
                <div>
                  <Label>Which NutPal Style?</Label>
                  <Select value={formData.style_id} onValueChange={(v) => setFormData({ ...formData, style_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style..." />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      {nutPalStyles.map(style => (
                        <SelectItem key={style.id} value={style.id}>{style.name}</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom / New Style</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>AI Tool Used</Label>
                  <Select value={formData.ai_tool_name} onValueChange={(v) => setFormData({ ...formData, ai_tool_name: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tool..." />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      {aiTools.map(tool => (
                        <SelectItem key={tool.id} value={tool.tool_name}>{tool.tool_name}</SelectItem>
                      ))}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label>Title</Label>
              <Input
                placeholder="Give your creation a name"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Tell us about it! What inspired you? How did you make it?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Image URL Input (for image, nutpal, image_with_text types) */}
            {(formData.content_type === 'image' || formData.content_type === 'nutpal' || formData.content_type === 'image_with_text') && (
              <div>
                <Label>Image</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Paste the URL from your AI tool (Right click image {'>'} Copy Image Address). 
                  If that doesn't work, upload the file directly to Thrive's cloud.
                </p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://..."
                      value={formData.image_urls[0] || ''}
                      onChange={(e) => {
                        const url = e.target.value;
                        setFormData({
                          ...formData,
                          image_urls: url ? [url] : []
                        });
                      }}
                      className="flex-1"
                    />
                    <label className="flex items-center justify-center px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </label>
                  </div>
                  {formData.image_urls.length > 0 && (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border">
                      <img src={formData.image_urls[0]} alt="Preview" className="w-full h-full object-contain" />
                      <button 
                        onClick={() => removeImage(0)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Text Content (for text, poem, image_with_text) */}
            {(formData.content_type === 'text' || formData.content_type === 'poem' || formData.content_type === 'image_with_text') && (
              <div>
                <Label>Text Content</Label>
                <Textarea
                  placeholder="Paste your poem, story, or text here..."
                  value={formData.text_content}
                  onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                  rows={6}
                  className="font-serif"
                />
              </div>
            )}

            {/* External Link (for song, video) */}
            {(formData.content_type === 'song' || formData.content_type === 'video') && (
              <div>
                <Label>Link to {formData.content_type === 'song' ? 'Song' : 'Video'}</Label>
                <Input
                  placeholder={`Paste ${formData.content_type === 'song' ? 'SoundCloud/Suno' : 'YouTube/TikTok'} link...`}
                  value={formData.external_link}
                  onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                />
              </div>
            )}

            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                placeholder="e.g., funny, cute, battle, inspiring"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createItemMutation.isPending || (!formData.ai_tool_name && !formData.is_nutpal) || !formData.title}
              className="w-full text-white"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
            >
              {createItemMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail View Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-3xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedItem.image_urls?.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItem.image_urls.map((url, idx) => (
                      <img key={idx} src={url} alt="" className="w-full rounded-lg" />
                    ))}
                  </div>
                )}
                
                {selectedItem.text_content && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <pre className="whitespace-pre-wrap font-serif text-sm">
                      {selectedItem.text_content}
                    </pre>
                  </div>
                )}
                
                {selectedItem.external_link && (
                  <Button
                    onClick={() => window.open(selectedItem.external_link, '_blank')}
                    variant="outline"
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View {selectedItem.content_type === 'song' ? 'Song' : 'Video'}
                  </Button>
                )}
                
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedItem.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                    {selectedItem.is_nutpal ? 'NutPal' : selectedItem.ai_tool_name}
                  </Badge>
                  {selectedItem.tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  By {selectedItem.creator_name || 'Anonymous Creator'}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}