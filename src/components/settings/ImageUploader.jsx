import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ImageUploader({ currentImage, onImageChange, label, aspectRatio = 'square' }) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onImageChange(file_url);
    } catch (error) {
      alert('Failed to upload image. Please try again.');
    }
    setUploading(false);
  };

  const handleRemove = () => {
    onImageChange(null);
  };

  const aspectRatioClasses = {
    square: 'aspect-square',
    banner: 'aspect-[3/1]',
    wide: 'aspect-video'
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Card>
        <CardContent className="p-4">
          {currentImage ? (
            <div className="relative">
              <img
                src={currentImage}
                alt={label}
                className={`w-full ${aspectRatioClasses[aspectRatio]} object-cover rounded-lg`}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <div className={`${aspectRatioClasses[aspectRatio]} border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-purple-400 transition-colors`}>
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload</p>
                  </>
                )}
              </div>
            </label>
          )}
        </CardContent>
      </Card>
    </div>
  );
}