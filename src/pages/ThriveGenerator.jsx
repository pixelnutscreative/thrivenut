import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Image as ImageIcon, Copy, Download, Save, RefreshCw, Lightbulb, Trash2, ExternalLink, Image } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

const CATEGORY = 'thrive';

export default function ThriveGenerator() {
  const { bgClass, effectiveEmail, preferences } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('generate');
  
  // Generator State
  const [genFeature, setGenFeature] = useState('Overview');
  const [customFeature, setCustomFeature] = useState('');
  
  const [genType, setGenType] = useState('social_caption');
  const [customType, setCustomType] = useState('');
  
  const [targetAudience, setTargetAudience] = useState('Entrepreneurs');
  const [customAudience, setCustomAudience] = useState('');
  
  const [tone, setTone] = useState('Pixel Style (Humorous)');
  const [customTone, setCustomTone] = useState('');
  
  const [generatedContent, setGeneratedContent] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showToolPicker, setShowToolPicker] = useState(false);

  // Fetch AI tool links
  const { data: aiToolLinks = [] } = useQuery({
    queryKey: ['aiToolLinks'],
    queryFn: () => base44.entities.AIToolLink.filter({ is_active: true }, 'sort_order'),
  });

  // Detect user's AI platform (for tool links)
  const { data: platformUser } = useQuery({
    queryKey: ['platformUser', effectiveEmail],
    queryFn: async () => {
      if (!effectiveEmail) return null;
      const users = await base44.entities.AIPlatformUser.filter({ user_email: effectiveEmail });
      return users[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const userPlatform = preferences?.ai_platform || platformUser?.platform || 'lets_go_nuts';

  // Fetch Assets (Content Library)
  const { data: assets = [] } = useQuery({
    queryKey: ['marketingAssets', CATEGORY],
    queryFn: async () => {
      return await base44.entities.MarketingAsset.filter({ category: CATEGORY, is_active: true });
    }
  });

  // Fetch OLD History (SavedMotivation)
  const { data: savedReferralContent = [] } = useQuery({
    queryKey: ['savedReferralContent'],
    queryFn: async () => {
      return await base44.entities.SavedMotivation.filter({ 
        category: 'Thrive Referrals' 
      }, '-created_date');
    }
  });

  // Fetch NEW History (GeneratedContentHistory)
  const { data: newHistory = [] } = useQuery({
    queryKey: ['generatedHistory', CATEGORY],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      const allHistory = await base44.entities.GeneratedContentHistory.filter({ user_email: user.email }, '-created_date');
      return allHistory.filter(h => h.tool_name === 'Thrive Generator' || h.tool_id === 'thrive-gen');
    }
  });

  // Combine History
  const combinedHistory = [
    ...newHistory.map(h => ({
      id: h.id,
      content: h.content,
      created_date: h.created_date,
      type: 'new',
      label: h.inputs?.feature || 'Generated'
    })),
    ...savedReferralContent.map(h => ({
      id: h.id,
      content: h.content,
      created_date: h.created_date,
      type: 'old',
      label: 'Saved Idea'
    }))
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  // Generate Mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const featureToUse = genFeature === 'Custom' ? customFeature : genFeature;
      const typeToUse = genType === 'Custom' ? customType : genType;
      const audienceToUse = targetAudience === 'Custom' ? customAudience : targetAudience;
      const toneToUse = tone === 'Custom' ? customTone : tone;

      const res = await base44.functions.invoke('generateMarketingContent', {
        feature: featureToUse,
        contentType: typeToUse,
        targetAudience: audienceToUse,
        tone: toneToUse
      });
      return res.data?.content;
    },
    onSuccess: async (data) => {
      setGeneratedContent(data);
      
      const user = await base44.auth.me();
      const featureToUse = genFeature === 'Custom' ? customFeature : genFeature;
      const typeToUse = genType === 'Custom' ? customType : genType;
      const audienceToUse = targetAudience === 'Custom' ? customAudience : targetAudience;
      const toneToUse = tone === 'Custom' ? customTone : tone;
      
      await base44.entities.GeneratedContentHistory.create({
        user_email: user.email,
        tool_id: 'thrive-gen',
        tool_name: 'Thrive Generator',
        content: data,
        content_type: 'text',
        inputs: { feature: featureToUse, type: typeToUse, audience: audienceToUse, tone: toneToUse }
      });
      queryClient.invalidateQueries({ queryKey: ['generatedHistory'] });
    }
  });

  // Save as "Saved Idea" (Legacy support / Favorites)
  const saveAsIdeaMutation = useMutation({
    mutationFn: async (content) => {
      const featureToUse = genFeature === 'Custom' ? customFeature : genFeature;
      await base44.entities.SavedMotivation.create({
        content: content,
        type: 'ai_generated',
        category: 'Thrive Referrals',
        notes: `Generated for: ${featureToUse} (${genType}) - ${tone}`,
        used_for_content: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedReferralContent'] });
    }
  });

  const deleteOldContentMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.SavedMotivation.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedReferralContent'] });
    }
  });

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-teal-100 rounded-lg">
            <Sparkles className="w-8 h-8 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Thrive Nut</h1>
            <p className="text-gray-600">Generate captions, scripts, and grab ready-to-post assets.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger value="generate" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-4 py-3">
              ✨ UGC Studio
            </TabsTrigger>
            <TabsTrigger value="library" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-4 py-3">
              📂 Content Library
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-4 py-3">
              📜 My History
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="generate">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="border-teal-200">
                    <CardHeader>
                      <CardTitle>Tool Settings</CardTitle>
                      <CardDescription>Select what you want to promote</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Feature Selection */}
                      <div className="space-y-2">
                        <Label>Feature to Highlight</Label>
                        <Select value={genFeature} onValueChange={setGenFeature}>
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Overview">App Overview (All-in-One)</SelectItem>
                            <SelectItem value="Content Creator Hub">Content Creator Hub (Suite)</SelectItem>
                            <SelectItem value="TikTok Engagement">TikTok Engagement CRM (Suite)</SelectItem>
                            <SelectItem value="Live Schedule">Live Schedule & Calendar (Suite)</SelectItem>
                            <SelectItem value="Battle Prep">Battle Prep & Inventory (Suite)</SelectItem>
                            <SelectItem value="Goals & Habits">Goals & Habits Tracking</SelectItem>
                            <SelectItem value="Journal & Mental Health">Journal & Mental Health</SelectItem>
                            <SelectItem value="My Stuff">My Resources Organization</SelectItem>
                            <SelectItem value="Finance">Finance & Budgeting</SelectItem>
                            <SelectItem value="Custom">✨ Custom Feature / Topic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {genFeature === 'Custom' && (
                        <div className="space-y-2">
                          <Label>Describe the Topic</Label>
                          <Input 
                            placeholder="e.g. How I use the water tracker"
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
                            <SelectItem value="image_post">Image + Post Copy</SelectItem>
                            <SelectItem value="short_script">Short Video Script (Reels/TikTok)</SelectItem>
                            <SelectItem value="ai_character">AI Character Video (Voiceover)</SelectItem>
                            <SelectItem value="ai_song">Short AI Song (approx 1:11)</SelectItem>
                            <SelectItem value="story_idea">Story/Post Idea</SelectItem>
                            <SelectItem value="email_blurb">Email Newsletter Blurb</SelectItem>
                            <SelectItem value="dm_script">Direct Message Script</SelectItem>
                            <SelectItem value="Custom">✨ Custom Type</SelectItem>
                          </SelectContent>
                        </Select>
                        {genType === 'Custom' && (
                          <Input 
                            placeholder="e.g. LinkedIn Article"
                            value={customType}
                            onChange={(e) => setCustomType(e.target.value)}
                            className="mt-2"
                          />
                        )}
                      </div>

                      {/* Target Audience */}
                      <div className="space-y-2">
                        <Label>Target Audience</Label>
                        <Select value={targetAudience} onValueChange={setTargetAudience}>
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Entrepreneurs">Entrepreneurs</SelectItem>
                            <SelectItem value="Creators">Content Creators</SelectItem>
                            <SelectItem value="Neurodivergent Minds">Neurodivergent Minds</SelectItem>
                            <SelectItem value="Moms">Moms / Parents</SelectItem>
                            <SelectItem value="Students">Students</SelectItem>
                            <SelectItem value="Busy Professionals">Busy Professionals</SelectItem>
                            <SelectItem value="Custom">✨ Custom Audience</SelectItem>
                          </SelectContent>
                        </Select>
                        {targetAudience === 'Custom' && (
                          <Input 
                            placeholder="e.g. Yoga Instructors"
                            value={customAudience}
                            onChange={(e) => setCustomAudience(e.target.value)}
                            className="mt-2"
                          />
                        )}
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
                            <SelectItem value="Custom">✨ Custom Tone</SelectItem>
                          </SelectContent>
                        </Select>
                        {tone === 'Custom' && (
                          <Input 
                            placeholder="e.g. Witty and Dry"
                            value={customTone}
                            onChange={(e) => setCustomTone(e.target.value)}
                            className="mt-2"
                          />
                        )}
                      </div>

                      <Button 
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-2"
                        onClick={() => generateMutation.mutate()}
                        disabled={generateMutation.isPending}
                      >
                        {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Generate Content
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Output */}
                <div className="lg:col-span-2">
                  <Card className="h-full min-h-[400px]">
                    <CardHeader>
                      <CardTitle>Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {generatedContent ? (
                        <div className="space-y-4">
                           <div className="p-6 bg-gray-50 rounded-lg whitespace-pre-wrap font-sans text-sm border border-teal-100 shadow-inner">
                             {generatedContent}
                           </div>
                           
                           <div className="flex gap-2 justify-end">
                             <Button 
                               variant="outline" 
                               onClick={() => saveAsIdeaMutation.mutate(generatedContent)}
                               disabled={saveAsIdeaMutation.isPending}
                             >
                               <Save className="w-4 h-4 mr-2" /> Save as Idea
                             </Button>
                             
                             <div className="relative">
                               <Button 
                                 variant="default" 
                                 className="bg-teal-600" 
                                 onClick={() => setShowToolPicker(!showToolPicker)}
                               >
                                 <Copy className="w-4 h-4 mr-2" /> Copy & Open Tool
                               </Button>

                               {showToolPicker && (
                                 <>
                                   <div className="fixed inset-0 z-40" onClick={() => setShowToolPicker(false)} />
                                   <div className="absolute right-0 bottom-full mb-2 bg-white border border-teal-200 rounded-lg shadow-xl z-50 p-2 min-w-[240px]">
                                     <button
                                       onClick={() => {
                                         navigator.clipboard.writeText(generatedContent);
                                         setCopySuccess(true);
                                         setTimeout(() => setCopySuccess(false), 2000);
                                         setShowToolPicker(false);
                                       }}
                                       className="w-full flex items-center gap-2 px-3 py-2 hover:bg-teal-50 rounded text-left border-b border-gray-100 mb-1"
                                     >
                                       <Copy className="w-4 h-4 text-teal-600" />
                                       <span className="text-sm font-medium">Just Copy</span>
                                     </button>
                                     <p className="text-xs font-semibold text-gray-500 my-2 px-2">Copy & Open In:</p>
                                     <div className="space-y-1 max-h-64 overflow-y-auto">
                                       {aiToolLinks.map(tool => {
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
                                               navigator.clipboard.writeText(generatedContent);
                                               window.open(url, '_blank');
                                               setShowToolPicker(false);
                                             }}
                                             className="w-full flex items-center gap-2 px-3 py-2 hover:bg-teal-50 rounded text-left"
                                           >
                                             {tool.icon_url ? (
                                               <img src={tool.icon_url} alt="" className="w-5 h-5 rounded object-cover" />
                                             ) : tool.icon_emoji ? (
                                               <span className="text-lg">{tool.icon_emoji}</span>
                                             ) : (
                                               <Image className="w-4 h-4 text-gray-400" />
                                             )}
                                             <span className="text-sm font-medium truncate">{tool.tool_name}</span>
                                           </button>
                                         );
                                       })}
                                     </div>
                                   </div>
                                 </>
                               )}
                             </div>
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                          <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                          <p>Select your settings and click Generate to see magic happen!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="library">
              <div className="grid md:grid-cols-3 gap-6">
                {assets.length === 0 ? (
                  <div className="col-span-3 text-center py-12 text-gray-500">
                    No ready-to-post assets found yet. Check back soon!
                  </div>
                ) : (
                  assets.map(asset => (
                    <Card key={asset.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {asset.type === 'image' && (
                        <div className="aspect-video bg-gray-100 relative group">
                          <img src={asset.asset_url} alt={asset.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="secondary" size="sm" onClick={() => window.open(asset.asset_url, '_blank')}>
                              <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                          </div>
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-bold mb-1">{asset.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{asset.caption}</p>
                        <div className="flex flex-wrap gap-1">
                          {asset.keywords?.split(',').map(k => (
                            <Badge key={k} variant="secondary" className="text-[10px]">{k.trim()}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-4">
                {combinedHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No history yet.</div>
                ) : (
                  combinedHistory.map(item => (
                    <Card key={item.id} className="border border-gray-100">
                      <CardContent className="p-4 flex gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={item.type === 'old' ? 'secondary' : 'default'} className={item.type === 'new' ? 'bg-teal-600' : ''}>
                              {item.label}
                            </Badge>
                            <span className="text-xs text-gray-400">{new Date(item.created_date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">{item.content}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                           <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(item.content)} title="Copy">
                             <Copy className="w-4 h-4" />
                           </Button>
                           {item.type === 'old' && (
                             <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => deleteOldContentMutation.mutate(item.id)} title="Delete">
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           )}
                        </div>
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