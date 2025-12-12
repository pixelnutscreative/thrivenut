import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ExternalLink } from 'lucide-react';

export default function CalendarIntegrationCard({ onConnectGoogleCalendar }) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await onConnectGoogleCalendar?.();
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      <Button 
        onClick={handleConnect}
        disabled={connecting}
        variant="outline"
        size="sm"
        className="flex-1"
      >
        <CalendarIcon className="w-4 h-4 mr-2" />
        {connecting ? 'Connecting...' : 'Connect Your Calendar'}
      </Button>
      
      <Button 
        onClick={() => window.open('https://pixelnutscreative.com/cal', '_blank')}
        variant="outline"
        size="sm"
        className="flex-1"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Add Pixel's Events
      </Button>
    </div>
  );
}