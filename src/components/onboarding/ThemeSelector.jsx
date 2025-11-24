import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, Moon, Palette, Zap, Brush, Accessibility } from 'lucide-react';

const metalAccents = [
  { id: 'gold', name: 'Gold', colors: ['#FFD700', '#FFA500', '#DAA520'] },
  { id: 'rose_gold', name: 'Rose Gold', colors: ['#B76E79', '#E0BBE4', '#C9A0A0'] },
  { id: 'silver', name: 'Silver', colors: ['#C0C0C0', '#D3D3D3', '#A9A9A9'] },
  { id: 'platinum', name: 'Platinum', colors: ['#E5E4E2', '#C9C0BB', '#B0B0B0'] },
  { id: 'copper', name: 'Copper', colors: ['#B87333', '#CD7F32', '#DA8A67'] }
];

const pastelColors = [
  { id: 'blush_pink', name: 'Blush Pink', colors: ['#FFE5E5', '#FFB6C1', '#FFC0CB'] },
  { id: 'mint_green', name: 'Mint Green', colors: ['#E8F5E9', '#A7FFEB', '#98FF98'] },
  { id: 'lavender', name: 'Lavender', colors: ['#E6E6FA', '#D8BFD8', '#DDA0DD'] },
  { id: 'baby_blue', name: 'Baby Blue', colors: ['#E0F7FA', '#B3E5FC', '#ADD8E6'] }
];

const brightColors = [
  { id: 'aqua', name: 'Aqua', colors: ['#00FFFF', '#00CED1', '#48D1CC'] },
  { id: 'coral', name: 'Coral', colors: ['#FF6B6B', '#FF7F50', '#FA8072'] },
  { id: 'sunshine_yellow', name: 'Sunshine Yellow', colors: ['#FFD54F', '#FFEB3B', '#FFC107'] },
  { id: 'lime_green', name: 'Lime Green', colors: ['#CDDC39', '#9CCC65', '#8BC34A'] }
];

export default function ThemeSelector({ themeData, onChange }) {
  const { theme_type, metal_accent, pastel_color, bright_color, primary_color, accent_color } = themeData;

  return (
    <div className="space-y-8">
      {/* Theme Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <ThemeCard
          icon={Sparkles}
          title="Clean White"
          selected={theme_type === 'clean_white'}
          onClick={() => onChange({ ...themeData, theme_type: 'clean_white', metal_accent: metal_accent || 'gold' })}
        />
        <ThemeCard
          icon={Moon}
          title="Dark"
          selected={theme_type === 'dark'}
          onClick={() => onChange({ ...themeData, theme_type: 'dark', metal_accent: metal_accent || 'silver' })}
        />
        <ThemeCard
          icon={Palette}
          title="Pastel"
          selected={theme_type === 'pastel'}
          onClick={() => onChange({ ...themeData, theme_type: 'pastel', pastel_color: pastel_color || 'blush_pink' })}
        />
        <ThemeCard
          icon={Zap}
          title="Bright & Fun"
          selected={theme_type === 'bright'}
          onClick={() => onChange({ ...themeData, theme_type: 'bright', bright_color: bright_color || 'aqua' })}
        />
        <ThemeCard
          icon={Brush}
          title="Custom Colors"
          selected={theme_type === 'custom_two_color'}
          onClick={() => onChange({ ...themeData, theme_type: 'custom_two_color', primary_color: primary_color || '#8B5CF6', accent_color: accent_color || '#EC4899' })}
        />
        <ThemeCard
          icon={Accessibility}
          title="Sensory-Friendly"
          selected={theme_type === 'sensory_friendly'}
          onClick={() => onChange({ ...themeData, theme_type: 'sensory_friendly' })}
        />
      </div>

      {/* Metal Accent Selection for Clean White & Dark */}
      {(theme_type === 'clean_white' || theme_type === 'dark') && (
        <div>
          <h4 className="font-semibold mb-4">Choose Metal Accent</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {metalAccents.map(metal => (
              <div
                key={metal.id}
                onClick={() => onChange({ ...themeData, metal_accent: metal.id })}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  metal_accent === metal.id ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  {metal.colors.map((color, idx) => (
                    <div key={idx} className="w-6 h-6 rounded-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <p className="text-sm font-medium text-center">{metal.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pastel Color Selection */}
      {theme_type === 'pastel' && (
        <div>
          <h4 className="font-semibold mb-4">Choose Pastel Color</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pastelColors.map(color => (
              <div
                key={color.id}
                onClick={() => onChange({ ...themeData, pastel_color: color.id })}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  pastel_color === color.id ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  {color.colors.map((c, idx) => (
                    <div key={idx} className="w-6 h-6 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="text-sm font-medium text-center">{color.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bright Color Selection */}
      {theme_type === 'bright' && (
        <div>
          <h4 className="font-semibold mb-4">Choose Bright Color</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {brightColors.map(color => (
              <div
                key={color.id}
                onClick={() => onChange({ ...themeData, bright_color: color.id })}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  bright_color === color.id ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  {color.colors.map((c, idx) => (
                    <div key={idx} className="w-6 h-6 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="text-sm font-medium text-center">{color.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Two-Color Picker */}
      {theme_type === 'custom_two_color' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="primary">Primary Color</Label>
            <div className="flex gap-3 items-center mt-2">
              <Input
                id="primary"
                type="color"
                value={primary_color || '#8B5CF6'}
                onChange={(e) => onChange({ ...themeData, primary_color: e.target.value })}
                className="w-20 h-12 cursor-pointer"
              />
              <Input
                type="text"
                value={primary_color || '#8B5CF6'}
                onChange={(e) => onChange({ ...themeData, primary_color: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="accent">Accent Color</Label>
            <div className="flex gap-3 items-center mt-2">
              <Input
                id="accent"
                type="color"
                value={accent_color || '#EC4899'}
                onChange={(e) => onChange({ ...themeData, accent_color: e.target.value })}
                className="w-20 h-12 cursor-pointer"
              />
              <Input
                type="text"
                value={accent_color || '#EC4899'}
                onChange={(e) => onChange({ ...themeData, accent_color: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sensory-Friendly Info */}
      {theme_type === 'sensory_friendly' && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            ✨ Sensory-Friendly Mode provides low contrast colors, minimal animations, 
            and a simplified interface designed for neurodivergent accessibility.
          </p>
        </div>
      )}
    </div>
  );
}

function ThemeCard({ icon: Icon, title, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-xl border-2 cursor-pointer transition-all text-center ${
        selected ? 'border-purple-500 ring-4 ring-purple-100 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
      }`}
    >
      <Icon className={`w-8 h-8 mx-auto mb-2 ${selected ? 'text-purple-600' : 'text-gray-500'}`} />
      <p className="font-semibold text-sm">{title}</p>
    </div>
  );
}