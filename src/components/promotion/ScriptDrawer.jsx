import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScriptDrawer({ contentCardId, isOpen, onClose, isLocked }) {
  const [scriptData, setScriptData] = useState({
    script: '',
    master_caption: '',
    master_seo: ''
  });

  // In V1, we'll store this in localStorage per card
  // V2 might add a ScriptData entity
  useEffect(() => {
    if (contentCardId) {
      const saved = localStorage.getItem(`script_${contentCardId}`);
      if (saved) {
        setScriptData(JSON.parse(saved));
      }
    }
  }, [contentCardId]);

  const handleSave = () => {
    localStorage.setItem(`script_${contentCardId}`, JSON.stringify(scriptData));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-purple-500 shadow-2xl"
          style={{ maxHeight: '60vh' }}
        >
          <div className="max-w-7xl mx-auto p-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Script + Master Caption + SEO</h3>
              <div className="flex items-center gap-2">
                {!isLocked && (
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Script</Label>
                <Textarea
                  value={scriptData.script}
                  onChange={(e) => setScriptData({ ...scriptData, script: e.target.value })}
                  rows={12}
                  placeholder="Write your script here..."
                  disabled={isLocked}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label>Master Caption</Label>
                <Textarea
                  value={scriptData.master_caption}
                  onChange={(e) => setScriptData({ ...scriptData, master_caption: e.target.value })}
                  rows={12}
                  placeholder="Master caption (can be overridden per platform)..."
                  disabled={isLocked}
                />
              </div>

              <div>
                <Label>Master SEO / Keywords</Label>
                <Textarea
                  value={scriptData.master_seo}
                  onChange={(e) => setScriptData({ ...scriptData, master_seo: e.target.value })}
                  rows={12}
                  placeholder="Keywords, hashtags..."
                  disabled={isLocked}
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
              <strong>Note:</strong> Master caption and SEO are shared across all platforms. Override them in individual platform tabs if needed.
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}