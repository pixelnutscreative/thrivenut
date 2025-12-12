import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-white shadow-md">
        <CardContent className="p-6 space-y-4">
          {/* Google Calendar */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <CalendarIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-center mb-2">Connect Your Google Calendar</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              See your personal calendar events in My Day
            </p>
            <Button 
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {connecting ? 'Connecting...' : 'Connect Google Calendar'}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              You'll be prompted to authorize access
            </p>
          </div>

          {/* Pixel Nuts Events Calendar */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <CalendarIcon className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-center mb-2">Pixel Nuts Events Calendar</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Subscribe to community events & workshops
            </p>
            <Button 
              onClick={() => window.open('https://pixelnutscreative.com/cal', '_blank')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View & Subscribe to Events
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}