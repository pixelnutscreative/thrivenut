import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Smartphone, Square, Monitor, Facebook, Youtube, Linkedin, Instagram } from 'lucide-react';

const IMAGE_SIZES = [
  { id: '9:16', label: 'Vertical (9:16)', width: 1080, height: 1920, icon: Smartphone, color: 'text-blue-500', description: 'Stories, Reels, TikTok' },
  { id: '1:1', label: 'Square (1:1)', width: 1080, height: 1080, icon: Square, color: 'text-purple-500', description: 'Instagram Posts' },
  { id: '16:9', label: 'Landscape (16:9)', width: 1920, height: 1080, icon: Monitor, color: 'text-green-500', description: 'YouTube, Presentations' },
  { id: 'fb-cover', label: 'Facebook Cover', width: 820, height: 312, icon: Facebook, color: 'text-blue-600', description: '820x312' },
  { id: 'yt-thumbnail', label: 'YouTube Thumbnail', width: 1280, height: 720, icon: Youtube, color: 'text-red-500', description: '1280x720' },
  { id: 'linkedin-banner', label: 'LinkedIn Banner', width: 1584, height: 396, icon: Linkedin, color: 'text-blue-700', description: '1584x396' },
  { id: 'ig-landscape', label: 'Instagram Landscape', width: 1080, height: 566, icon: Instagram, color: 'text-pink-500', description: '1080x566' },
];

export default function ImageSizeSelector({ selectedSizes, setSelectedSizes, customWidth, setCustomWidth, customHeight, setCustomHeight }) {
  const toggleSize = (sizeId) => {
    setSelectedSizes(prev => 
      prev.includes(sizeId) 
        ? prev.filter(id => id !== sizeId)
        : [...prev, sizeId]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Output Image Sizes</CardTitle>
        <CardDescription>Select which sizes to generate (all sizes created from same prompt)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {IMAGE_SIZES.map(size => {
            const Icon = size.icon;
            return (
              <div 
                key={size.id}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedSizes.includes(size.id) 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleSize(size.id)}
              >
                <Checkbox 
                  checked={selectedSizes.includes(size.id)} 
                  onCheckedChange={() => toggleSize(size.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${size.color}`} />
                    <span className="font-medium text-sm">{size.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{size.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Size */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium mb-3 block">Custom Size</Label>
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <Label className="text-xs text-gray-600">Width (px)</Label>
              <Input 
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                placeholder="1920"
              />
            </div>
            <span className="text-gray-400 mt-5">×</span>
            <div className="flex-1">
              <Label className="text-xs text-gray-600">Height (px)</Label>
              <Input 
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                placeholder="1080"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}