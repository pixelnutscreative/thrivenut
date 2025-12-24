import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Image as ImageIcon, Copy, Download, Save, RefreshCw } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

const CATEGORY = 'thrive';

export default function ThriveGenerator() {
  const { bgClass } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('generate');
  
  // Generator State
  const [selectedToolId, setSelectedToolId] = useState('');
  const [inputs, setInputs] = useState({});
  const [generatedResult, setGeneratedResult] = useState(null);

  // Fetch Tools
  const { data: tools = [] } = useQuery({
    queryKey: ['generatorTools', CATEGORY],
    queryFn: async () => {
      const all = await base44.entities.ContentGeneratorTool.filter({ category: CATEGORY, is_active: true });
      return all;
    }
  });

  const selectedTool = tools.find(t => t.id === selectedToolId);

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
      // Assuming filter allows filtering by related tool category or we filter client side
      // For now, fetching all history and filtering is safest if no backend filter
      const allHistory = await base44.entities.GeneratedContentHistory.filter({ user_email: user.email }, '-created_date');
      // Filter client side for this category's tools
      const toolIds = tools.map(t => t.id);
      return allHistory.filter(h => toolIds.includes(h.tool_id));
    },
    enabled: tools.length > 0
  });

  // Mutations
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTool) return;
      
      // Simulate API call for now (or use backend function if one exists)
      // Since user asked for backend function, we'll use 'generateMarketingContent' if it supports it, 
      // or a new generic 'runGeneratorTool' function.
      // For this phase, I'll assume we adapt 'generateMarketingContent' or mock it until backend is ready.
      
      // Construct prompt
      let prompt = selectedTool.prompt_template;
      Object.keys(inputs).forEach(key => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), inputs[key] || '');
      });

      // Call backend
      const res = await base44.functions.invoke('generateMarketingContent', {
        prompt,
        type: selectedTool.output_type,
        toolId: selectedTool.id
      });
      return res.data;
    },
    onSuccess: async (data) => {
      setGeneratedResult(data); // data = { content: "..." }
      
      // Save to history
      const user = await base44.auth.me();
      await base44.entities.GeneratedContentHistory.create({
        user_email: user.email,
        tool_id: selectedTool.id,
        tool_name: selectedTool.name,
        content: data.content,
        content_type: selectedTool.output_type,
        inputs: inputs
      });
      queryClient.invalidateQueries({ queryKey: ['generatedHistory'] });
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
            <h1 className="text-3xl font-bold text-gray-800">Thrive Content Studio</h1>
            <p className="text-gray-600">Generate captions, scripts, and grab ready-to-post assets for Thrive.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger value="generate" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-4 py-3">
              ✨ Generator
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Tool Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Select Tool</Label>
                        <Select value={selectedToolId} onValueChange={(v) => {
                          setSelectedToolId(v);
                          setInputs({});
                          setGeneratedResult(null);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a tool..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tools.map(tool => (
                              <SelectItem key={tool.id} value={tool.id}>
                                {tool.icon} {tool.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedTool && (
                        <div className="space-y-4 pt-4 border-t">
                          <p className="text-sm text-gray-500">{selectedTool.description}</p>
                          
                          {selectedTool.input_fields?.map(field => (
                            <div key={field.name}>
                              <Label>{field.label}</Label>
                              {field.type === 'select' ? (
                                <Select 
                                  value={inputs[field.name] || ''} 
                                  onValueChange={(v) => setInputs({...inputs, [field.name]: v})}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options?.map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : field.type === 'textarea' ? (
                                <Textarea 
                                  placeholder={field.placeholder}
                                  value={inputs[field.name] || ''}
                                  onChange={(e) => setInputs({...inputs, [field.name]: e.target.value})}
                                />
                              ) : (
                                <Input 
                                  placeholder={field.placeholder}
                                  value={inputs[field.name] || ''}
                                  onChange={(e) => setInputs({...inputs, [field.name]: e.target.value})}
                                />
                              )}
                            </div>
                          ))}

                          <Button 
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={() => generateMutation.mutate()}
                            disabled={generateMutation.isPending}
                          >
                            {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Generate Content
                          </Button>
                        </div>
                      )}
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
                      {generatedResult ? (
                        <div className="space-y-4">
                           {selectedTool?.output_type === 'image' ? (
                             <img src={generatedResult.content} alt="Generated" className="w-full rounded-lg shadow-md" />
                           ) : (
                             <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap font-sans text-sm">
                               {generatedResult.content}
                             </div>
                           )}
                           
                           <div className="flex gap-2 justify-end">
                             <Button variant="outline" onClick={() => navigator.clipboard.writeText(generatedResult.content)}>
                               <Copy className="w-4 h-4 mr-2" /> Copy
                             </Button>
                             {selectedTool?.output_type === 'image' && (
                               <Button variant="outline" onClick={() => window.open(generatedResult.content, '_blank')}>
                                 <Download className="w-4 h-4 mr-2" /> Download
                               </Button>
                             )}
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                          <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                          <p>Select a tool and click Generate to see magic happen!</p>
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
                    No assets found in the library yet.
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
                {history.map(item => (
                  <Card key={item.id}>
                    <CardContent className="p-4 flex gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>{item.tool_name}</Badge>
                          <span className="text-xs text-gray-400">{new Date(item.created_date).toLocaleDateString()}</span>
                        </div>
                        {item.content_type === 'image' ? (
                          <img src={item.content} alt="Historical" className="w-32 h-32 object-cover rounded" />
                        ) : (
                          <p className="text-sm text-gray-700 line-clamp-3">{item.content}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                         <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(item.content)}>
                           <Copy className="w-4 h-4" />
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}