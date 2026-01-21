import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sparkles, Image as ImageIcon, FileText, Code, MessageCircle, Video, Music, Volume2 } from 'lucide-react';
import GlobalContextHeader from '../components/ai-studio/GlobalContextHeader';

export default function AIGeneratorStudio() {
  const [activeTab, setActiveTab] = useState('image');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              AI App Creator
            </h1>
          </div>
          <p className="text-gray-600">Build powerful AI apps with custom inputs and outputs</p>
        </div>

        {/* Global Context Header */}
        <GlobalContextHeader />

        {/* Main Tabbed Interface */}
        <Card className="mt-8 shadow-xl">
          <CardHeader>
            <CardTitle>App Builders & Tools</CardTitle>
            <CardDescription>Select a builder to create your AI-powered app</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 h-auto p-2">
                <TabsTrigger value="image" className="flex flex-col items-center gap-1 p-3">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-xs">Image</span>
                </TabsTrigger>
                <TabsTrigger value="text" className="flex flex-col items-center gap-1 p-3">
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">Text</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="flex flex-col items-center gap-1 p-3">
                  <Code className="w-5 h-5" />
                  <span className="text-xs">Code</span>
                </TabsTrigger>
                <TabsTrigger value="conversational" className="flex flex-col items-center gap-1 p-3">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-xs">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="video" className="flex flex-col items-center gap-1 p-3">
                  <Video className="w-5 h-5" />
                  <span className="text-xs">Video</span>
                </TabsTrigger>
                <TabsTrigger value="music" className="flex flex-col items-center gap-1 p-3">
                  <Music className="w-5 h-5" />
                  <span className="text-xs">Music</span>
                </TabsTrigger>
                <TabsTrigger value="sfx" className="flex flex-col items-center gap-1 p-3">
                  <Volume2 className="w-5 h-5" />
                  <span className="text-xs">SFX</span>
                </TabsTrigger>
                <TabsTrigger value="marketplace" className="flex flex-col items-center gap-1 p-3">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs">More</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="mt-6">
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Image App Builder</h3>
                  <p className="text-gray-600 mb-6">Create AI-powered image generation apps with custom inputs</p>
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-500">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Building
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="text" className="mt-6">
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Text App Builder</h3>
                  <p className="text-gray-600 mb-6">Create AI-powered text generation apps</p>
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-500" disabled>
                    Coming Soon
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="code" className="mt-6">
                <div className="text-center py-12">
                  <Code className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Code App Builder</h3>
                  <p className="text-gray-600 mb-6">Create AI-powered web page generators</p>
                  <Button size="lg" className="bg-gradient-to-r from-green-600 to-teal-500" disabled>
                    Coming Soon
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="conversational" className="mt-6">
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Conversational App Builder</h3>
                  <p className="text-gray-600 mb-6">Create AI chatbots and virtual assistants</p>
                  <Button size="lg" className="bg-gradient-to-r from-orange-600 to-red-500" disabled>
                    Coming Soon
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="video" className="mt-6">
                <div className="text-center py-12">
                  <Video className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Kling Video Prompt Generator</h3>
                  <p className="text-gray-600 mb-6">Generate optimized prompts for Kling video AI</p>
                  <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-500" disabled>
                    Coming Soon
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="music" className="mt-6">
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-pink-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Music Generation App</h3>
                  <p className="text-gray-600 mb-6">Create custom music with AI</p>
                  <Button size="lg" className="bg-gradient-to-r from-pink-600 to-rose-500" disabled>
                    Coming Soon
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="sfx" className="mt-6">
                <div className="text-center py-12">
                  <Volume2 className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Sound Effects Generator</h3>
                  <p className="text-gray-600 mb-6">Generate custom sound effects with AI</p>
                  <Button size="lg" className="bg-gradient-to-r from-yellow-600 to-orange-500" disabled>
                    Coming Soon
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="marketplace" className="mt-6">
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">More Features</h3>
                  <p className="text-gray-600 mb-6">Marketplace, Style Cloning, Prompt Gallery, and more</p>
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-500" disabled>
                    Coming Soon
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}