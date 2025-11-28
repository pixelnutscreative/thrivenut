import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Sparkles, ExternalLink } from 'lucide-react';

const categoryStyles = {
  staff: { bg: 'from-purple-500 to-pink-500', label: '⭐ Staff' },
  consultant: { bg: 'from-teal-500 to-cyan-500', label: '🎯 Consultant' },
  seed: { bg: 'from-green-500 to-emerald-500', label: '🌱 Seed' },
  other: { bg: 'from-blue-500 to-indigo-500', label: '✨ Friend' }
};

export default function PixelNutCard({ pixelNut, isActive }) {
  const category = categoryStyles[pixelNut.category] || categoryStyles.other;
  const cardColor = pixelNut.card_color || '#bd84f5';

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: isActive ? 1 : 0.9, opacity: isActive ? 1 : 0.5 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-sm mx-auto"
    >
      <Card 
        className="relative overflow-hidden rounded-3xl shadow-2xl"
        style={{ 
          background: `linear-gradient(145deg, ${cardColor}22, ${cardColor}44)`,
          border: `3px solid ${cardColor}`
        }}
      >
        {/* Card Header with gradient */}
        <div 
          className={`h-4 bg-gradient-to-r ${category.bg}`}
        />

        {/* Image Section */}
        <div className="relative p-4 pb-0">
          <div 
            className="aspect-square rounded-2xl overflow-hidden border-4 shadow-lg"
            style={{ borderColor: cardColor }}
          >
            {pixelNut.image_url ? (
              <img 
                src={pixelNut.image_url} 
                alt={pixelNut.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-6xl"
                style={{ background: `linear-gradient(135deg, ${cardColor}44, ${cardColor}88)` }}
              >
                {pixelNut.favorite_emoji || '🥜'}
              </div>
            )}
          </div>

          {/* Featured badge */}
          {pixelNut.is_featured && (
            <div className="absolute top-6 right-6 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <Sparkles className="w-3 h-3" /> Featured
            </div>
          )}

          {/* Category badge */}
          <Badge 
            className={`absolute bottom-2 left-6 bg-gradient-to-r ${category.bg} text-white border-0 shadow-lg`}
          >
            {category.label}
          </Badge>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-3">
          {/* Name & Nickname */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {pixelNut.name}
              {pixelNut.favorite_emoji && <span className="ml-2">{pixelNut.favorite_emoji}</span>}
            </h2>
            {pixelNut.nickname && (
              <p className="text-gray-500 text-sm italic">aka "{pixelNut.nickname}"</p>
            )}
          </div>

          {/* Role */}
          {pixelNut.role && (
            <div 
              className="text-center py-2 px-4 rounded-full mx-auto w-fit text-sm font-semibold"
              style={{ backgroundColor: `${cardColor}33`, color: cardColor }}
            >
              {pixelNut.role}
            </div>
          )}

          {/* Bio */}
          {pixelNut.bio && (
            <p className="text-gray-600 text-center text-sm leading-relaxed">
              {pixelNut.bio}
            </p>
          )}

          {/* Stats / Info Cards */}
          <div className="grid grid-cols-1 gap-2 pt-2">
            {pixelNut.superpower && (
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Superpower</p>
                <p className="font-semibold text-gray-700">⚡ {pixelNut.superpower}</p>
              </div>
            )}
            {pixelNut.fun_fact && (
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Fun Fact</p>
                <p className="font-semibold text-gray-700">💡 {pixelNut.fun_fact}</p>
              </div>
            )}
          </div>

          {/* TikTok Link */}
          {pixelNut.tiktok_username && (
            <a 
              href={`https://tiktok.com/@${pixelNut.tiktok_username.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2 px-4 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors mx-auto w-fit"
            >
              <span>@{pixelNut.tiktok_username.replace('@', '')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Card Footer */}
        <div 
          className={`h-2 bg-gradient-to-r ${category.bg}`}
        />
      </Card>
    </motion.div>
  );
}