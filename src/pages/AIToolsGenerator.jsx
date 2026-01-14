import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Brain, Image as ImageIcon, Copy, Download, Sparkles, Save, Trash2, LayoutGrid, List, Filter, ExternalLink } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { Badge } from '@/components/ui/badge';

const CATEGORY = 'ai';

export default function AIToolsGenerator() {
  const { bgClass } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('generate');
  
  // Generator State
  const [genFeature, setGenFeature] = useState('Dreamy Nut');
  const [customFeature, setCustomFeature] = useState('');
  const [genType, setGenType] = useState('social_caption');
  const [targetAudience, setTargetAudience] = useState('Digital Artists');
  const [tone, setTone] = useState('Pixel Style (Humorous)');

  const [generatedContent, setGeneratedContent] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [resourceCategory, setResourceCategory] = useState('all');

  // Fetch Assets
  const { data: assets = [] } = useQuery({
    queryKey: ['marketingAssets', CATEGORY],
    queryFn: async () => {
      return await base44.entities.MarketingAsset.filter({ category: CATEGORY, is_active: true });
    }
  });

  // Fetch Custom GPTs
  const { data: customGPTs = [] } = useQuery({
    queryKey: ['customGPTs'],
    queryFn: async () => {
      const links = await base44.entities.AIToolLink.filter({ category: 'custom_gpt', is_active: true }, 'sort_order');
      return links.sort((a, b) => a.tool_name.localeCompare(b.tool_name));
    }
  });

  // Fetch History
  const { data: history = [] } = useQuery({
    queryKey: ['generatedHistory', CATEGORY],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      const allHistory = await base44.entities.GeneratedContentHistory.filter({ user_email: user.email }, '-created_date');
      return allHistory.filter(h => h.tool_name === 'AI Tools Generator' || h.tool_id === 'ai-gen');
    }
  });

  // Mutations
  const generateMutation = useMutation({
    mutationFn: async () => {
      const featureToUse = genFeature === 'Custom' ? customFeature : genFeature;
      const res = await base44.functions.invoke('generateMarketingContent', {
        feature: featureToUse,
        contentType: genType,
        targetAudience: targetAudience,
        tone: tone
      });
      return res.data?.content;
    },
    onSuccess: async (data) => {
      setGeneratedContent(data);
      const user = await base44.auth.me();
      const featureToUse = genFeature === 'Custom' ? customFeature : genFeature;
      
      await base44.entities.GeneratedContentHistory.create({
        user_email: user.email,
        tool_id: 'ai-gen',
        tool_name: 'AI Tools Generator',
        content: data,
        content_type: 'text',
        inputs: { feature: featureToUse, type: genType, audience: targetAudience, tone: tone }
      });
      queryClient.invalidateQueries({ queryKey: ['generatedHistory'] });
    }
  });

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-pink-100 rounded-lg">
            <Brain className="w-8 h-8 text-pink-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Pixel's AI Toolbox</h1>
            <p className="text-gray-600">Dreamy Nut, Poet Nut, and more. Create magic with AI.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger value="generate" className="rounded-none border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent px-4 py-3">
              🎨 Studio
            </TabsTrigger>
            <TabsTrigger value="resources" className="rounded-none border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent px-4 py-3">
              📚 Resources
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent px-4 py-3">
              📜 History
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="generate">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <Card className="border-pink-200">
                    <CardHeader>
                      <CardTitle>Generator Settings</CardTitle>
                      <CardDescription>Select tool to promote</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Feature/Tool */}
                      <div className="space-y-2">
                        <Label>AI Tool to Highlight</Label>
                        <Select value={genFeature} onValueChange={setGenFeature}>
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dreamy Nut">Dreamy Nut (Image Gen)</SelectItem>
                            <SelectItem value="Poet Nut">Poet Nut (Writing)</SelectItem>
                            <SelectItem value="Pixel's AI Toolbox Overview">Toolbox Overview</SelectItem>
                            <SelectItem value="Custom">✨ Custom Tool / Topic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {genFeature === 'Custom' && (
                        <div className="space-y-2">
                          <Label>Describe the Tool/Topic</Label>
                          <Input 
                            placeholder="e.g. AI Video Generators"
                            value={customFeature}
                            onChange={(e) => setCustomFeature(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Content Type */}
                      <div className="space-y-2">
                        <Label>Content Type</Label>
                        <Select value={genType} onValueChange={setGenType}>
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="social_caption">Social Media Caption</SelectItem>
                            <SelectItem value="short_script">Short Video Script (Reels/TikTok)</SelectItem>
                            <SelectItem value="story_idea">Story/Post Idea</SelectItem>
                            <SelectItem value="email_blurb">Email Newsletter Blurb</SelectItem>
                            <SelectItem value="dm_script">Direct Message Script</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Audience */}
                      <div className="space-y-2">
                        <Label>Target Audience</Label>
                        <Select value={targetAudience} onValueChange={setTargetAudience}>
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Digital Artists">Digital Artists</SelectItem>
                            <SelectItem value="Content Creators">Content Creators</SelectItem>
                            <SelectItem value="Writers">Writers / Bloggers</SelectItem>
                            <SelectItem value="Business Owners">Business Owners</SelectItem>
                            <SelectItem value="Tech Enthusiasts">Tech Enthusiasts</SelectItem>
                            <SelectItem value="Beginners">AI Beginners</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tone */}
                      <div className="space-y-2">
                        <Label>Tone</Label>
                        <Select value={tone} onValueChange={setTone}>
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pixel Style (Humorous)">Pixel Style (Humorous)</SelectItem>
                            <SelectItem value="Professional">Professional</SelectItem>
                            <SelectItem value="Encouraging">Encouraging & Warm</SelectItem>
                            <SelectItem value="Sassy/Edgy">Sassy / Edgy</SelectItem>
                            <SelectItem value="Neurospicy Friendly">Neurospicy Friendly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white mt-2"
                        onClick={() => generateMutation.mutate()}
                        disabled={generateMutation.isPending}
                      >
                        {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Create Magic
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2">
                  <Card className="h-full min-h-[400px] border-pink-100 bg-pink-50/30">
                    <CardHeader>
                      <CardTitle>Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {generatedContent ? (
                        <div className="space-y-4">
                           <div className="p-6 bg-white rounded-xl shadow-sm border border-pink-100 font-sans text-sm whitespace-pre-wrap">
                             {generatedContent}
                           </div>
                           
                           <div className="flex gap-2 justify-end">
                             <Button variant="outline" onClick={() => {
                               navigator.clipboard.writeText(generatedContent);
                               setCopySuccess(true);
                               setTimeout(() => setCopySuccess(false), 2000);
                             }}>
                               {copySuccess ? <span className="flex items-center gap-1">✓ Copied</span> : <><Copy className="w-4 h-4 mr-2" /> Copy</>}
                             </Button>
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-pink-300 py-12">
                          <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                          <p className="text-pink-400 font-medium">Your imagination awaits...</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="resources">
              <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <Select value={resourceCategory} onValueChange={setResourceCategory}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Resources</SelectItem>
                        <SelectItem value="custom_gpt">Custom GPTs</SelectItem>
                        <SelectItem value="image">Images & Graphics</SelectItem>
                        <SelectItem value="video">Videos</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <Button 
                      size="sm" 
                      variant={viewMode === 'grid' ? 'white' : 'ghost'} 
                      className={`h-8 px-2 ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant={viewMode === 'list' ? 'white' : 'ghost'}
                      className={`h-8 px-2 ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                {(() => {
                  const allResources = [
                    ...customGPTs.map(t => ({...t, resourceType: 'custom_gpt'})),
                    ...assets.map(a => ({...a, resourceType: a.type || 'image'}))
                  ].filter(item => resourceCategory === 'all' || item.resourceType === resourceCategory);

                  if (allResources.length === 0) {
                    return (
                      <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                        <Brain className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>No resources found in this category.</p>
                      </div>
                    );
                  }

                  if (viewMode === 'list') {
                    return (
                      <div className="space-y-3">
                        {allResources.map(item => (
                          <div key={item.id} className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {item.resourceType === 'custom_gpt' ? (
                                <Brain className="w-6 h-6 text-pink-500" />
                              ) : item.resourceType === 'image' && item.asset_url ? (
                                <img src={item.asset_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 truncate">{item.tool_name || item.title}</h3>
                              <p className="text-sm text-gray-500 truncate">{item.description || item.caption}</p>
                            </div>
                            <div className="flex-shrink-0">
                              {item.resourceType === 'custom_gpt' ? (
                                <Button size="sm" variant="outline" onClick={() => window.open(item.pixels_toolbox_url, '_blank')}>
                                  <Sparkles className="w-4 h-4 mr-2 text-pink-500" /> Open
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => window.open(item.asset_url, '_blank')}>
                                  <Download className="w-4 h-4 mr-2" /> Download
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  // Grid View
                  return (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allResources.map(item => {
                        if (item.resourceType === 'custom_gpt') {
                          return (
                            <Card key={item.id} className="hover:shadow-lg transition-all border-pink-100 h-full flex flex-col group">
                              <CardHeader>
                                <div className="flex justify-between items-start gap-4">
                                  <CardTitle className="text-lg font-bold text-gray-800 leading-tight">{item.tool_name}</CardTitle>
                                  <div className="p-2 bg-pink-50 rounded-lg shrink-0 group-hover:bg-pink-100 transition-colors">
                                    <Brain className="w-5 h-5 text-pink-500" />
                                  </div>
                                </div>
                                <CardDescription className="line-clamp-3 mt-2">{item.description}</CardDescription>
                              </CardHeader>
                              <CardContent className="mt-auto pt-0">
                                <Button 
                                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white" 
                                  onClick={() => window.open(item.pixels_toolbox_url, '_blank')}
                                >
                                  <Sparkles className="w-4 h-4 mr-2" /> Open in ChatGPT
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        } else {
                          return (
                            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all h-full flex flex-col">
                              {item.resourceType === 'image' && (
                                <div className="aspect-video bg-gray-100 relative group/image">
                                  <img src={item.asset_url} alt={item.title} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="secondary" size="sm" onClick={() => window.open(item.asset_url, '_blank')}>
                                      <ExternalLink className="w-4 h-4 mr-2" /> View Full
                                    </Button>
                                  </div>
                                </div>
                              )}
                              <CardContent className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold mb-1">{item.title}</h3>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">{item.caption}</p>
                                <Button variant="outline" size="sm" className="w-full mt-auto" onClick={() => window.open(item.asset_url, '_blank')}>
                                  <Download className="w-4 h-4 mr-2" /> Download
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        }
                      })}
                    </div>
                  );
                })()}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No history yet.</div>
                ) : (
                  history.map(item => (
                    <Card key={item.id}>
                      <CardContent className="p-4 flex gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="border-pink-300 text-pink-700">{item.inputs?.feature || item.tool_name}</Badge>
                            <span className="text-xs text-gray-400">{new Date(item.created_date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-3">{item.content}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(item.content)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}