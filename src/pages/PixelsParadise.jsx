import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Zap, Bot, Users, Play, Download, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DigitalTwinGallery from '@/components/DigitalTwinGallery';

export default function PixelsParadise() {
  const [activeTab, setActiveTab] = useState('all');

  const { data: platformUser, isLoading } = useQuery({
    queryKey: ['aiPlatformUser'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;
      const users = await base44.entities.AIPlatformUser.filter({ user_email: user.email });
      return users[0] || null;
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading your paradise...</div>;

  // Determine flags
  const platform = platformUser?.platform;
  const hasAIToolbox = platform === 'pixels_toolbox' || platform === 'lets_go_nuts' || platform === 'both';
  const hasNutsBots = platformUser?.has_nuts_and_bots;
  const hasDigitalTwin = platformUser?.has_digital_twin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 space-y-8">
      
      {/* Header Section */}
      <div className="text-center space-y-4 mb-12">
        <div className="flex justify-center mb-4">
           <Sparkles className="w-12 h-12 text-teal-500 animate-pulse" />
        </div>
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-teal-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
          Pixel's Place
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Your one-stop shop for all things Pixel Nuts Creative! Links, programs, tools, subscriptions, affiliate goodies, free trainings, and everything else I've hoarded like a digital squirrel. 🐿️
        </p>
      </div>

      {/* WORKSHOPS & CLASSES (Always Visible) */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">🎓</span> Workshops & Classes <span className="text-sm font-normal text-gray-500">(where the magic happens)</span>
        </h2>
        
        {/* Go Nuts Content Creation Challenge - Hide if has AI Toolbox */}
        {!hasAIToolbox && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">Go Nuts! Content Creation Challenge</h3>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">Fan Favorite</Badge>
                    </div>
                    <h4 className="text-cyan-600 font-extrabold text-2xl">AI CLASS</h4>
                    <p className="text-gray-600 max-w-3xl">
                        The legendary class where we go absolutely nuts creating content with AI. Warning: Side effects include uncontrollable creativity and an addiction to prompts. 🥜
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        <span className="bg-white px-2 py-1 rounded border">🗓️ T & Th 8am PST + Weekdays 3pm PST</span>
                    </div>
                </div>
                <ExternalLink className="text-cyan-400 w-5 h-5" />
             </div>
             <Button className="w-full mt-6 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-cyan-200">
                REGISTER FOR FREE
             </Button>
          </motion.div>
        )}
      </div>

      {/* DIGITAL TWIN SECTION */}
      <div className="space-y-4">
        
        {!hasDigitalTwin ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-purple-400 to-cyan-400 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-1">Have you created your Digital Twin yet?</h3>
                            <p className="text-white/90">Clone yourself (digitally!) so you can be in two places at once. It's the ultimate productivity hack.</p>
                        </div>
                    </div>
                    
                    {/* Upload button wrapper to handle the "make it go away" logic via DigitalTwinGallery component inside a modal or similar? 
                        User asked: "let's add a button to it that says (upload your digital twin pics, so people can upload theirs and then that box will go away and display under a NEW section below that says Digital Twin Gallery" 
                        The DigitalTwinGallery component handles the upload. I will render it inside a Dialog or just use the component's upload button logic.
                        Wait, if I use the DigitalTwinGallery component, it shows the gallery. 
                        The user wants this "Have you created..." banner to be REPLACED by the gallery once they have it.
                        So if !hasDigitalTwin, show banner with upload button.
                    */}
                    <div className="bg-white rounded-lg p-1">
                         <DigitalTwinGallery /> 
                         {/* 
                            Wait, DigitalTwinGallery has the gallery AND the upload button.
                            If I put it here, it will show the gallery inside the banner? That might look weird.
                            The user said: "that box will go away and display under a NEW section below that says Digital Twin Gallery"
                            
                            So:
                            If !hasDigitalTwin: Show Banner (with Upload Button).
                            If hasDigitalTwin: Show Gallery Section.
                            
                            But the upload logic is inside DigitalTwinGallery.
                            I should probably expose the Upload Dialog trigger separately?
                            Or just render a custom button here that opens the upload dialog?
                            
                            I'll modify DigitalTwinGallery to accept a 'mode' or just use it as is but hide the gallery part if requested?
                            Actually, the DigitalTwinGallery component I wrote handles the upload and updates the flag.
                            So I can just use the upload logic here.
                            
                            I'll modify the DigitalTwinGallery component to be just the gallery + upload button in header.
                            Here I want JUST the upload button, but styled differently.
                            
                            For simplicity, I will include the DigitalTwinGallery component below, but only if hasDigitalTwin.
                            AND here in the banner, I'll add a button that opens the SAME upload dialog.
                            
                            To do that cleanly, I should have put the upload dialog in a separate component or exported it.
                            But I'll just use the DigitalTwinGallery component's logic by rendering it conditionally.
                            
                            Actually, the user said: "add a button to it that says (upload your digital twin pics... and then that box will go away and display under a NEW section below"
                            
                            So:
                            1. Banner visible if !hasDigitalTwin.
                            2. Button in banner opens Upload Modal.
                            3. After upload, hasDigitalTwin becomes true.
                            4. Banner disappears.
                            5. Gallery appears below.
                         */}
                    </div>
                </div>
            </motion.div>
        ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <DigitalTwinGallery />
            </motion.div>
        )}
      </div>

      {/* PIXEL'S AI TOOLBOX - Hide if hasAIToolbox */}
      {!hasAIToolbox && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl p-1 shadow-xl text-white">
            <div className="bg-white/10 backdrop-blur-sm rounded-[22px] p-8 h-full border border-white/20">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg transform -rotate-3">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 space-y-6">
                        <div>
                            <h3 className="text-3xl font-extrabold flex items-center gap-3">
                                <span className="text-yellow-300">👑</span> Pixel's AI Toolbox
                            </h3>
                            <p className="mt-2 text-blue-50 font-medium text-lg leading-relaxed">
                                Access the most amazing collection of 300+ AI tools to do anything you could possibly imagine (almost, except AI video).
                            </p>
                        </div>
                        
                        <div className="space-y-4 bg-black/10 rounded-xl p-6 border border-white/10">
                            <p className="text-white/90">
                                Basically it's for <span className="font-bold text-yellow-300">less than one dollar a day</span> when paid annually!
                            </p>
                            <p className="text-white/90">
                                Also includes <span className="font-bold text-yellow-300">seven AI classes each week</span> where you can ask questions, get new tools, and get specific help for your needs! 🤯
                            </p>
                        </div>

                        <div className="pt-2">
                             <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold h-12 rounded-xl shadow-lg">
                                Get access now...
                             </Button>
                             <div className="text-center mt-3 text-sm text-blue-200 flex items-center justify-center gap-1">
                                Pick one and let's GO! ⬆️
                             </div>
                        </div>
                    </div>
                </div>

                {/* WANT IT ALL SECTION - Hide if hasNutsBots */}
                {!hasNutsBots && (
                    <div className="mt-8 pt-8 border-t border-white/20">
                        <div className="bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-2xl p-6 border border-white/20">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold flex items-center gap-2">
                                        🚀 WANT IT ALL? Get The Nuts + Bots
                                    </h4>
                                    <p className="text-blue-100 mt-1 mb-4">
                                        All the tools you need to run your business - CRM, funnels, automations, AND Pixel's AI Toolbox included!
                                    </p>
                                    <Button variant="secondary" className="bg-blue-200 text-blue-900 hover:bg-blue-100 border-none font-bold">
                                        See Pricing & Get Started
                                    </Button>
                                    <p className="mt-3 text-sm text-blue-200">
                                        🎉 Use coupon code <span className="bg-yellow-400 text-black px-1 rounded font-bold">NIKOLE</span> to get $111 off the annual plan!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
      )}

    </div>
  );
}