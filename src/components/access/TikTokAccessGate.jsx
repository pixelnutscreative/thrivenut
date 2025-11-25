import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Star, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function TikTokAccessGate({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unlock TikTok Features</h2>
          <p className="text-gray-600 mb-6">
            Get access to TikTok content goals, engagement tracking, gifter songs, and more!
          </p>

          <div className="space-y-3">
            <Link to={createPageUrl('SuperFanAccess')} onClick={onClose}>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Star className="w-4 h-4 mr-2" />
                I'm a SuperFan - Request Access
              </Button>
            </Link>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
              disabled
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Subscribe for $111/year
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Coming Soon</span>
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            SuperFans of PixelNutsCreative get free access! Just submit proof of your subscription.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}