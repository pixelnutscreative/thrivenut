import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Copy, Check, Sparkles, Heart, Star, Zap, PartyPopper, ThumbsUp, Flame, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

// Pre-made emoji reaction sets
const emojiSets = {
  love: {
    name: '💕 Love & Support',
    emojis: ['❤️', '🫶', '💕', '🥰', '😍', '💗', '💖', '💝', '🤗', '😊', '🌸', '✨'],
    text: 'Sending love!'
  },
  hype: {
    name: '🔥 Hype & Energy',
    emojis: ['🔥', '⚡', '💥', '🚀', '✨', '💫', '⭐', '🌟', '😱', '🤩', '💪', '👏'],
    text: 'LET\'S GOOO!'
  },
  cute: {
    name: '🐻 Cute & Cozy',
    emojis: ['🐻', '🧸', '🌸', '🌺', '🦋', '🐰', '🌷', '☀️', '🌻', '🐾', '💫', '🎀'],
    text: 'So cute!'
  },
  party: {
    name: '🎉 Celebration',
    emojis: ['🎉', '🎊', '🥳', '🎈', '🎁', '🍾', '🥂', '✨', '💃', '🕺', '🎶', '🌈'],
    text: 'PARTY TIME!'
  },
  nature: {
    name: '🌿 Nature Vibes',
    emojis: ['🌿', '🌸', '🌺', '🌻', '🌷', '🍀', '🌈', '☀️', '🌙', '⭐', '🦋', '🐝'],
    text: 'Nature is healing'
  },
  gaming: {
    name: '🎮 Gamer Mode',
    emojis: ['🎮', '👾', '🕹️', '⚔️', '🏆', '💎', '🔮', '⚡', '🔥', '💀', '👑', '🎯'],
    text: 'GG!'
  },
  food: {
    name: '🍕 Foodie',
    emojis: ['🍕', '🍔', '🍟', '🌮', '🍩', '🍰', '🍦', '☕', '🧋', '🍪', '🥤', '🍫'],
    text: 'Yummy!'
  },
  money: {
    name: '💰 Boss Vibes',
    emojis: ['💰', '💵', '💎', '👑', '🏆', '⭐', '✨', '🔥', '💪', '🚀', '📈', '💯'],
    text: 'Money moves!'
  }
};

// Shape templates - each position gets filled with emojis
const shapeTemplates = {
  heart: {
    name: '❤️ Heart',
    pattern: [
      [0, 1, 1, 0, 0, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
    ],
    corners: ['◢', '◣', '◤', '◥']
  },
  diamond: {
    name: '💎 Diamond',
    pattern: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
    ],
    corners: ['◢', '◣', '◤', '◥']
  },
  pyramid: {
    name: '🔺 Pyramid',
    pattern: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
    ],
    corners: ['◢', '◣', '◤', '◥']
  },
  star: {
    name: '⭐ Star',
    pattern: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 1, 0, 1, 0],
    ],
    corners: null
  },
  wave: {
    name: '🌊 Wave',
    pattern: [
      [1, 0, 0, 1, 0, 0, 1],
      [1, 1, 0, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    corners: null
  },
  circle: {
    name: '⭕ Circle',
    pattern: [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
    ],
    corners: null
  },
  tree: {
    name: '🎄 Tree',
    pattern: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
    ],
    corners: null
  },
};

// Special corner styles
const cornerStyles = {
  pointed: { tl: '◢', tr: '◣', bl: '◤', br: '◥' },
  none: { tl: '', tr: '', bl: '', br: '' },
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯' },
};

export default function EmojiArtMaker() {
  const [selectedSet, setSelectedSet] = useState('love');
  const [selectedShape, setSelectedShape] = useState('heart');
  const [customText, setCustomText] = useState('');
  const [useCorners, setUseCorners] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generatedArt, setGeneratedArt] = useState('');

  const generateEmojiArt = () => {
    const set = emojiSets[selectedSet];
    const shape = shapeTemplates[selectedShape];
    const emojis = set.emojis;
    
    let art = '';
    let emojiIndex = 0;

    shape.pattern.forEach((row, rowIdx) => {
      let line = '';
      row.forEach((cell, colIdx) => {
        if (cell === 1) {
          // Use corners for first/last in certain positions
          const isTopLeft = rowIdx === 0 && colIdx === row.indexOf(1);
          const isTopRight = rowIdx === 0 && colIdx === row.lastIndexOf(1);
          const isBottomLeft = rowIdx === shape.pattern.length - 1 && colIdx === row.indexOf(1);
          const isBottomRight = rowIdx === shape.pattern.length - 1 && colIdx === row.lastIndexOf(1);
          
          if (useCorners && shape.corners) {
            if (isTopLeft) {
              line += cornerStyles.pointed.tl;
            } else if (isTopRight) {
              line += cornerStyles.pointed.tr;
            } else if (isBottomLeft) {
              line += cornerStyles.pointed.bl;
            } else if (isBottomRight) {
              line += cornerStyles.pointed.br;
            } else {
              line += emojis[emojiIndex % emojis.length];
              emojiIndex++;
            }
          } else {
            line += emojis[emojiIndex % emojis.length];
            emojiIndex++;
          }
        } else {
          line += '　'; // Full-width space for alignment
        }
      });
      art += line + '\n';
    });

    // Add text at the bottom
    const text = customText || set.text;
    if (text) {
      art += '\n' + text;
    }

    setGeneratedArt(art);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedArt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate initial art
  React.useEffect(() => {
    generateEmojiArt();
  }, [selectedSet, selectedShape, useCorners, customText]);

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Sparkles className="w-5 h-5" />
          Emoji Art Maker
          <Badge className="bg-purple-100 text-purple-700 ml-2">Fun!</Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">Create fun emoji shapes for TikTok comments!</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Emoji Set Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Choose Your Vibe</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(emojiSets).map(([key, set]) => (
              <button
                key={key}
                onClick={() => setSelectedSet(key)}
                className={`p-2 rounded-lg text-sm font-medium transition-all ${
                  selectedSet === key
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-purple-100 border border-gray-200'
                }`}
              >
                {set.name}
              </button>
            ))}
          </div>
        </div>

        {/* Shape Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Pick a Shape</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(shapeTemplates).map(([key, shape]) => (
              <button
                key={key}
                onClick={() => setSelectedShape(key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedShape === key
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-pink-100 border border-gray-200'
                }`}
              >
                {shape.name}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useCorners}
              onChange={(e) => setUseCorners(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm">Add corner accents (◢◣◤◥)</span>
          </label>
        </div>

        {/* Custom Text */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Custom Message (optional)</label>
          <Input
            placeholder={emojiSets[selectedSet].text}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="bg-white"
          />
        </div>

        {/* Preview */}
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <pre className="text-white font-mono text-lg leading-relaxed whitespace-pre-wrap">
            {generatedArt}
          </pre>
        </div>

        {/* Emoji Palette Preview */}
        <div className="flex flex-wrap gap-1 justify-center bg-white/50 rounded-lg p-2">
          {emojiSets[selectedSet].emojis.map((emoji, i) => (
            <span key={i} className="text-xl">{emoji}</span>
          ))}
        </div>

        {/* Copy Button */}
        <Button
          onClick={copyToClipboard}
          className={`w-full ${copied ? 'bg-green-500 hover:bg-green-600' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied! Paste it in TikTok comments! 🎉
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Emoji Art
            </>
          )}
        </Button>

        {/* Quick Examples */}
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 text-center">
            Pro tip: These look AMAZING in TikTok Live comments! 💜
          </p>
        </div>
      </CardContent>
    </Card>
  );
}