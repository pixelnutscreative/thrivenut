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
  const [copied, setCopied] = useState(null);
  const [showImagePrompts, setShowImagePrompts] = useState(null);
  const [generatingPrompts, setGeneratingPrompts] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMotivation, setNewMotivation] = useState({ content: '', category: 'Uncategorized', type: 'quote' });

  const { data: motivations = [], isLoading } = useQuery({
    queryKey: ['savedMotivations', effectiveEmail],
    queryFn: () => base44.entities.SavedMotivation.filter({ created_by: effectiveEmail }, '-created_date'),
    enabled: !!effectiveEmail,
  });

  const aiTools = preferences?.ai_tool_links?.length > 0 
    ? preferences.ai_tool_links 
    : [
        { name: "Let's Go Nuts", url: 'https://create.letsgonuts.ai' },
        { name: "Pixel's AI Toolbox", url: 'https://ai.thenutsandbots.com' },
      ];

  const categories = [...new Set(motivations.map(m => m.category || 'Uncategorized'))];

  const filteredMotivations = categoryFilter === 'all' 
    ? motivations 
    : motivations.filter(m => (m.category || 'Uncategorized') === categoryFilter);

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

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className={`min-h-screen ${bgClass} ${isDark ? 'text-gray-100' : ''} p-4 md:p-8`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bookmark className="w-8 h-8 text-purple-600" />
              Saved Motivations
            </h1>
            <p className="text-gray-600 mt-1">Your collection of inspiration for content creation</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Motivation
          </Button>
        </div>

        {/* Filters */}
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

        {/* AI Tools */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800">Create Images with AI:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiTools.map((tool, idx) => (
                  <a 
                    key={idx} 
                    href={tool.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                      {tool.name}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </a>
                ))}
              </div>
            </div>
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
                            onClick={() => copyToClipboard(motivation.content, motivation.id)}
                            className="h-7 w-7 p-0"
                          >
                            {copied === motivation.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(prompt, `prompt-${motivation.id}-${pIdx}`)}
                                    className="h-6 w-6 p-0 shrink-0"
                                  >
                                    {copied === `prompt-${motivation.id}-${pIdx}` ? (
                                      <Check className="w-3 h-3 text-green-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </Button>
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
            <DialogTitle>Add Motivation</DialogTitle>
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