import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bookmark, Trash2, Copy, Check, Sparkles, Loader2, ExternalLink, Wand2, Filter, Plus, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useTheme } from '../components/shared/useTheme';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';

const typeColors = {
  scripture: 'bg-purple-100 text-purple-700',
  quote: 'bg-blue-100 text-blue-700',
  affirmation: 'bg-pink-100 text-pink-700',
  motivational: 'bg-amber-100 text-amber-700',
  ai_generated: 'bg-teal-100 text-teal-700',
  positive_quote: 'bg-blue-100 text-blue-700'
};

export default function SavedMotivations() {
  const queryClient = useQueryClient();
  const { isDark, bgClass, user, effectiveEmail, preferences } = useTheme();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(null);
  const [showImagePrompts, setShowImagePrompts] = useState(null);
  const [generatingPrompts, setGeneratingPrompts] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMotivation, setNewMotivation] = useState({ content: '', category: 'Uncategorized', type: 'quote' });
  const [showToolPicker, setShowToolPicker] = useState(null);

  const { data: motivations = [], isLoading } = useQuery({
    queryKey: ['savedMotivations', effectiveEmail],
    queryFn: () => base44.entities.SavedMotivation.filter({ created_by: effectiveEmail }, '-created_date'),
    enabled: !!effectiveEmail,
  });

  // Fetch AI tool links
  const { data: aiToolLinks = [] } = useQuery({
    queryKey: ['aiToolLinks'],
    queryFn: () => base44.entities.AIToolLink.filter({ is_active: true }, 'sort_order'),
    enabled: !!effectiveEmail,
  });

  // Detect user's AI platform
  const { data: platformUser } = useQuery({
    queryKey: ['platformUser', effectiveEmail],
    queryFn: async () => {
      const users = await base44.entities.AIPlatformUser.filter({ user_email: effectiveEmail });
      return users[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  // Priority: user self-selection > admin assignment > default to lets_go_nuts
  const userPlatform = preferences?.ai_platform || platformUser?.platform || 'lets_go_nuts';

  const categories = [...new Set(motivations.map(m => m.category || 'Uncategorized'))];

  const filteredMotivations = motivations.filter(m => {
    const matchesCategory = categoryFilter === 'all' || (m.category || 'Uncategorized') === categoryFilter;
    const matchesSearch = !search || 
      m.content.toLowerCase().includes(search.toLowerCase()) || 
      m.reference?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedMotivation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedMotivations'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SavedMotivation.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedMotivations'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedMotivation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedMotivations'] });
      setShowAddModal(false);
      setNewMotivation({ content: '', category: 'Uncategorized', type: 'quote' });
    },
  });

  const generateImagePrompts = async (motivation) => {
    setGeneratingPrompts(motivation.id);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 creative image prompt ideas for creating social media visuals based on this quote/motivation:

"${motivation.content}"
${motivation.reference ? `Reference: ${motivation.reference}` : ''}

Each prompt should be:
- Descriptive and visual
- Suitable for AI image generation
- Aesthetic and shareable on social media
- Different styles (one abstract, one nature-based, one lifestyle)`,
        response_json_schema: {
          type: "object",
          properties: {
            prompts: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      await updateMutation.mutateAsync({
        id: motivation.id,
        data: { image_prompts: result.prompts }
      });

      setShowImagePrompts(motivation.id);
    } catch (error) {
      console.error('Failed to generate prompts:', error);
    }
    setGeneratingPrompts(null);
  };

  const copyToClipboard = (text, id, openAITool = false) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);

    // If user wants to open AI tool, redirect based on their platform
    if (openAITool) {
      const toolUrl = userPlatform === 'pixels_toolbox' 
        ? 'https://ai.thenutsandbots.com'
        : 'https://create.letsgonuts.ai';
      window.open(toolUrl, '_blank');
    }
  };

  const copyPromptAndOpenTool = (prompt, toolId) => {
    const tool = aiToolLinks.find(t => t.id === toolId);
    if (!tool) return;

    navigator.clipboard.writeText(prompt);
    setCopied(`tool-${toolId}`);
    setTimeout(() => setCopied(null), 2000);

    // Get URL based on tool type and user platform
    let url = '';
    if (tool.is_general_tool) {
      url = tool.pixels_toolbox_url || tool.lets_go_nuts_url;
    } else if (tool.app_id) {
      // Auto-generate URL from App ID
      const baseUrl = userPlatform === 'pixels_toolbox' 
        ? 'https://ai.thenutsandbots.com/apps/custom-app/'
        : 'https://create.letsgonuts.ai/apps/custom-app/';
      url = baseUrl + tool.app_id;
    } else {
      // Fallback to custom URLs
      url = userPlatform === 'pixels_toolbox' ? tool.pixels_toolbox_url : tool.lets_go_nuts_url;
    }

    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`min-h-screen ${bgClass} ${isDark ? 'text-gray-100' : ''} p-4 md:p-8`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bookmark className="w-8 h-8 text-purple-600" />
              Saved for Content
            </h1>
            <p className="text-gray-600 mt-1">Your collection of inspiration for content creation</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Content Idea
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search content ideas..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Badge
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setCategoryFilter('all')}
          >
            All ({motivations.length})
          </Badge>
          {categories.map(cat => (
            <Badge
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {/* AI Platform Badge */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-800">
                  Your AI Platform: <strong>{userPlatform === 'pixels_toolbox' ? "Pixel's AI Toolbox" : "Let's Go Nuts"}</strong>
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/Settings#connections'}
                className="text-xs h-7"
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Image Tools */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="w-5 h-5 text-purple-600" />
              AI Image Generators
            </CardTitle>
            <CardDescription>Click to open in your AI platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {aiToolLinks.map(tool => {
                const url = userPlatform === 'pixels_toolbox' 
                  ? tool.pixels_toolbox_url 
                  : tool.lets_go_nuts_url;
                
                if (!url) return null;

                return (
                  <a
                    key={tool.id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50 transition-colors"
                  >
                    {tool.icon_emoji && <span className="text-2xl">{tool.icon_emoji}</span>}
                    <span className="text-xs text-center font-medium text-purple-700">{tool.tool_name}</span>
                    <ExternalLink className="w-3 h-3 text-purple-400" />
                  </a>
                );
              })}
            </div>
            {aiToolLinks.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No AI tools configured yet. Admin can add them.</p>
            )}
          </CardContent>
        </Card>

        {/* Motivations Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : filteredMotivations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg mb-2">No saved motivations yet</p>
              <p className="text-gray-400">Save quotes from your dashboard or add them manually</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredMotivations.map((motivation, idx) => (
                <motion.div
                  key={motivation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge className={typeColors[motivation.type] || 'bg-gray-100'}>
                          {motivation.type?.replace('_', ' ')}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(motivation.content, motivation.id, true)}
                            className="h-7 px-2"
                            title="Copy & Open AI Tool"
                          >
                            {copied === motivation.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-gray-400" />
                                <ExternalLink className="w-3 h-3 ml-1 text-purple-400" />
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(motivation.id)}
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-gray-800 font-medium leading-relaxed">
                        "{motivation.content}"
                      </p>

                      {motivation.reference && (
                        <p className="text-sm text-gray-500 italic">— {motivation.reference}</p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <Select
                          value={motivation.category || 'Uncategorized'}
                          onValueChange={(value) => updateMutation.mutate({ 
                            id: motivation.id, 
                            data: { category: value } 
                          })}
                        >
                          <SelectTrigger className="w-32 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(preferences?.motivation_categories || ['Content Ideas', 'Personal Growth', 'Spiritual', 'Business', 'Uncategorized']).map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => motivation.image_prompts?.length > 0 
                            ? setShowImagePrompts(showImagePrompts === motivation.id ? null : motivation.id)
                            : generateImagePrompts(motivation)
                          }
                          disabled={generatingPrompts === motivation.id}
                          className="text-xs h-7"
                        >
                          {generatingPrompts === motivation.id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Image className="w-3 h-3 mr-1" />
                          )}
                          {motivation.image_prompts?.length > 0 ? 'View Prompts' : 'Get Image Ideas'}
                        </Button>
                      </div>

                      {/* Image Prompts Section */}
                      <AnimatePresence>
                        {showImagePrompts === motivation.id && motivation.image_prompts?.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 space-y-2 border-t">
                              <p className="text-xs font-medium text-gray-500">Image Prompt Ideas:</p>
                              {motivation.image_prompts.map((prompt, pIdx) => (
                                <div 
                                  key={pIdx}
                                  className="p-2 bg-gray-50 rounded text-sm text-gray-700 flex items-start justify-between gap-2"
                                >
                                  <span>{prompt}</span>
                                  <div className="relative">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setShowToolPicker(`${motivation.id}-${pIdx}`)}
                                      className="h-6 px-2 shrink-0"
                                    >
                                      <Copy className="w-3 h-3 mr-1" />
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>

                                    {showToolPicker === `${motivation.id}-${pIdx}` && (
                                      <>
                                        <div 
                                          className="fixed inset-0 z-40" 
                                          onClick={() => setShowToolPicker(null)}
                                        />
                                        <div className="absolute right-0 top-full mt-1 bg-white border-2 border-purple-300 rounded-lg shadow-xl z-50 p-2 min-w-[200px]">
                                          <p className="text-xs font-semibold text-gray-500 mb-2 px-2">Copy & Open In:</p>
                                          <div className="space-y-1 max-h-64 overflow-y-auto">
                                            {aiToolLinks.map(tool => {
                                              // Generate URL
                                              let url = '';
                                              if (tool.is_general_tool) {
                                                url = tool.pixels_toolbox_url || tool.lets_go_nuts_url;
                                              } else if (tool.app_id) {
                                                const baseUrl = userPlatform === 'pixels_toolbox'
                                                  ? 'https://ai.thenutsandbots.com/apps/custom-app/'
                                                  : 'https://create.letsgonuts.ai/apps/custom-app/';
                                                url = baseUrl + tool.app_id;
                                              } else {
                                                url = userPlatform === 'pixels_toolbox' ? tool.pixels_toolbox_url : tool.lets_go_nuts_url;
                                              }
                                              
                                              if (!url) return null;

                                              return (
                                                <button
                                                  key={tool.id}
                                                  onClick={() => {
                                                    copyPromptAndOpenTool(prompt, tool.id);
                                                    setShowToolPicker(null);
                                                  }}
                                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-purple-50 rounded text-left"
                                                >
                                                  {tool.icon_url ? (
                                                    <img src={tool.icon_url} alt="" className="w-5 h-5 rounded object-cover" />
                                                  ) : tool.icon_emoji ? (
                                                    <span className="text-lg">{tool.icon_emoji}</span>
                                                  ) : (
                                                    <Image className="w-4 h-4 text-gray-400" />
                                                  )}
                                                  <span className="text-sm font-medium">{tool.tool_name}</span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => generateImagePrompts(motivation)}
                                disabled={generatingPrompts === motivation.id}
                                className="text-xs w-full"
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Regenerate Prompts
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Content Idea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={newMotivation.content}
                onChange={(e) => setNewMotivation({ ...newMotivation, content: e.target.value })}
                placeholder="Enter the quote, scripture, or affirmation..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={newMotivation.type}
                  onValueChange={(v) => setNewMotivation({ ...newMotivation, type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="scripture">Scripture</SelectItem>
                    <SelectItem value="affirmation">Affirmation</SelectItem>
                    <SelectItem value="motivational">Motivational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={newMotivation.category}
                  onValueChange={(v) => setNewMotivation({ ...newMotivation, category: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(preferences?.motivation_categories || ['Content Ideas', 'Personal Growth', 'Spiritual', 'Business', 'Uncategorized']).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button 
              onClick={() => createMutation.mutate(newMotivation)}
              disabled={!newMotivation.content || createMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}