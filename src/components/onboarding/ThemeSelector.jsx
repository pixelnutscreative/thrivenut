import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sun, Moon, Brush } from 'lucide-react';

export default function ThemeSelector({ themeData, onChange }) {
  const { theme_type, primary_color, accent_color } = themeData;

  // Default colors: Turquoise primary, Lavender accent
  const defaultPrimary = '#1fd2ea';
  const defaultAccent = '#bd84f5';

  return (
    <div className="space-y-8">
      {/* Light/Dark Mode Selection */}
      <div>
        <h4 className="font-semibold mb-4">Mode</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ThemeCard
            icon={Sun}
            title="Light"
            description="White background"
            selected={theme_type === 'light' || !theme_type || theme_type === 'clean_white'}
            onClick={() => onChange({ 
              ...themeData, 
              theme_type: 'light',
              primary_color: primary_color || defaultPrimary,
              accent_color: accent_color || defaultAccent
            })}
            preview={{ bg: '#ffffff', text: '#1f2937' }}
          />
          <ThemeCard
            icon={Moon}
            title="Dark"
            description="Dark grey background"
            selected={theme_type === 'dark'}
            onClick={() => onChange({ 
              ...themeData, 
              theme_type: 'dark',
              primary_color: primary_color || defaultPrimary,
              accent_color: accent_color || defaultAccent
            })}
            preview={{ bg: '#1f1f23', text: '#f3f4f6' }}
          />
          <ThemeCard
            icon={Brush}
            title="Custom Colors"
            description="Choose your own"
            selected={theme_type === 'custom'}
            onClick={() => onChange({ 
              ...themeData, 
              theme_type: 'custom',
              primary_color: primary_color || defaultPrimary,
              accent_color: accent_color || defaultAccent
            })}
            preview={{ bg: '#ffffff', text: '#1f2937' }}
          />
        </div>
      </div>

      {/* Color Preview */}
      <div className="p-4 rounded-xl border-2 border-gray-200">
        <h4 className="font-semibold mb-3">Your Colors</h4>
        <div className="flex gap-4 items-center">
          <div 
            className="w-16 h-16 rounded-lg shadow-md flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: primary_color || defaultPrimary }}
          >
            Primary
          </div>
          <div 
            className="w-16 h-16 rounded-lg shadow-md flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: accent_color || defaultAccent }}
          >
            Accent
          </div>
          <div className="text-sm text-gray-600">
            <p>Primary: {primary_color || defaultPrimary}</p>
            <p>Accent: {accent_color || defaultAccent}</p>
          </div>
        </div>
      </div>

      {/* Custom Color Picker - Always show for custom, optional reset for others */}
      {theme_type === 'custom' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="primary">Primary Color (Turquoise default)</Label>
            <div className="flex gap-3 items-center mt-2">
              <Input
                id="primary"
                type="color"
                value={primary_color || defaultPrimary}
                onChange={(e) => onChange({ ...themeData, primary_color: e.target.value })}
                className="w-20 h-12 cursor-pointer"
              />
              <Input
                type="text"
                value={primary_color || defaultPrimary}
                onChange={(e) => onChange({ ...themeData, primary_color: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="accent">Accent Color (Lavender default)</Label>
            <div className="flex gap-3 items-center mt-2">
              <Input
                id="accent"
                type="color"
                value={accent_color || defaultAccent}
                onChange={(e) => onChange({ ...themeData, accent_color: e.target.value })}
                className="w-20 h-12 cursor-pointer"
              />
              <Input
                type="text"
                value={accent_color || defaultAccent}
                onChange={(e) => onChange({ ...themeData, accent_color: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...themeData, primary_color: defaultPrimary, accent_color: defaultAccent })}
            className="text-sm text-purple-600 hover:text-purple-800 underline"
          >
            Reset to default (Turquoise & Lavender)
          </button>
        </div>
      )}

      {/* Info for Light/Dark modes */}
      {(theme_type === 'light' || theme_type === 'dark' || !theme_type) && (
        <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
          <p className="text-sm text-teal-800">
            ✨ Using the ThriveNut signature colors: Turquoise & Lavender. 
            Choose "Custom Colors" above to pick your own.
          </p>
        </div>
      )}
    </div>
  );
}

function ThemeCard({ icon: Icon, title, description, selected, onClick, preview }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
        selected ? 'border-purple-500 ring-4 ring-purple-100 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
      }`}
    >
      <div 
        className="w-12 h-8 rounded mx-auto mb-2 flex items-center justify-center border"
        style={{ backgroundColor: preview.bg, color: preview.text }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}