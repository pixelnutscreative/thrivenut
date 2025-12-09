import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Building2, Phone, Mail, Globe, Pencil, Check, X, Instagram, Facebook, Linkedin, Twitter, Youtube } from 'lucide-react';
import NotesWithHistory from './NotesWithHistory';

export default function BusinessCard({ business, onUpdate, onDelete, hidePrivateInfo }) {
  const [isEditing, setIsEditing] = useState(!business.business_name);
  const [editData, setEditData] = useState(business);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (!business.business_name) {
      onDelete();
    } else {
      setEditData(business);
      setIsEditing(false);
    }
  };

  const handleAddNote = (note) => {
    const updatedNotes = [...(editData.business_notes || []), note];
    const updated = { ...editData, business_notes: updatedNotes };
    setEditData(updated);
    onUpdate(updated);
  };

  if (isEditing) {
    return (
      <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-700">
              <Building2 className="w-4 h-4" />
              <span className="font-medium text-sm">Business Details</span>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Business Name</Label>
            <Input
              placeholder="Company name"
              value={editData.business_name || ''}
              onChange={(e) => setEditData({ ...editData, business_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input
                type={hidePrivateInfo ? "password" : "text"}
                placeholder="Business phone"
                value={editData.business_phone || ''}
                onChange={(e) => setEditData({ ...editData, business_phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type={hidePrivateInfo ? "password" : "email"}
                placeholder="Business email"
                value={editData.business_email || ''}
                onChange={(e) => setEditData({ ...editData, business_email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Website</Label>
            <Input
              placeholder="https://..."
              value={editData.business_website || ''}
              onChange={(e) => setEditData({ ...editData, business_website: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Business Social Media</Label>
            <div className="grid grid-cols-2 gap-2">
              {['instagram', 'facebook', 'linkedin', 'twitter', 'youtube', 'tiktok'].map(platform => (
                <Input
                  key={platform}
                  placeholder={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  value={editData.social_links?.[platform] || ''}
                  onChange={(e) => setEditData({ ...editData, social_links: { ...editData.social_links, [platform]: e.target.value } })}
                  className="h-7 text-xs"
                />
              ))}
            </div>
          </div>

          <NotesWithHistory
            notes={editData.business_notes || []}
            onAddNote={handleAddNote}
            label="Business Notes"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span className="font-semibold">{business.business_name}</span>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              {business.business_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  {hidePrivateInfo ? (
                    <span className="text-gray-400">••••••••••</span>
                  ) : (
                    <a href={`tel:${business.business_phone}`} className="hover:text-purple-600">
                      {business.business_phone}
                    </a>
                  )}
                </div>
              )}
              {business.business_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {hidePrivateInfo ? (
                    <span className="text-gray-400">••••••••••</span>
                  ) : (
                    <a href={`mailto:${business.business_email}`} className="hover:text-purple-600">
                      {business.business_email}
                    </a>
                  )}
                </div>
              )}
              {business.business_website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  <a href={business.business_website} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">
                    {business.business_website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {business.social_links && Object.entries(business.social_links).filter(([_, v]) => v).length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {business.social_links.instagram && <a href={`https://instagram.com/${business.social_links.instagram}`} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600"><Instagram className="w-4 h-4" /></a>}
                  {business.social_links.facebook && <a href={`https://facebook.com/${business.social_links.facebook}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700"><Facebook className="w-4 h-4" /></a>}
                  {business.social_links.linkedin && <a href={`https://linkedin.com/in/${business.social_links.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600"><Linkedin className="w-4 h-4" /></a>}
                  {business.social_links.twitter && <a href={`https://twitter.com/${business.social_links.twitter}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-700"><Twitter className="w-4 h-4" /></a>}
                  {business.social_links.youtube && <a href={`https://youtube.com/@${business.social_links.youtube}`} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-600"><Youtube className="w-4 h-4" /></a>}
                  {business.social_links.tiktok && <a href={`https://tiktok.com/@${business.social_links.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-black">TT</a>}
                </div>
              )}
            </div>

            {(business.business_notes?.length > 0) && (
              <div className="pt-2">
                <NotesWithHistory
                  notes={business.business_notes}
                  onAddNote={handleAddNote}
                  label="Notes"
                />
              </div>
            )}
          </div>

          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
              <Pencil className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}