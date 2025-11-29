import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Monitor, RotateCcw } from 'lucide-react';

const DEFAULT_PRIMARY = '#1fd2ea';
const DEFAULT_ACCENT = '#bd84f5';
const DEFAULT_MENU = '#ffffff';

export default function ThemeSelector({ themeData, onChange }) {
  const themes = [
    { id: 'light', name: 'Light', icon: Sun, description: 'Clean, bright interface' },
    { id: 'dark', name: 'Dark', icon: Moon, description: 'Easy on the eyes' },
    { id: 'system', name: 'System', icon: Monitor, description: 'Match your device' }
  ];

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
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={themeData.menu_color || DEFAULT_MENU}
                onChange={(e) => onChange({ ...themeData, menu_color: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={themeData.menu_color || DEFAULT_MENU}
                onChange={(e) => onChange({ ...themeData, menu_color: e.target.value })}
                className="flex-1 font-mono text-sm"
                placeholder="#ffffff"
              />
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
                className="h-8 rounded mb-1 border"
                style={{ backgroundColor: themeData.menu_color || DEFAULT_MENU }}
              />
              <span className="text-xs text-gray-400">Menu</span>
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