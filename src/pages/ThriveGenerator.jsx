import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Image as ImageIcon, Copy, Download, Save, RefreshCw, Lightbulb, Trash2 } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { motion } from 'framer-motion';

const CATEGORY = 'thrive';

export default function ThriveGenerator() {
  const { bgClass } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('generate');
  
  // Generator State (Matching the old ReferralsTab logic)
  const [genFeature, setGenFeature] = useState('Overview');
  const [customFeature, setCustomFeature] = useState('');
  const [genType, setGenType] = useState('social_caption');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

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
      // Filter strictly for this category if possible, or filter client side.
      // Assuming we tag them or just show all for now, but better to filter.
      // Since Thrive Generator doesn't use ContentGeneratorTool entity in this hardcoded version, 
      // we might not find matching tool_ids. 
      // We will save new history with a special tool_name "Thrive Generator".
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
      const res = await base44.functions.invoke('generateMarketingContent', {
        feature: featureToUse,
        contentType: genType,
        targetAudience: 'creators' // Defaulting as per previous tab
      });
      return res.data?.content;
    },
    onSuccess: async (data) => {
      setGeneratedContent(data);
      
      // Save to NEW history structure automatically? 
      // The old tab didn't auto-save to history, it had a "Save" button. 
      // New requested flow usually implies auto-save history or explicit.
      // Let's auto-save to history for convenience in the "Studio" model.
      
      const user = await base44.auth.me();
      const featureToUse = genFeature === 'Custom' ? customFeature : genFeature;
      
      await base44.entities.GeneratedContentHistory.create({
        user_email: user.email,
        tool_id: 'thrive-gen',
        tool_name: 'Thrive Generator',
        content: data,
        content_type: 'text',
        inputs: { feature: featureToUse, type: genType }
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
        notes: `Generated for feature: ${featureToUse} (${genType})`,
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
                      <CardTitle>Generator Settings</CardTitle>
                      <CardDescription>Select what you want to promote</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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

                      <Button 
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
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
                           <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap font-sans text-sm border border-teal-100">
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
                             <Button variant="default" className="bg-teal-600" onClick={() => {
                               navigator.clipboard.writeText(generatedContent);
                               setCopySuccess(true);
                               setTimeout(() => setCopySuccess(false), 2000);
                             }}>
                               {copySuccess ? <span className="flex items-center gap-1">✓ Copied</span> : <><Copy className="w-4 h-4 mr-2" /> Copy</>}
                             </Button>
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                          <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                          <p>Select a feature and type to generate magic!</p>
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