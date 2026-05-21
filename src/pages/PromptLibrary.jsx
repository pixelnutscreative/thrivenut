import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Lock, Video, BookOpen, Sparkles, Youtube, Check } from 'lucide-react';
import { toast } from 'sonner';

const PIXEL_PRESS_TAGS = ['subscriber-pixelnuts', 'subscriber-aitoolbox', 'subscriber-pixelpress', 'subscriber-thenutsandbots'];
const OPUS_TAGS = ['subscriber-pixelnuts', 'subscriber-aitoolbox', 'subscriber-opusvideostyles'];
const CUSTOM_GPT_TAGS = ['subscriber-pixelnuts', 'subscriber-aitoolbox'];

const checkAccess = (userTagsString, requiredTags) => {
  const userTags = (userTagsString || '').split(',').map(t => t.trim().toLowerCase());
  return requiredTags.some(rt => userTags.includes(rt.toLowerCase()));
};

export default function PromptLibrary() {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const fetchPrompts = async () => {
    const url = 'https://docs.google.com/spreadsheets/d/1mHzzZFtmnVFd_rPSxX08EvkC2gR49SqqzztULJS9SVY/export?format=csv&gid=0';
    const res = await base44.functions.invoke('fetchPublicSheetCsv', { url });
    if (res.data?.error) throw new Error(res.data.error);
    return res.data.csv;
  };

  const { data: csvText, isLoading: csvLoading } = useQuery({
    queryKey: ['pixel_press_prompts'],
    queryFn: fetchPrompts,
    enabled: !!user && checkAccess(user?.ghl_tags, PIXEL_PRESS_TAGS)
  });

  const parseCSV = (text) => {
    if (!text) return [];
    const lines = text.split(/\r?\n/);
    return lines.map(line => {
      const row = [];
      let cur = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          if (i < line.length - 1 && line[i+1] === '"') {
            cur += '"'; i++;
          } else {
            inQuote = !inQuote;
          }
        } else if (line[i] === ',' && !inQuote) {
          row.push(cur); cur = '';
        } else {
          cur += line[i];
        }
      }
      row.push(cur);
      return row;
    }).filter(row => row.some(cell => cell.trim() !== ''));
  };

  if (userLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-[#24C4D6]" /></div>;
  }

  if (!user) return null;

  const hasPixelPress = checkAccess(user.ghl_tags, PIXEL_PRESS_TAGS);
  const hasOpus = checkAccess(user.ghl_tags, OPUS_TAGS);
  const hasGpts = checkAccess(user.ghl_tags, CUSTOM_GPT_TAGS);

  const prompts = hasPixelPress ? parseCSV(csvText).slice(1) : []; // skip header

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const LockedCard = ({ title, description, link }) => (
    <Card className="bg-slate-50 border-slate-200 relative overflow-hidden h-64 flex flex-col items-center justify-center text-center p-6 group">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-10" />
      <div className="z-20 flex flex-col items-center max-w-sm mx-auto">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <Lock className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6 text-sm">{description}</p>
        <Button 
          className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white shadow-md transition-transform hover:scale-105"
          onClick={() => window.open(link, '_blank')}
        >
          Get Access →
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-white p-6 font-sans">
      <div className="max-w-[1200px] mx-auto space-y-12">
        <div className="bg-slate-50 p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-[#24C4D6]/10 rounded-2xl">
            <BookOpen className="w-8 h-8 text-[#24C4D6]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Prompt Library</h1>
            <p className="text-slate-500 mt-1">Your premium collection of AI prompts and tools</p>
          </div>
        </div>

        {/* Section 1: Pixel Press AI Prompts */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <Sparkles className="w-6 h-6 text-[#24C4D6]" />
            <h2 className="text-2xl font-bold text-slate-800">Pixel Press AI Prompts</h2>
          </div>

          {!hasPixelPress ? (
            <LockedCard 
              title="Pixel Press AI Prompts" 
              description="Unlock our massive library of plug-and-play AI prompts designed for content creators." 
              link="#" 
            />
          ) : csvLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#24C4D6]" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {prompts.map((row, idx) => {
                if (row.length < 6) return null;
                const [num, title, imageUrl, notes, videoUrl, promptText] = row;
                if (!title || !promptText) return null;
                const isBonus = num && num.toUpperCase().startsWith('BONUS');

                return (
                  <Card key={idx} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col relative">
                    {isBonus && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm z-10">
                        BONUS
                      </div>
                    )}
                    {imageUrl && (
                      <div className="h-48 overflow-hidden bg-slate-100 relative">
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-6 flex flex-col flex-grow">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">
                          {num && <span className="text-[#24C4D6] mr-2">{num}.</span>}
                          {title}
                        </h3>
                      </div>
                      
                      {notes && (
                        <p className="text-sm italic text-slate-500 mb-4">{notes}</p>
                      )}
                      
                      <div className="mt-auto pt-6 flex flex-wrap items-center gap-3">
                        <Button 
                          className="flex-1 bg-[#A7E063] hover:bg-[#92ca53] text-slate-800 font-semibold shadow-sm"
                          onClick={() => copyToClipboard(promptText, idx)}
                        >
                          {copiedIndex === idx ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                          {copiedIndex === idx ? 'Copied!' : 'Copy Prompt'}
                        </Button>
                        
                        {videoUrl && (
                          <Button 
                            variant="outline"
                            className="text-slate-600 hover:text-rose-600 hover:bg-rose-50 border-slate-200"
                            onClick={() => window.open(videoUrl, '_blank')}
                          >
                            <Video className="w-4 h-4 mr-2" />
                            View Video
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Opus Video Styles Prompts */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <Youtube className="w-6 h-6 text-[#24C4D6]" />
            <h2 className="text-2xl font-bold text-slate-800">Opus Video Styles Prompts</h2>
          </div>

          {!hasOpus ? (
            <LockedCard 
              title="Opus Video Styles" 
              description="Get the exact prompts we use to generate stunning Opus clip styles." 
              link="#" 
            />
          ) : (
            <div className="bg-slate-50 rounded-2xl p-12 flex flex-col items-center justify-center text-center border border-slate-100">
              <Loader2 className="w-8 h-8 animate-spin text-[#24C4D6] mb-4" />
              <p className="text-slate-500 font-medium">More prompts loading soon...</p>
            </div>
          )}
        </section>

        {/* Section 3: Custom GPTs */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <BookOpen className="w-6 h-6 text-[#24C4D6]" />
            <h2 className="text-2xl font-bold text-slate-800">Custom GPTs</h2>
          </div>

          {!hasGpts ? (
            <LockedCard 
              title="Custom GPTs" 
              description="Access our private collection of fine-tuned Custom GPTs to automate your workflow." 
              link="#" 
            />
          ) : (
            <div className="bg-slate-50 rounded-2xl p-12 flex flex-col items-center justify-center text-center border border-slate-100">
              <Loader2 className="w-8 h-8 animate-spin text-[#24C4D6] mb-4" />
              <p className="text-slate-500 font-medium">More tools loading soon...</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}