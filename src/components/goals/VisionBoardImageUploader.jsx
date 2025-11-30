import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ImagePlus, Loader2, X } from 'lucide-react';

export default function VisionBoardImageUploader({ currentImage, onImageChange, size = 'medium' }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onImageChange(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  if (currentImage) {
    return (
      <div className={`relative ${sizeClasses[size]} rounded-xl overflow-hidden group`}>
        <img 
          src={currentImage} 
          alt="Vision" 
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => onImageChange(null)}
          className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <label className={`${sizeClasses[size]} flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all`}>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        disabled={uploading}
      />
      {uploading ? (
        <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
      ) : (
        <>
          <ImagePlus className="w-6 h-6 text-purple-400 mb-1" />
          <span className="text-xs text-purple-500">Add Vision</span>
        </>
      )}
    </label>
  );
}