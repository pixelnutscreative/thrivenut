import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

export const speak = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
};

export default function SpeakButton({ text, className = '' }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      aria-label="Read aloud"
    >
      <Volume2 className="w-4 h-4" />
    </Button>
  );
}