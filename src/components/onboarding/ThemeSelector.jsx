import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

// Default colors
const DEFAULT_PRIMARY = '#1fd2ea';
const DEFAULT_ACCENT = '#bd84f5';
const DEFAULT_MENU = '#2a2a30'; // Dark grey default

const presetMenuColors = [
  { name: 'Dark Grey', value: '#2a2a30' },
  { name: 'White', value: '#ffffff' },
];

const isColorDark = (hexColor) => {
  if (!hexColor) return false;
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

export default function ThemeSelector({ themeData, onChange }) {
  const primaryColor = themeData?.primary_color || DEFAULT_PRIMARY;
  const accentColor = themeData?.accent_color || DEFAULT_ACCENT;
  const menuColor = themeData?.menu_color || DEFAULT_MENU;
  const isMenuDark = isColorDark(menuColor);

  const setPrimaryColor = (color) => onChange({ primary_color: color });
  const setAccentColor = (color) => onChange({ accent_color: color });
  const setMenuColor = (color) => onChange({ menu_color: color });

  const resetToDefaults = () => {
    onChange({
      primary_color: DEFAULT_PRIMARY,
      accent_color: DEFAULT_ACCENT,
      menu_color: DEFAULT_MENU,
    });
  };

  return (
    <div className="space-y-6">
      {/* Menu Color Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Menu Style</Label>
        <div className="grid grid-cols-2 gap-3">
          {presetMenuColors.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setMenuColor(preset.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                menuColor === preset.value
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div 
                className="w-full h-12 rounded-lg mb-2" 
                style={{ backgroundColor: preset.value, border: '1px solid #e5e7eb' }}
              />
              <div className="text-sm font-medium">{preset.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Customization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Accent Colors</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#1fd2ea"
                className="flex-1 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#bd84f5"
                className="flex-1 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <Card className="p-4 bg-gray-50">
          <Label className="text-sm font-semibold mb-3 block">Preview</Label>
          <div className="space-y-3">
            {/* Gradient Preview */}
            <div
              className="h-16 rounded-lg flex items-center justify-center text-white font-semibold shadow-md"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
            >
              Buttons & Highlights
            </div>
            
            {/* Menu Preview */}
            <div 
              className="p-4 rounded-lg border shadow-sm"
              style={{ backgroundColor: menuColor }}
            >
              <div className={`text-sm font-medium mb-2 ${isMenuDark ? 'text-white' : 'text-gray-800'}`}>
                Menu Example
              </div>
              <div className={`text-xs ${isMenuDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Navigation items will appear like this
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}