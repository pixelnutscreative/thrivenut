import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MessageCircle, Copy, Download, Zap, Sparkles } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { Badge } from '@/components/ui/badge';

const CATEGORY = 'nuts';

export default function NutsBotsGenerator() {
  const { bgClass } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('generate');
  
  // Generator State
  const [genFeature, setGenFeature] = useState('Overview');
  const [customFeature, setCustomFeature] = useState('');
  const [genType, setGenType] = useState('social_caption');
  const [targetAudience, setTargetAudience] = useState('Agency Owners');
  const [tone, setTone] = useState('Pixel Style (Humorous)');

  const [generatedContent, setGeneratedContent] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch Assets
  const { data: assets = [] } = useQuery({
    queryKey: ['marketingAssets', CATEGORY],
    queryFn: async () => {
      return await base44.entities.MarketingAsset.filter({ category: CATEGORY, is_active: true });
    }
  });

  // Fetch History
  const { data: history = [] } = useQuery({
    queryKey: ['generatedHistory', CATEGORY],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      const allHistory = await base44.entities.GeneratedContentHistory.filter({ user_email: user.email }, '-created_date');
      return allHistory.filter(h => h.tool_name === 'Nuts Bots Generator' || h.tool_id === 'nuts-gen');
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
        tool_id: 'nuts-gen',
        tool_name: 'Nuts Bots Generator',
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
          <div className="p-3 bg-blue-100 rounded-lg">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">The Nuts + Bots</h1>
            <p className="text-gray-600">Marketing materials for the High Level white-label suite.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger value="generate" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 py-3">
              🤖 Studio
            </TabsTrigger>
            <TabsTrigger value="library" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 py-3">
              📂 Assets
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 py-3">
              📜 History
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="generate">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <Card className="border-blue-200">
                    <CardHeader>
                      <CardTitle>Generator Settings</CardTitle>
                      <CardDescription>Select feature to highlight</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Feature */}
                      <div className="space-y-2">
                        <Label>Feature / Topic</Label>
                        <Select value={genFeature} onValueChange={setGenFeature}>
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Overview">Nuts + Bots Overview</SelectItem>
                            <SelectItem value="CRM & Contacts">CRM & Contacts</SelectItem>
                            <SelectItem value="Workflows & Automation">Workflows & Automation</SelectItem>
                            <SelectItem value="Funnels & Websites">Funnels & Websites</SelectItem>
                            <SelectItem value="Custom">✨ Custom Topic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {genFeature === 'Custom' && (
                        <div className="space-y-2">
                          <Label>Describe the Topic</Label>
                          <Input 
                            placeholder="e.g. Email Marketing"
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
                            <SelectItem value="Agency Owners">Agency Owners</SelectItem>
                            <SelectItem value="Marketers">Marketers</SelectItem>
                            <SelectItem value="Small Business Owners">Small Business Owners</SelectItem>
                            <SelectItem value="Coaches">Coaches</SelectItem>
                            <SelectItem value="Course Creators">Course Creators</SelectItem>
                            <SelectItem value="Entrepreneurs">Entrepreneurs</SelectItem>
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
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                        onClick={() => generateMutation.mutate()}
                        disabled={generateMutation.isPending}
                      >
                        {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                        Generate Content
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2">
                  <Card className="h-full min-h-[400px] border-blue-100 bg-blue-50/30">
                    <CardHeader>
                      <CardTitle>Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {generatedContent ? (
                        <div className="space-y-4">
                           <div className="p-6 bg-white rounded-xl shadow-sm border border-blue-100 font-sans text-sm whitespace-pre-wrap">
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
                        <div className="flex flex-col items-center justify-center h-full text-blue-300 py-12">
                          <Zap className="w-16 h-16 mb-4 opacity-50" />
                          <p className="text-blue-400 font-medium">Ready to automate your marketing?</p>
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
                    No assets available yet.
                  </div>
                ) : (
                  assets.map(asset => (
                    <Card key={asset.id} className="overflow-hidden">
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
                        <p className="text-xs text-gray-500 line-clamp-2">{asset.caption}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
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
                            <Badge variant="outline" className="border-blue-300 text-blue-700">{item.inputs?.feature || item.tool_name}</Badge>
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