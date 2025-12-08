import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Eraser, Download, Trash2, Undo, Smile, Circle, Square, Heart, Star, User } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

export default function PictionaryHelper() {
  const { isDark, bgClass, primaryColor, textClass, cardBgClass } = useTheme();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState('pen');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory([...history, canvas.toDataURL()]);
    }
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = color;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const undo = () => {
    if (history.length <= 1) return;
    
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = newHistory[newHistory.length - 1];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `pictionary-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const drawShape = (shape) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = 80;

    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.fillStyle = color + '40'; // 25% opacity

    switch (shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'square':
        ctx.fillRect(centerX - size, centerY - size, size * 2, size * 2);
        ctx.strokeRect(centerX - size, centerY - size, size * 2, size * 2);
        break;
      case 'heart':
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + size / 4);
        ctx.bezierCurveTo(centerX, centerY, centerX - size / 2, centerY - size / 2, centerX, centerY - size);
        ctx.bezierCurveTo(centerX + size / 2, centerY - size / 2, centerX, centerY, centerX, centerY + size / 4);
        ctx.fill();
        ctx.stroke();
        break;
      case 'star':
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size / 2;
        let rot = Math.PI / 2 * 3;
        let x = centerX;
        let y = centerY;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY - outerRadius);
        for (let i = 0; i < spikes; i++) {
          x = centerX + Math.cos(rot) * outerRadius;
          y = centerY + Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;

          x = centerX + Math.cos(rot) * innerRadius;
          y = centerY + Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(centerX, centerY - outerRadius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case 'stick':
        // Stick figure
        const headRadius = 20;
        const bodyLength = 60;
        const armLength = 40;
        const legLength = 50;
        
        // Head
        ctx.beginPath();
        ctx.arc(centerX, centerY - bodyLength, headRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Body
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - bodyLength + headRadius);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
        
        // Arms
        ctx.beginPath();
        ctx.moveTo(centerX - armLength, centerY - bodyLength / 2);
        ctx.lineTo(centerX, centerY - bodyLength / 2);
        ctx.lineTo(centerX + armLength, centerY - bodyLength / 2);
        ctx.stroke();
        
        // Legs
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - armLength / 2, centerY + legLength);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + armLength / 2, centerY + legLength);
        ctx.stroke();
        break;
    }
    saveState();
  };

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
    '#800080', '#FFC0CB', '#A52A2A', '#808080'
  ];

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className={`text-3xl font-bold ${textClass}`}>Pictionary Helper</h1>
          <p className="text-gray-500 mt-1">Draw simple shapes and stick figures for charades!</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Tools Panel */}
          <Card className={cardBgClass}>
            <CardHeader>
              <CardTitle className="text-base">Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Draw Tool</label>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant={tool === 'pen' ? 'default' : 'outline'}
                    onClick={() => setTool('pen')}
                    style={tool === 'pen' ? { backgroundColor: primaryColor } : {}}
                  >
                    <Palette className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={tool === 'eraser' ? 'default' : 'outline'}
                    onClick={() => setTool('eraser')}
                  >
                    <Eraser className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Brush Size: {brushSize}px</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {colors.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-lg border-2 ${color === c ? 'ring-2 ring-offset-2' : ''}`}
                      style={{ backgroundColor: c, borderColor: color === c ? primaryColor : '#ccc' }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Shapes</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" variant="outline" onClick={() => drawShape('circle')}>
                    <Circle className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => drawShape('square')}>
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => drawShape('heart')}>
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => drawShape('star')}>
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => drawShape('stick')} className="col-span-2">
                    <User className="w-4 h-4 mr-1" />
                    Stick Figure
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Button size="sm" variant="outline" className="w-full" onClick={undo}>
                  <Undo className="w-4 h-4 mr-2" />
                  Undo
                </Button>
                <Button size="sm" variant="outline" className="w-full" onClick={clearCanvas}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button size="sm" className="w-full" onClick={downloadDrawing} style={{ backgroundColor: primaryColor }}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Canvas */}
          <div className="lg:col-span-3">
            <Card className={cardBgClass}>
              <CardContent className="pt-6">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="border-2 rounded-lg cursor-crosshair w-full"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}