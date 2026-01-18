import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Upload, Image as ImageIcon, Trash2, Plus, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function BattlePosterManager({ battleId, battleOpponent, existingPosters = [], onPostersUpdate }) {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [requestForm, setRequestForm] = useState({
    theme: 'epic',
    description: '',
    includeProfilePics: false,
    animationWanted: 'send_animated',
    additionalNotes: ''
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    }
  });

  const requestMutation = useMutation({
    mutationFn: (data) => {
      return base44.entities.ContentRequest.create({
        ...data,
        battle_id: battleId,
        opponent_name: battleOpponent,
        request_type: 'battle_poster',
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battlePosters', battleId] });
      setRequestForm({
        theme: 'epic',
        description: '',
        includeProfilePics: false,
        animationWanted: 'send_animated',
        additionalNotes: ''
      });
      setShowRequest(false);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    uploadMutation.mutate(file, {
      onSuccess: (url) => {
        setUploadedFiles([...uploadedFiles, { url, name: file.name }]);
      }
    });
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmitRequest = () => {
    if (!requestForm.description.trim()) {
      alert('Please describe what you want in your battle poster');
      return;
    }
    requestMutation.mutate(requestForm);
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div>
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-600" />
          Battle Poster & Video
        </h3>
        <p className="text-sm text-slate-600 mb-4">Upload your battle poster/video or request one</p>
      </div>

      {/* Uploaded Posters */}
      {existingPosters.length > 0 && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Posters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {existingPosters.map((poster, idx) => (
                <div key={idx} className="relative group">
                  <img src={poster.url} alt={`Poster ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                    onClick={() => onPostersUpdate(existingPosters.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upload Poster/Video</CardTitle>
          <CardDescription>Support multiple images (background, overlay, etc)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="relative bg-gray-100 rounded p-2 text-xs text-center">
                  <p className="truncate">{file.name}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-1 h-6 w-full text-red-500"
                    onClick={() => handleRemoveFile(idx)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
            <label className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">Click to upload images</p>
                <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
              </div>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={uploadMutation.isPending}
                className="hidden"
              />
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <Button className="w-full bg-purple-600 hover:bg-purple-700 gap-2">
              <Plus className="w-4 h-4" />
              Save These Posters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Request Section */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-xl">🎨</span> Request Custom Battle Poster
          </CardTitle>
          <CardDescription>Have Pixel create a custom poster for you</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setShowRequest(true)}
            variant="outline"
            className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Poster Request
          </Button>
        </CardContent>
      </Card>

      {/* Request Form Dialog */}
      <Dialog open={showRequest} onOpenChange={setShowRequest}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Custom Battle Poster</DialogTitle>
            <DialogDescription>Tell me what you want and I'll create it for you</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Theme */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Battle Theme</label>
              <Select value={requestForm.theme} onValueChange={(v) => setRequestForm({...requestForm, theme: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="epic">⚔️ Epic/Fantasy</SelectItem>
                  <SelectItem value="neon">💜 Neon/Cyberpunk</SelectItem>
                  <SelectItem value="retro">🕹️ Retro/Arcade</SelectItem>
                  <SelectItem value="minimalist">⚪ Minimalist</SelectItem>
                  <SelectItem value="hologram">🌀 Hologram</SelectItem>
                  <SelectItem value="custom">✨ Custom (describe below)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Design Ideas & Description *</label>
              <Textarea
                placeholder="E.g., Dark colors with gold accents, warrior theme, include our usernames..."
                value={requestForm.description}
                onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                rows={3}
              />
            </div>

            {/* Profile Pics */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Include Profile Pictures?</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={requestForm.includeProfilePics}
                    onChange={() => setRequestForm({...requestForm, includeProfilePics: true})}
                  />
                  <span className="text-sm">Yes, add our TikTok profiles</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!requestForm.includeProfilePics}
                    onChange={() => setRequestForm({...requestForm, includeProfilePics: false})}
                  />
                  <span className="text-sm">No, just design</span>
                </label>
              </div>
            </div>

            {/* Animation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">How to deliver?</label>
              <Select value={requestForm.animationWanted} onValueChange={(v) => setRequestForm({...requestForm, animationWanted: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send_animated">✉️ Send me animated (ready to use)</SelectItem>
                  <SelectItem value="static">📷 Static image only</SelectItem>
                  <SelectItem value="ai_animate">🤖 Send me AI files to animate yourself</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes</label>
              <Textarea
                placeholder="Anything else? Colors, fonts, mood..."
                value={requestForm.additionalNotes}
                onChange={(e) => setRequestForm({...requestForm, additionalNotes: e.target.value})}
                rows={2}
              />
            </div>

            <Button
              onClick={handleSubmitRequest}
              disabled={requestMutation.isPending}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {requestMutation.isPending ? 'Submitting...' : '📤 Submit Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}