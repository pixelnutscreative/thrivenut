import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pipette, Copy, Heart, Plus, Trash2, ChevronDown, Check, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTheme } from './useTheme';

// --- Color Utility Functions ---

const hexToHsb = (hex) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  
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

const hsbToHex = (h, s, b) => {
  s /= 100; b /= 100;
  const k = (n) => (n + h / 60) % 6;
  const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
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

const CRAYOLA_COLORS = [
  { name: 'Red', hex: '#ED0A3F' }, { name: 'Maroon', hex: '#C32148' }, { name: 'Scarlet', hex: '#FD0E35' },
  { name: 'Brick Red', hex: '#C62D42' }, { name: 'English Vermilion', hex: '#CC474B' }, { name: 'Madder Lake', hex: '#CC3336' },
  { name: 'Permanent Geranium Lake', hex: '#E12C2C' }, { name: 'Maximum Red', hex: '#D92121' }, { name: 'Chestnut', hex: '#BC5D58' },
  { name: 'Orange', hex: '#FF8833' }, { name: 'Yellow Orange', hex: '#FFAB59' }, { name: 'Melon', hex: '#FEBAAD' },
  { name: 'Atomic Tangerine', hex: '#FF9966' }, { name: 'Vivid Tangerine', hex: '#FF9980' }, { name: 'Burnt Orange', hex: '#FF7F49' },
  { name: 'Brown', hex: '#B5674D' }, { name: 'Sepia', hex: '#A5694F' }, { name: 'Copper', hex: '#DD9475' },
  { name: 'Apricot', hex: '#FDD5B1' }, { name: 'Yellow', hex: '#FBE870' }, { name: 'Goldenrod', hex: '#FCD667' },
  { name: 'Dandelion', hex: '#FED85D' }, { name: 'Canary', hex: '#FFFF99' }, { name: 'Green Yellow', hex: '#F1E788' },
  { name: 'Olive Green', hex: '#B5B35C' }, { name: 'Spring Green', hex: '#ECEBBD' }, { name: 'Green', hex: '#1CAC78' },
  { name: 'Forest Green', hex: '#5FA777' }, { name: 'Sea Green', hex: '#93DFB8' }, { name: 'Shamrock', hex: '#33CC99' },
  { name: 'Mountain Meadow', hex: '#1AB385' }, { name: 'Jungle Green', hex: '#29AB87' }, { name: 'Caribbean Green', hex: '#00CC99' },
  { name: 'Tropical Rain Forest', hex: '#00755E' }, { name: 'Pine Green', hex: '#01786F' }, { name: 'Blue Green', hex: '#0D98BA' },
  { name: 'Blue', hex: '#0066FF' }, { name: 'Cerulean', hex: '#02A4D3' }, { name: 'Cornflower', hex: '#93CCEA' },
  { name: 'Sky Blue', hex: '#76D7EA' }, { name: 'Turquoise Blue', hex: '#6CDAE7' }, { name: 'Pacific Blue', hex: '#009DC4' },
  { name: 'Navy Blue', hex: '#000080' }, { name: 'Midnight Blue', hex: '#003366' }, { name: 'Indigo', hex: '#4B0082' },
  { name: 'Royal Purple', hex: '#6B3FA0' }, { name: 'Violet (Purple)', hex: '#8359A3' }, { name: 'Wisteria', hex: '#C9A0DC' },
  { name: 'Magenta', hex: '#F653A6' }, { name: 'Fuchsia', hex: '#C154C1' }, { name: 'Shocking Pink', hex: '#FB7EFD' },
  { name: 'Pink Flamingo', hex: '#FC74FD' }, { name: 'Plum', hex: '#8E3179' }, { name: 'Hot Magenta', hex: '#FF00CC' },
  { name: 'Purple Pizzazz', hex: '#FE4EDA' }, { name: 'Razzle Dazzle Rose', hex: '#EE34D2' }, { name: 'Orchid', hex: '#E29CD2' },
  { name: 'Red Violet', hex: '#C74375' }, { name: 'Eggplant', hex: '#614051' }, { name: 'Cerise', hex: '#DA3287' },
  { name: 'Wild Strawberry', hex: '#FF3399' }, { name: 'Salmon', hex: '#FF91A4' }, { name: 'Carnation Pink', hex: '#FFA6C9' },
  { name: 'Tickle Me Pink', hex: '#FC80A5' }, { name: 'Mauvelous', hex: '#F091A9' }, { name: 'Lavender', hex: '#FBAED2' },
  { name: 'Thistle', hex: '#EBB0D7' }, { name: 'Cotton Candy', hex: '#FFBCD9' }, { name: 'Violet Red', hex: '#F7468A' },
  { name: 'Razzmatazz', hex: '#E30B5C' }, { name: 'Piggy Pink', hex: '#FDD7E4' }, { name: 'Jazzberry Jam', hex: '#A50B5E' },
  { name: 'Blush', hex: '#DE5D83' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Silver', hex: '#C9C0BB' },
  { name: 'Gray', hex: '#8B8680' }, { name: 'Timberwolf', hex: '#D9D6CF' }, { name: 'Black', hex: '#000000' }
];

export default function ColorPicker({ color, onChange, label, className }) {
  const [internalColor, setInternalColor] = useState(color || '#000000');
  const [hsb, setHsb] = useState({ h: 0, s: 0, b: 0 });
  const [mode, setMode] = useState('hex');
  const [isOpen, setIsOpen] = useState(false);
  const [crayolaOpen, setCrayolaOpen] = useState(false);
  const [crayolaSearch, setCrayolaSearch] = useState('');
  const [isDraggingWheel, setIsDraggingWheel] = useState(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  
  const wheelRef = useRef(null);
  const sliderRef = useRef(null);
  
  const { preferences } = useTheme();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (color) {
      setInternalColor(color);
      setHsb(hexToHsb(color));
    }
  }, [color]);

  const updateColorFromHsb = (newHsb) => {
    const newHex = hsbToHex(newHsb.h, newHsb.s, newHsb.b);
    setInternalColor(newHex);
    setHsb(newHsb);
    if (onChange) onChange(newHex);
  };

  // --- Wheel Interaction ---
  const handleWheelMove = useCallback((e) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    
    // Angle determines Hue
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    
    // Distance determines Saturation
    const dist = Math.sqrt(x*x + y*y);
    const radius = rect.width / 2;
    const saturation = Math.min(100, Math.max(0, (dist / radius) * 100));
    
    // Adjust angle to match CSS conic-gradient (Red at top)
    // Math.atan2: 0 is Right, -90 is Top.
    // CSS Conic: 0 is Top.
    // We want -90 -> 0, 0 -> 90, 90 -> 180, 180 -> 270.
    let hue = angle + 90;
    if (hue < 0) hue += 360;
    if (hue >= 360) hue -= 360;

    updateColorFromHsb({ ...hsb, h: Math.round(hue), s: Math.round(saturation) });
  }, [hsb]);

  // --- Slider Interaction ---
  const handleSliderMove = useCallback((e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    // Slider determines Brightness (0 = Black, 100 = Full Color)
    updateColorFromHsb({ ...hsb, b: Math.round(x * 100) });
  }, [hsb]);

  // --- Event Listeners for Dragging ---
  useEffect(() => {
    const handleUp = () => {
      setIsDraggingWheel(false);
      setIsDraggingSlider(false);
    };
    
    const handleMove = (e) => {
      if (isDraggingWheel) handleWheelMove(e);
      if (isDraggingSlider) handleSliderMove(e);
    };

    if (isDraggingWheel || isDraggingSlider) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDraggingWheel, isDraggingSlider, handleWheelMove, handleSliderMove]);

  // --- EyeDropper API ---
  const handleEyeDropper = async () => {
    if (!window.EyeDropper) {
      alert("Your browser doesn't support the EyeDropper API.");
      return;
    }
    
    const eyeDropper = new EyeDropper();
    try {
      const result = await eyeDropper.open();
      setInternalColor(result.sRGBHex);
      setHsb(hexToHsb(result.sRGBHex));
      if (onChange) onChange(result.sRGBHex);
    } catch (e) {
      // User cancelled
    }
  };

  // Saved Colors
  const savedColors = preferences?.saved_colors || [];
  
  const saveColorMutation = useMutation({
    mutationFn: async (newColor) => {
      if (!preferences?.id) return;
      const currentSaved = preferences.saved_colors || [];
      if (currentSaved.includes(newColor)) return;
      const newSaved = [newColor, ...currentSaved].slice(0, 7);
      await base44.entities.UserPreferences.update(preferences.id, { saved_colors: newSaved });
    },
    onSuccess: () => queryClient.invalidateQueries(['preferences'])
  });

  const removeColorMutation = useMutation({
    mutationFn: async (colorToRemove) => {
      if (!preferences?.id) return;
      const newSaved = (preferences.saved_colors || []).filter(c => c !== colorToRemove);
      await base44.entities.UserPreferences.update(preferences.id, { saved_colors: newSaved });
    },
    onSuccess: () => queryClient.invalidateQueries(['preferences'])
  });

  // Calculate indicator position on wheel
  // Reverse the +90 degree shift for display
  const displayAngle = hsb.h - 90;
  const angleRad = displayAngle * (Math.PI / 180);
  const radiusPercent = hsb.s / 100;
  const indicatorX = 50 + (Math.cos(angleRad) * radiusPercent * 50);
  const indicatorY = 50 + (Math.sin(angleRad) * radiusPercent * 50);

  // Hex helpers
  const handleHexChange = (e) => {
    const val = e.target.value;
    if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
      if (val.length === 6) {
        const hex = `#${val}`;
        setInternalColor(hex);
        setHsb(hexToHsb(hex));
        if (onChange) onChange(hex);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className={`flex items-center gap-2 group ${className}`} type="button">
          <div 
            className="w-8 h-8 rounded-full shadow-sm ring-2 ring-white ring-offset-1 ring-offset-gray-200 transition-transform group-hover:scale-110" 
            style={{ backgroundColor: internalColor }} 
          />
          {label && <span className="text-sm text-gray-600">{label}</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="w-80 sm:max-w-[360px] p-4" hideCloseButton={false}>
        <div className="flex items-center justify-between mb-2">
          <DialogTitle className="text-base font-semibold">Pick a Color</DialogTitle>
          <Button variant="ghost" size="sm" onClick={handleEyeDropper} className="h-7 px-2 text-xs gap-1">
            <Pipette className="w-3 h-3" /> Pick
          </Button>
        </div>

        {/* Custom Interactive Color Wheel */}
        <div className="flex justify-center mb-5">
          <div 
            ref={wheelRef}
            className="relative w-48 h-48 rounded-full shadow-md cursor-crosshair touch-none"
            style={{
              background: `
                radial-gradient(circle, white, transparent 100%),
                conic-gradient(red, yellow, lime, aqua, blue, magenta, red)
              `
            }}
            onMouseDown={(e) => { setIsDraggingWheel(true); handleWheelMove(e); }}
            onTouchStart={(e) => { setIsDraggingWheel(true); handleWheelMove(e); }}
          >
            {/* Thumb */}
            <div 
              className="absolute w-6 h-6 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{
                left: `${indicatorX}%`,
                top: `${indicatorY}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: internalColor
              }}
            />
          </div>
        </div>

        {/* Brightness Slider (Dark to Light) */}
        <div className="space-y-1.5 mb-5">
          <div className="flex justify-between text-[10px] text-gray-400 uppercase font-medium tracking-wider">
            <span>Dark</span>
            <span>Brightness</span>
            <span>Light</span>
          </div>
          <div 
            ref={sliderRef}
            className="h-6 rounded-full w-full relative cursor-pointer border border-gray-200 overflow-hidden touch-none shadow-inner"
            style={{ 
              background: `linear-gradient(to right, #000000, ${hsbToHex(hsb.h, hsb.s, 100)})` 
            }}
            onMouseDown={(e) => { setIsDraggingSlider(true); handleSliderMove(e); }}
            onTouchStart={(e) => { setIsDraggingSlider(true); handleSliderMove(e); }}
          >
            <div 
              className="absolute top-0 bottom-0 w-2 bg-white border-x border-gray-300 shadow-sm pointer-events-none"
              style={{ left: `${hsb.b}%`, transform: 'translateX(-50%)' }}
            />
          </div>
        </div>

        {/* Values Input */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex gap-1 mb-2">
            <Button size="xs" variant={mode === 'hex' ? 'secondary' : 'ghost'} onClick={() => setMode('hex')} className="flex-1 h-6 text-[10px]">HEX</Button>
            <Button size="xs" variant={mode === 'rgb' ? 'secondary' : 'ghost'} onClick={() => setMode('rgb')} className="flex-1 h-6 text-[10px]">RGB</Button>
            <Button size="xs" variant={mode === 'hsb' ? 'secondary' : 'ghost'} onClick={() => setMode('hsb')} className="flex-1 h-6 text-[10px]">HSB</Button>
          </div>

          {mode === 'hex' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500">#</span>
              <Input 
                defaultValue={internalColor.replace('#', '')} 
                onBlur={handleHexChange}
                className="font-mono uppercase h-8"
                maxLength={6}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigator.clipboard.writeText(internalColor)}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          )}

          {mode === 'rgb' && (() => {
            const rgb = hsbToRgb(hsb.h, hsb.s, hsb.b);
            return (
              <div className="grid grid-cols-3 gap-2">
                {['r', 'g', 'b'].map(k => (
                  <div key={k} className="flex flex-col items-center">
                    <div className="text-[10px] text-gray-400 uppercase mb-1">{k}</div>
                    <div className="w-full h-8 flex items-center justify-center bg-gray-50 rounded border border-gray-200 text-xs font-mono">
                      {rgb[k]}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {mode === 'hsb' && (
            <div className="grid grid-cols-3 gap-2">
              {['h', 's', 'b'].map(k => (
                <div key={k} className="flex flex-col items-center">
                  <div className="text-[10px] text-gray-400 uppercase mb-1">{k}</div>
                  <div className="w-full h-8 flex items-center justify-center bg-gray-50 rounded border border-gray-200 text-xs font-mono">
                    {hsb[k]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crayola Dropdown (Simplified) */}
        <div className="pt-4 border-t border-gray-100 mt-2">
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
            <PopoverContent className="w-64 p-0 z-[9999]" align="start">
              <div className="p-2 border-b sticky top-0 bg-white z-10">
                <Input 
                  placeholder="Search colors..." 
                  value={crayolaSearch}
                  onChange={(e) => setCrayolaSearch(e.target.value)}
                  className="h-8 text-xs"
                  autoFocus
                />
              </div>
              <ScrollArea className="h-72">
                <div className="p-2 space-y-1">
                  {CRAYOLA_COLORS.filter(c => c.name.toLowerCase().includes(crayolaSearch.toLowerCase())).map(color => (
                    <button
                      key={color.name}
                      onClick={() => {
                        setInternalColor(color.hex);
                        setHsb(hexToHsb(color.hex));
                        if(onChange) onChange(color.hex);
                        setCrayolaOpen(false);
                        setCrayolaSearch('');
                      }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md transition-colors text-left"
                    >
                      <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm shrink-0" style={{ backgroundColor: color.hex }} />
                      <span className="text-sm text-gray-700 truncate">{color.name}</span>
                      {internalColor.toLowerCase() === color.hex.toLowerCase() && <Check className="w-4 h-4 text-purple-600 ml-auto shrink-0" />}
                    </button>
                  ))}
                  {CRAYOLA_COLORS.filter(c => c.name.toLowerCase().includes(crayolaSearch.toLowerCase())).length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">No colors found</div>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        {/* Favorites Section */}
        <div className="pt-4 border-t border-gray-100 mt-4">
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
                  onClick={() => {
                    setInternalColor(c);
                    setHsb(hexToHsb(c));
                    if(onChange) onChange(c);
                  }}
                  title={c}
                />
                <button 
                  className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                  onClick={(e) => { e.stopPropagation(); removeColorMutation.mutate(c); }}
                >
                  <X className="w-2 h-2" />
                </button>
              </div>
            ))}
            {savedColors.length === 0 && (
              <span className="text-xs text-gray-400 italic py-1">Save up to 7 colors</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}