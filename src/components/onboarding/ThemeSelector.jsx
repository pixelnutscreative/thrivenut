import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Monitor, RotateCcw } from 'lucide-react';

const DEFAULT_PRIMARY = '#1fd2ea';
const DEFAULT_ACCENT = '#bd84f5';
const DEFAULT_MENU = '#ffffff';

// Preset menu color options
const menuPresets = [
  { color: '#ffffff', label: 'White', textClass: 'text-gray-800' },
  { color: '#f8fafc', label: 'Light Gray', textClass: 'text-gray-800' },
  { color: '#1e293b', label: 'Dark Slate', textClass: 'text-white' },
  { color: '#0f172a', label: 'Dark Navy', textClass: 'text-white' },
  { color: '#18181b', label: 'Near Black', textClass: 'text-white' },
  { color: '#faf5ff', label: 'Light Purple', textClass: 'text-gray-800' },
];

// Helper to determine if a color is dark
const isColorDark = (hex) => {
  if (!hex) return false;
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

export default function ThemeSelector({ themeData, onChange }) {
  const themes = [
    { id: 'light', name: 'Light', icon: Sun, description: 'Clean, bright interface' },
    { id: 'dark', name: 'Dark', icon: Moon, description: 'Easy on the eyes' },
    { id: 'system', name: 'System', icon: Monitor, description: 'Match your device' }
  ];

  const currentMenuColor = themeData.menu_color || DEFAULT_MENU;
  const menuIsDark = isColorDark(currentMenuColor);

  const handleResetColors = () => {
    onChange({
      ...themeData,
      primary_color: DEFAULT_PRIMARY,
      accent_color: DEFAULT_ACCENT,
      menu_color: DEFAULT_MENU
    });
  };

  return (
    <div className="space-y-6">
      {/* Theme Mode Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Theme Mode</Label>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(theme => {
            const Icon = theme.icon;
            const isSelected = themeData.theme_type === theme.id;
            return (
              <Card
                key={theme.id}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-purple-500' : ''
                } ${
                  theme.id === 'dark' 
                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                    : theme.id === 'system'
                    ? 'bg-gradient-to-br from-white to-gray-800 hover:from-gray-50 hover:to-gray-700'
                    : 'bg-white hover:bg-gray-50'
                }`}
                onClick={() => onChange({ ...themeData, theme_type: theme.id })}
              >
                <CardContent className="p-4 text-center">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    isSelected ? 'text-purple-400' : theme.id === 'dark' ? 'text-gray-300' : 'text-gray-500'
                  }`} />
                  <p className={`font-medium text-sm ${theme.id === 'dark' ? 'text-white' : ''}`}>{theme.name}</p>
                  <p className={`text-xs mt-1 ${theme.id === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{theme.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Color Customization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Custom Colors</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetColors}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset to Default
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Primary Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={themeData.primary_color || DEFAULT_PRIMARY}
                onChange={(e) => onChange({ ...themeData, primary_color: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={themeData.primary_color || DEFAULT_PRIMARY}
                onChange={(e) => onChange({ ...themeData, primary_color: e.target.value })}
                className="flex-1 font-mono text-sm"
                placeholder="#1fd2ea"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Accent Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={themeData.accent_color || DEFAULT_ACCENT}
                onChange={(e) => onChange({ ...themeData, accent_color: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={themeData.accent_color || DEFAULT_ACCENT}
                onChange={(e) => onChange({ ...themeData, accent_color: e.target.value })}
                className="flex-1 font-mono text-sm"
                placeholder="#bd84f5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Menu Color</Label>
            <div className="flex flex-wrap gap-2">
              {menuPresets.map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => onChange({ ...themeData, menu_color: preset.color })}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    currentMenuColor === preset.color ? 'ring-2 ring-purple-500 ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: preset.color, borderColor: preset.color === '#ffffff' ? '#e5e7eb' : preset.color }}
                  title={preset.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg border bg-white">
          <p className="text-sm text-gray-500 mb-2">Preview:</p>
          <div className="flex gap-2">
            <div className="flex-1 text-center">
              <div
                className="h-8 rounded mb-1"
                style={{ backgroundColor: themeData.primary_color || DEFAULT_PRIMARY }}
              />
              <span className="text-xs text-gray-400">Primary</span>
            </div>
            <div className="flex-1 text-center">
              <div
                className="h-8 rounded mb-1"
                style={{ backgroundColor: themeData.accent_color || DEFAULT_ACCENT }}
              />
              <span className="text-xs text-gray-400">Accent</span>
            </div>
            <div className="flex-1 text-center">
              <div
                className="h-8 rounded mb-1 border flex items-center justify-center"
                style={{ backgroundColor: currentMenuColor }}
              >
                <span className={`text-xs font-medium ${menuIsDark ? 'text-white' : 'text-gray-700'}`}>
                  Aa
                </span>
              </div>
              <span className="text-xs text-gray-400">Menu</span>
            </div>
          </div>
          {/* Menu Preview */}
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-400 mb-2">Menu Preview:</p>
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: currentMenuColor }}
            >
              <div className={`flex items-center gap-2 ${menuIsDark ? 'text-white' : 'text-gray-700'}`}>
                <Sun className="w-4 h-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </div>
              <div className={`flex items-center gap-2 mt-1 ${menuIsDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Moon className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </div>
            </div>
          </div>
          {/* Button Preview */}
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-400 mb-2">Button Preview:</p>
            <button
              className="w-full py-2 rounded-lg text-white font-medium text-sm"
              style={{ background: `linear-gradient(to right, ${themeData.primary_color || DEFAULT_PRIMARY}, ${themeData.accent_color || DEFAULT_ACCENT})` }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}