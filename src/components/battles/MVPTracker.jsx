import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Upload, Loader2 } from 'lucide-react';

export default function MVPTracker({ ourMVPs = [], opponentMVPs = [], onUpdate, isLoading = false }) {
  const [mode, setMode] = useState('manual'); // 'manual' or 'upload'
  const [uploading, setUploading] = useState(false);

  const handleAddMVP = (side) => {
    const currentList = side === 'our' ? ourMVPs : opponentMVPs;
    if (currentList.length < 3) {
      const newMVP = { rank: currentList.length + 1, username: '', gifts_received: 0 };
      const updated = [...currentList, newMVP];
      onUpdate(side, updated);
    }
  };

  const handleUpdateMVP = (side, index, field, value) => {
    const currentList = side === 'our' ? ourMVPs : opponentMVPs;
    const updated = currentList.map((mvp, i) =>
      i === index ? { ...mvp, [field]: field === 'gifts_received' ? parseInt(value) || 0 : value } : mvp
    );
    onUpdate(side, updated);
  };

  const handleRemoveMVP = (side, index) => {
    const currentList = side === 'our' ? ourMVPs : opponentMVPs;
    const updated = currentList.filter((_, i) => i !== index);
    onUpdate(side, updated);
  };

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await base44.functions.invoke('analyzeBattleScreenshot', { file });
      onUpdate('our', res.data.our_mvps);
      onUpdate('opponent', res.data.opponent_mvps);
      setMode('manual');
    } catch (err) {
      console.error('Screenshot upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b pb-3">
        <Button
          size="sm"
          variant={mode === 'manual' ? 'default' : 'outline'}
          onClick={() => setMode('manual')}
        >
          Manual Entry
        </Button>
        <Button
          size="sm"
          variant={mode === 'upload' ? 'default' : 'outline'}
          onClick={() => setMode('upload')}
        >
          <Upload className="w-4 h-4 mr-2" /> Upload Screenshot
        </Button>
      </div>

      {mode === 'upload' ? (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleScreenshotUpload}
              disabled={uploading}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-600">Analyzing screenshot...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">Click to upload battle screenshot</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                </>
              )}
            </div>
          </label>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Our Side */}
          <div className="space-y-3">
            <h4 className="font-semibold text-blue-600 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold">👑</span>
              Our MVPs
            </h4>
            <div className="space-y-2">
              {ourMVPs.map((mvp, idx) => (
                <Card key={idx} className="p-3">
                  <div className="flex items-end gap-2">
                    <Badge variant="outline" className="font-bold">{mvp.rank}</Badge>
                    <Input
                      placeholder="Username"
                      value={mvp.username}
                      onChange={(e) => handleUpdateMVP('our', idx, 'username', e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Gifts"
                      value={mvp.gifts_received}
                      onChange={(e) => handleUpdateMVP('our', idx, 'gifts_received', e.target.value)}
                      className="text-sm w-24"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveMVP('our', idx)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
              {ourMVPs.length < 3 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddMVP('our')}
                  className="w-full text-xs"
                >
                  + Add MVP
                </Button>
              )}
            </div>
          </div>

          {/* Opponent Side */}
          <div className="space-y-3">
            <h4 className="font-semibold text-red-600 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-sm font-bold">👑</span>
              Opponent MVPs
            </h4>
            <div className="space-y-2">
              {opponentMVPs.map((mvp, idx) => (
                <Card key={idx} className="p-3">
                  <div className="flex items-end gap-2">
                    <Badge variant="outline" className="font-bold">{mvp.rank}</Badge>
                    <Input
                      placeholder="Username"
                      value={mvp.username}
                      onChange={(e) => handleUpdateMVP('opponent', idx, 'username', e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Gifts"
                      value={mvp.gifts_received}
                      onChange={(e) => handleUpdateMVP('opponent', idx, 'gifts_received', e.target.value)}
                      className="text-sm w-24"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveMVP('opponent', idx)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
              {opponentMVPs.length < 3 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddMVP('opponent')}
                  className="w-full text-xs"
                >
                  + Add MVP
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}