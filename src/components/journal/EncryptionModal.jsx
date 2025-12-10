import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Lock, Unlock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import CryptoJS from 'crypto-js';

export default function EncryptionModal({ isOpen, onClose, onUnlock, onEncrypt, mode = 'unlock', isSettingKey = false }) {
  const [key, setKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');
    
    if (isSettingKey) {
      if (key.length < 4) {
        setError('Key must be at least 4 characters');
        return;
      }
      if (key !== confirmKey) {
        setError('Keys do not match');
        return;
      }
      onEncrypt(key);
    } else {
      // Unlocking
      if (!key) {
        setError('Please enter your key');
        return;
      }
      onUnlock(key);
    }
    
    setKey('');
    setConfirmKey('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSettingKey ? <Lock className="w-5 h-5 text-purple-600" /> : <Unlock className="w-5 h-5 text-green-600" />}
            {isSettingKey ? 'Encrypt Entry' : 'Unlock Entry'}
          </DialogTitle>
          <DialogDescription>
            {isSettingKey 
              ? 'Set a private key for this entry. You will need this EXACT key to read it later. We do not store this key.' 
              : 'Enter the key you used to lock this entry.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="relative">
            <Input 
              type={showKey ? 'text' : 'password'}
              placeholder="Enter private key/PIN"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="pr-10"
            />
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {isSettingKey && (
            <Input 
              type={showKey ? 'text' : 'password'}
              placeholder="Confirm key"
              value={confirmKey}
              onChange={(e) => setConfirmKey(e.target.value)}
            />
          )}

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          {isSettingKey && (
            <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <p>Warning: If you forget this key, your entry cannot be recovered. We cannot reset it for you.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
            {isSettingKey ? 'Lock Entry' : 'Unlock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}