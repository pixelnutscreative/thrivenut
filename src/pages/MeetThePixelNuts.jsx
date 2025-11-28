import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Upload, Users, Loader2, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PixelNutCard from '../components/pixelnuts/PixelNutCard';

export default function MeetThePixelNuts() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [user, setUser] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.email?.toLowerCase() === 'pixelnutscreative@gmail.com';

  const { data: pixelNuts = [], isLoading } = useQuery({
    queryKey: ['pixelNuts'],
    queryFn: () => base44.entities.PixelNut.list('sort_order'),
  });

  const filteredNuts = filterCategory === 'all' 
    ? pixelNuts 
    : pixelNuts.filter(p => p.category === filterCategory);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : filteredNuts.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < filteredNuts.length - 1 ? prev + 1 : 0));
  };

  const handleShuffle = () => {
    setCurrentIndex(Math.floor(Math.random() * filteredNuts.length));
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadStatus('No file selected');
      return;
    }

    setUploadStatus(`Reading file: ${file.name}...`);
    setIsUploading(true);
    
    try {
      const text = await file.text();
      setUploadStatus(`File loaded (${text.length} chars). Parsing...`);
      
      const lines = text.split('\n').filter(line => line.trim());
      setUploadStatus(`Found ${lines.length} lines. Processing...`);
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      
      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/("([^"]*)"|[^,]+)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
        if (values.length === 0) continue;

        const record = {};
        headers.forEach((header, idx) => {
          const value = values[idx] || '';
          // Map CSV headers to entity fields
          if (header.includes('name') && !header.includes('nick')) record.name = value;
          else if (header.includes('nick')) record.nickname = value;
          else if (header.includes('role')) record.role = value;
          else if (header.includes('category') || header.includes('type')) record.category = value.toLowerCase();
          else if (header.includes('bio') || header.includes('description')) record.bio = value;
          else if (header.includes('image') || header.includes('photo') || header.includes('pic')) record.image_url = value;
          else if (header.includes('tiktok') || header.includes('username')) record.tiktok_username = value;
          else if (header.includes('superpower') || header.includes('skill')) record.superpower = value;
          else if (header.includes('fun') || header.includes('fact')) record.fun_fact = value;
          else if (header.includes('emoji')) record.favorite_emoji = value;
          else if (header.includes('color')) record.card_color = value;
          else if (header.includes('order') || header.includes('sort')) record.sort_order = parseInt(value) || 100;
        });

        if (record.name) {
          records.push(record);
        }
      }

      setUploadStatus(`Found ${records.length} valid records. Saving...`);

      if (records.length > 0) {
        await base44.entities.PixelNut.bulkCreate(records);
        queryClient.invalidateQueries({ queryKey: ['pixelNuts'] });
        setUploadStatus(`✅ Successfully imported ${records.length} Pixel Nuts!`);
      } else {
        setUploadStatus(`❌ No valid records. Headers found: ${headers.join(', ')}`);
      }
    } catch (error) {
      setUploadStatus(`❌ Error: ${error.message}`);
    }
    setIsUploading(false);
    e.target.value = '';
  };

  const categories = [
    { value: 'all', label: 'All', emoji: '🥜' },
    { value: 'staff', label: 'Staff', emoji: '⭐' },
    { value: 'consultant', label: 'Consultants', emoji: '🎯' },
    { value: 'seed', label: 'Seeds', emoji: '🌱' },
    { value: 'other', label: 'Others', emoji: '✨' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-cyan-100">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-cyan-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
            Meet the Pixel Nuts! 🥜
          </h1>
          <p className="text-gray-600">Swipe through and meet the amazing creative team</p>
        </div>

        {/* Admin Upload */}
        {isAdmin && (
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <Button variant="outline" disabled={isUploading}>
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload CSV
                  </Button>
                </div>
                <span className="text-sm text-gray-500">
                  CSV columns: name, nickname, role, category, bio, tiktok_username, superpower, fun_fact, emoji, color
                </span>
              </div>
              {uploadStatus && (
                <div className={`mt-2 p-2 rounded text-sm ${uploadStatus.includes('✅') ? 'bg-green-100 text-green-800' : uploadStatus.includes('❌') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                  {uploadStatus}
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map(cat => (
            <Button
              key={cat.value}
              variant={filterCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterCategory(cat.value);
                setCurrentIndex(0);
              }}
              className={filterCategory === cat.value ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              {cat.emoji} {cat.label}
            </Button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Users className="w-4 h-4 mr-2" />
            {filteredNuts.length} Pixel Nuts
          </Badge>
          {filteredNuts.length > 0 && (
            <Badge variant="outline" className="text-lg px-4 py-2">
              {currentIndex + 1} of {filteredNuts.length}
            </Badge>
          )}
        </div>

        {/* Card Display */}
        {filteredNuts.length > 0 ? (
          <div className="relative">
            {/* Navigation Buttons */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -ml-4 md:-ml-16">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="rounded-full w-12 h-12 bg-white/80 backdrop-blur shadow-lg hover:bg-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </div>

            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-4 md:-mr-16">
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="rounded-full w-12 h-12 bg-white/80 backdrop-blur shadow-lg hover:bg-white"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>

            {/* Card */}
            <div className="px-8 md:px-20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={filteredNuts[currentIndex]?.id}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <PixelNutCard 
                    pixelNut={filteredNuts[currentIndex]} 
                    isActive={true}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Shuffle Button */}
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={handleShuffle}
                className="gap-2"
              >
                <Shuffle className="w-4 h-4" />
                Shuffle
              </Button>
            </div>

            {/* Dot Navigation */}
            <div className="flex justify-center gap-1 mt-4 flex-wrap max-w-md mx-auto">
              {filteredNuts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex 
                      ? 'bg-purple-600 w-6' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🥜</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pixel Nuts Yet!</h3>
              <p className="text-gray-500">
                {isAdmin 
                  ? 'Upload a CSV file to add team members.' 
                  : 'Check back soon to meet the team!'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}