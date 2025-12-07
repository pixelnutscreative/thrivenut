import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, MapPin } from 'lucide-react';

function OnboardingModal({ isOpen, user, onComplete }) {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [showOnMap, setShowOnMap] = useState(false);
  const [skipLocation, setSkipLocation] = useState(false);

  const completeMutation = useMutation({
    mutationFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      
      const data = {
        onboarding_completed: true,
        ...(skipLocation ? {} : {
          location_city: city,
          location_state: state,
          show_on_map: showOnMap
        })
      };

      if (prefs[0]) {
        await base44.entities.UserPreferences.update(prefs[0].id, data);
      } else {
        await base44.entities.UserPreferences.create({
          user_email: user.email,
          ...data
        });
      }

      // Mark complete in localStorage
      localStorage.setItem(`onboarding_completed_${user.email}`, 'true');
    },
    onSuccess: () => {
      onComplete();
    }
  });

  const handleSubmit = () => {
    if (skipLocation || (city && state)) {
      completeMutation.mutate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Welcome to Let's Thrive!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            We'd love to show where our community is from on a map! This is totally optional - you can skip this if you prefer.
          </p>

          {!skipLocation && (
            <>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Nashville"
                />
              </div>

              <div className="space-y-2">
                <Label>State (or Country if outside US)</Label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g., TN or United Kingdom"
                />
              </div>

              <div
                onClick={() => setShowOnMap(!showOnMap)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  showOnMap ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={showOnMap} />
                  <div>
                    <span className="font-medium text-sm">Show me on the community map</span>
                    <p className="text-xs text-gray-500">Let others see your general location</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div
            onClick={() => setSkipLocation(!skipLocation)}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
              skipLocation ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Checkbox checked={skipLocation} />
              <span className="font-medium text-sm">Skip - I prefer to remain anonymous</span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={completeMutation.isPending || (!skipLocation && (!city || !state))}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {completeMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Let's Go!"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingModal;