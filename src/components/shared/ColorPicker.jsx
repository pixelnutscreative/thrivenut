import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pipette, Copy, Heart, Plus, Trash2, ChevronDown, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useTheme } from './useTheme';

// --- Color Utility Functions ---

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Simple RGB to HSB conversion
const rgbToHsb = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) h = 0;
  else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), b: Math.round(v * 100) };
};

const hsbToRgb = (h, s, b) => {
  s /= 100; b /= 100;
  const k = (n) => (n + h / 60) % 6;
  const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  return {
    r: Math.round(f(5) * 255),
    g: Math.round(f(3) * 255),
    b: Math.round(f(1) * 255)
  };
};

// --- Presets ---
// A subset of Crayola colors
const CRAYOLA_COLORS = [
  { name: 'Red', hex: '#ED0A3F' },
  { name: 'Maroon', hex: '#C32148' },
  { name: 'Scarlet', hex: '#FD0E35' },
  { name: 'Brick Red', hex: '#C62D42' },
  { name: 'English Vermilion', hex: '#CC474B' },
  { name: 'Madder Lake', hex: '#CC3336' },
  { name: 'Permanent Geranium Lake', hex: '#E12C2C' },
  { name: 'Maximum Red', hex: '#D92121' },
  { name: 'Chestnut', hex: '#BC5D58' },
  { name: 'Orange', hex: '#FF8833' },
  { name: 'Yellow Orange', hex: '#FFAB59' },
  { name: 'Melon', hex: '#FEBAAD' },
  { name: 'Atomic Tangerine', hex: '#FF9966' },
  { name: 'Vivid Tangerine', hex: '#FF9980' },
  { name: 'Burnt Orange', hex: '#FF7F49' },
  { name: 'Brown', hex: '#B5674D' },
  { name: 'Sepia', hex: '#A5694F' },
  { name: 'Copper', hex: '#DD9475' },
  { name: 'Apricot', hex: '#FDD5B1' },
  { name: 'Yellow', hex: '#FBE870' },
  { name: 'Goldenrod', hex: '#FCD667' },
  { name: 'Dandelion', hex: '#FED85D' },
  { name: 'Canary', hex: '#FFFF99' },
  { name: 'Green Yellow', hex: '#F1E788' },
  { name: 'Olive Green', hex: '#B5B35C' },
  { name: 'Spring Green', hex: '#ECEBBD' },
  { name: 'Green', hex: '#1CAC78' },
  { name: 'Forest Green', hex: '#5FA777' },
  { name: 'Sea Green', hex: '#93DFB8' },
  { name: 'Shamrock', hex: '#33CC99' },
  { name: 'Mountain Meadow', hex: '#1AB385' },
  { name: 'Jungle Green', hex: '#29AB87' },
  { name: 'Caribbean Green', hex: '#00CC99' },
  { name: 'Tropical Rain Forest', hex: '#00755E' },
  { name: 'Pine Green', hex: '#01786F' },
  { name: 'Blue Green', hex: '#0D98BA' },
  { name: 'Blue', hex: '#0066FF' },
  { name: 'Cerulean', hex: '#02A4D3' },
  { name: 'Cornflower', hex: '#93CCEA' },
  { name: 'Sky Blue', hex: '#76D7EA' },
  { name: 'Turquoise Blue', hex: '#6CDAE7' },
  { name: 'Pacific Blue', hex: '#009DC4' },
  { name: 'Navy Blue', hex: '#000080' },
  { name: 'Midnight Blue', hex: '#003366' },
  { name: 'Indigo', hex: '#4B0082' },
  { name: 'Royal Purple', hex: '#6B3FA0' },
  { name: 'Violet (Purple)', hex: '#8359A3' },
  { name: 'Wisteria', hex: '#C9A0DC' },
  { name: 'Magenta', hex: '#F653A6' },
  { name: 'Fuchsia', hex: '#C154C1' },
  { name: 'Shocking Pink', hex: '#FB7EFD' },
  { name: 'Pink Flamingo', hex: '#FC74FD' },
  { name: 'Plum', hex: '#8E3179' },
  { name: 'Hot Magenta', hex: '#FF00CC' },
  { name: 'Purple Pizzazz', hex: '#FE4EDA' },
  { name: 'Razzle Dazzle Rose', hex: '#EE34D2' },
  { name: 'Orchid', hex: '#E29CD2' },
  { name: 'Red Violet', hex: '#C74375' },
  { name: 'Eggplant', hex: '#614051' },
  { name: 'Cerise', hex: '#DA3287' },
  { name: 'Wild Strawberry', hex: '#FF3399' },
  { name: 'Salmon', hex: '#FF91A4' },
  { name: 'Carnation Pink', hex: '#FFA6C9' },
  { name: 'Tickle Me Pink', hex: '#FC80A5' },
  { name: 'Mauvelous', hex: '#F091A9' },
  { name: 'Lavender', hex: '#FBAED2' },
  { name: 'Thistle', hex: '#EBB0D7' },
  { name: 'Cotton Candy', hex: '#FFBCD9' },
  { name: 'Violet Red', hex: '#F7468A' },
  { name: 'Razzmatazz', hex: '#E30B5C' },
  { name: 'Piggy Pink', hex: '#FDD7E4' },
  { name: 'Jazzberry Jam', hex: '#A50B5E' },
  { name: 'Blush', hex: '#DE5D83' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Silver', hex: '#C9C0BB' },
  { name: 'Gray', hex: '#8B8680' },
  { name: 'Timberwolf', hex: '#D9D6CF' },
  { name: 'Black', hex: '#000000' }
];

export default function ColorPicker({ color, onChange, label, className }) {
  const [internalColor, setInternalColor] = useState(color || '#000000');
  const [mode, setMode] = useState('hex'); // hex, rgb, hsb
  const [isOpen, setIsOpen] = useState(false);
  const [crayolaOpen, setCrayolaOpen] = useState(false);
  
  const { preferences, effectiveEmail } = useTheme();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (color) setInternalColor(color);
  }, [color]);

  const handleColorChange = (newColor) => {
    setInternalColor(newColor);
    if (onChange) onChange(newColor);
  };

  const rgb = hexToRgb(internalColor) || { r: 0, g: 0, b: 0 };
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);

  const handleRgbChange = (key, value) => {
    const newRgb = { ...rgb, [key]: Math.min(255, Math.max(0, parseInt(value) || 0)) };
    handleColorChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleHsbChange = (key, value) => {
    const maxVal = key === 'h' ? 360 : 100;
    const newHsb = { ...hsb, [key]: Math.min(maxVal, Math.max(0, parseInt(value) || 0)) };
    const newRgb = hsbToRgb(newHsb.h, newHsb.s, newHsb.b);
    handleColorChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  // Saved Colors Management
  const savedColors = preferences?.saved_colors || [];
  
  const saveColorMutation = useMutation({
    mutationFn: async (newColor) => {
      if (!preferences?.id) return;
      const currentSaved = preferences.saved_colors || [];
      if (currentSaved.includes(newColor)) return; // No duplicates
      const newSaved = [newColor, ...currentSaved].slice(0, 7); // Max 7
      await base44.entities.UserPreferences.update(preferences.id, { saved_colors: newSaved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['preferences']);
    }
  });

  const removeColorMutation = useMutation({
    mutationFn: async (colorToRemove) => {
      if (!preferences?.id) return;
      const currentSaved = preferences.saved_colors || [];
      const newSaved = currentSaved.filter(c => c !== colorToRemove);
      await base44.entities.UserPreferences.update(preferences.id, { saved_colors: newSaved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['preferences']);
    }
  });

  // System picker fallback
  const triggerSystemPicker = () => {
    const picker = document.getElementById('system-color-picker-input');
    if (picker) picker.click();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger asChild>
        <button 
          className={`flex items-center gap-2 group ${className}`}
          type="button"
        >
          <div 
            className="w-8 h-8 rounded-full shadow-sm ring-2 ring-white ring-offset-1 ring-offset-gray-200 transition-transform group-hover:scale-110" 
            style={{ backgroundColor: internalColor }} 
          />
          {label && <span className="text-sm text-gray-600">{label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start" sideOffset={8}>
        
        {/* Color Wheel Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-48 h-48 rounded-full shadow-lg border-4 border-white mb-4" style={{
            background: `conic-gradient(from 90deg, red, yellow, lime, aqua, blue, magenta, red)`
          }}>
            <input 
              type="color" 
              value={internalColor} 
              onChange={(e) => handleColorChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
            />
            {/* Inner "brightness/saturation" visual approximation - just a radial gradient overlay */}
            <div className="absolute inset-0 rounded-full pointer-events-none" style={{
              background: 'radial-gradient(circle, white, transparent)'
            }}></div>
            
            {/* Selection Indicator (Approximate visual) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: internalColor }} />
            </div>
          </div>

          {/* Brightness/Alpha Slider (Visual representation using input type color's limitation) */}
          <div className="w-full h-4 rounded-full mb-2 relative overflow-hidden border border-gray-200">
             <div className="absolute inset-0" style={{ background: `linear-gradient(to right, #000000, ${internalColor}, #ffffff)` }} />
             {/* We can't easily control brightness with standard input separate from the wheel without complex canvas logic, 
                 so we rely on the wheel input or HSB inputs below for fine tuning */}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
             <div>
               <Label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
                 {mode === 'hex' ? 'Hex Code' : mode === 'rgb' ? 'RGB Values' : 'HSB Values'}
               </Label>
               {mode === 'hex' && (
                 <div className="flex items-center gap-2 border-b border-gray-300 pb-1">
                   <span className="text-gray-400">#</span>
                   <Input 
                     value={internalColor.replace('#', '')} 
                     onChange={(e) => handleColorChange(`#${e.target.value}`)}
                     className="border-none h-6 p-0 focus-visible:ring-0 font-mono uppercase w-24"
                     maxLength={6}
                   />
                   <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(internalColor)}>
                     <Copy className="w-3 h-3" />
                   </Button>
                 </div>
               )}
               {mode === 'rgb' && (
                 <div className="flex gap-2">
                   {['r', 'g', 'b'].map(k => (
                     <div key={k} className="flex flex-col items-center">
                       <Input 
                         value={rgb[k]} 
                         onChange={(e) => handleRgbChange(k, e.target.value)} 
                         className="w-12 h-8 text-center text-xs" 
                       />
                       <span className="text-[10px] text-gray-400 uppercase mt-1">{k}</span>
                     </div>
                   ))}
                 </div>
               )}
               {mode === 'hsb' && (
                 <div className="flex gap-2">
                   {['h', 's', 'b'].map(k => (
                     <div key={k} className="flex flex-col items-center">
                       <Input 
                         value={hsb[k]} 
                         onChange={(e) => handleHsbChange(k, e.target.value)} 
                         className="w-12 h-8 text-center text-xs" 
                       />
                       <span className="text-[10px] text-gray-400 uppercase mt-1">{k}</span>
                     </div>
                   ))}
                 </div>
               )}
             </div>
             
             {/* Mode Switcher */}
             <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
               {['hex', 'rgb', 'hsb'].map(m => (
                 <button
                   key={m}
                   onClick={() => setMode(m)}
                   className={`px-2 py-1 text-[10px] font-medium rounded-md uppercase transition-colors ${mode === m ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   {m}
                 </button>
               ))}
             </div>
          </div>

          {/* Crayola Dropdown */}
          <div className="pt-4 border-t border-gray-100">
            <Popover open={crayolaOpen} onOpenChange={setCrayolaOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal text-gray-600">
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: internalColor }} />
                    {CRAYOLA_COLORS.find(c => c.hex.toLowerCase() === internalColor.toLowerCase())?.name || "Choose Crayola Color..."}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <ScrollArea className="h-72">
                  <div className="p-2 space-y-1">
                    {CRAYOLA_COLORS.map(color => (
                      <button
                        key={color.name}
                        onClick={() => {
                          handleColorChange(color.hex);
                          setCrayolaOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md transition-colors text-left"
                      >
                        <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: color.hex }} />
                        <span className="text-sm text-gray-700">{color.name}</span>
                        {internalColor.toLowerCase() === color.hex.toLowerCase() && <Check className="w-4 h-4 text-purple-600 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* Favorites */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase">Saved Colors</Label>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6 hover:text-red-500" 
                onClick={() => saveColorMutation.mutate(internalColor)}
                disabled={savedColors.includes(internalColor) || savedColors.length >= 7}
                title="Save current color"
              >
                <Heart className={`w-3 h-3 ${savedColors.includes(internalColor) ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
            <div className="flex gap-2 min-h-[32px]">
              {savedColors.map((c, i) => (
                <div key={i} className="group relative">
                  <button
                    className="w-8 h-8 rounded-full border border-gray-200 shadow-sm transition-transform hover:scale-110 focus:outline-none ring-2 ring-transparent focus:ring-purple-400"
                    style={{ backgroundColor: c }}
                    onClick={() => handleColorChange(c)}
                    title={c}
                  />
                  <button 
                    className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                    onClick={(e) => { e.stopPropagation(); removeColorMutation.mutate(c); }}
                  >
                    <Trash2 className="w-2 h-2" />
                  </button>
                </div>
              ))}
              {savedColors.length === 0 && (
                <span className="text-xs text-gray-400 italic py-1">Save up to 7 colors</span>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
             {/* Hidden system input for advanced users who find it */}
             <Button variant="ghost" size="sm" onClick={triggerSystemPicker} className="h-6 px-2 text-[10px] text-gray-400 hover:text-gray-600 gap-1">
               <Pipette className="w-3 h-3" /> System Picker
             </Button>
             <input 
               id="system-color-picker-input"
               type="color" 
               value={internalColor} 
               onChange={(e) => handleColorChange(e.target.value)}
               className="absolute opacity-0 pointer-events-none w-0 h-0"
             />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}