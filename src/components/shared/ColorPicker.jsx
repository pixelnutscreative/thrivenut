import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pipette } from 'lucide-react';

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

const rgbToCmyk = (r, g, b) => {
  let c = 1 - (r / 255);
  let m = 1 - (g / 255);
  let y = 1 - (b / 255);
  let k = Math.min(c, Math.min(m, y));
  
  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);
  
  return {
    c: isNaN(c) ? 0 : Math.round(c * 100),
    m: isNaN(m) ? 0 : Math.round(m * 100),
    y: isNaN(y) ? 0 : Math.round(y * 100),
    k: isNaN(k) ? 0 : Math.round(k * 100)
  };
};

const cmykToRgb = (c, m, y, k) => {
  c = c / 100;
  m = m / 100;
  y = y / 100;
  k = k / 100;
  
  const r = 1 - Math.min(1, c * (1 - k) + k);
  const g = 1 - Math.min(1, m * (1 - k) + k);
  const b = 1 - Math.min(1, y * (1 - k) + k);
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

// --- Presets ---
const CRAYON_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F43F5E', '#FB7185', '#FDA4AF', '#FECDD3', '#FFE4E6', '#F1F5F9', '#94A3B8', '#64748B',
  '#475569', '#334155', '#1E293B', '#0F172A', '#000000', '#FFFFFF'
];

export default function ColorPicker({ color, onChange, label, className }) {
  const [internalColor, setInternalColor] = useState(color || '#000000');
  const [mode, setMode] = useState('hex'); // hex, rgb, cmyk
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (color) setInternalColor(color);
  }, [color]);

  const handleColorChange = (newColor) => {
    setInternalColor(newColor);
    if (onChange) onChange(newColor);
  };

  const rgb = hexToRgb(internalColor) || { r: 0, g: 0, b: 0 };
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  const handleRgbChange = (key, value) => {
    const newRgb = { ...rgb, [key]: parseInt(value) || 0 };
    handleColorChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleCmykChange = (key, value) => {
    const newCmyk = { ...cmyk, [key]: parseInt(value) || 0 };
    const newRgb = cmykToRgb(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
    handleColorChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  // Function to trigger system picker
  const triggerSystemPicker = () => {
    const picker = document.getElementById('system-color-picker-input');
    if (picker) picker.click();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
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
      <PopoverContent className="w-72 p-3" align="start">
        <div className="flex justify-end mb-2">
           <Button variant="ghost" size="sm" onClick={triggerSystemPicker} className="h-6 px-2 text-[10px] text-gray-500 hover:text-gray-900 gap-1">
             <Pipette className="w-3 h-3" /> System Picker
           </Button>
           {/* Hidden system input */}
           <input 
             id="system-color-picker-input"
             type="color" 
             value={internalColor} 
             onChange={(e) => handleColorChange(e.target.value)}
             className="absolute opacity-0 pointer-events-none w-0 h-0"
           />
        </div>

        <Tabs defaultValue="wheel" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="wheel">Wheel</TabsTrigger>
            <TabsTrigger value="crayons">Crayons</TabsTrigger>
          </TabsList>

          <TabsContent value="wheel" className="space-y-4">
            {/* Color Wheel Implementation */}
            <div className="relative w-full aspect-square rounded-full overflow-hidden shadow-inner border border-gray-200" style={{
              background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`
            }}>
              <input 
                type="color" 
                value={internalColor} 
                onChange={(e) => handleColorChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                 <div className="w-1/2 h-1/2 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-full h-full rounded-full" style={{ backgroundColor: internalColor }} />
                 </div>
              </div>
            </div>

            {/* Brightness Slider */}
            <div className="space-y-1">
               <div className="h-3 rounded-full w-full" style={{ background: `linear-gradient(to right, white, ${internalColor}, black)` }}></div>
            </div>

            {/* Inputs */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex gap-1 mb-2">
                <Button size="xs" variant={mode === 'hex' ? 'secondary' : 'ghost'} onClick={() => setMode('hex')} className="flex-1 h-6 text-[10px]">HEX</Button>
                <Button size="xs" variant={mode === 'rgb' ? 'secondary' : 'ghost'} onClick={() => setMode('rgb')} className="flex-1 h-6 text-[10px]">RGB</Button>
                <Button size="xs" variant={mode === 'cmyk' ? 'secondary' : 'ghost'} onClick={() => setMode('cmyk')} className="flex-1 h-6 text-[10px]">CMYK</Button>
              </div>

              {mode === 'hex' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-500">#</span>
                  <Input 
                    value={internalColor.replace('#', '')} 
                    onChange={(e) => handleColorChange(`#${e.target.value}`)}
                    className="font-mono uppercase"
                    maxLength={6}
                  />
                </div>
              )}

              {mode === 'rgb' && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-500">R</Label>
                    <Input value={rgb.r} onChange={(e) => handleRgbChange('r', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-500">G</Label>
                    <Input value={rgb.g} onChange={(e) => handleRgbChange('g', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-500">B</Label>
                    <Input value={rgb.b} onChange={(e) => handleRgbChange('b', e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
              )}

              {mode === 'cmyk' && (
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-cyan-500">C</Label>
                    <Input value={cmyk.c} onChange={(e) => handleCmykChange('c', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-pink-500">M</Label>
                    <Input value={cmyk.m} onChange={(e) => handleCmykChange('m', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-yellow-500">Y</Label>
                    <Input value={cmyk.y} onChange={(e) => handleCmykChange('y', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-black">K</Label>
                    <Input value={cmyk.k} onChange={(e) => handleCmykChange('k', e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="crayons">
            <div className="grid grid-cols-5 gap-3 p-2 bg-gray-50 rounded-lg">
              {CRAYON_COLORS.map(c => (
                <div key={c} className="flex flex-col items-center">
                  <button
                    className={`w-4 h-12 rounded-full shadow-sm transition-transform hover:scale-110 focus:outline-none ${internalColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-purple-500 ring-offset-1 scale-110' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => handleColorChange(c)}
                    title={c}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}