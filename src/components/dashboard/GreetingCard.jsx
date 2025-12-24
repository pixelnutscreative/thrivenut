import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Heart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const scriptures = [
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "For I know the plans I have for you, declares the Lord, plans to prosper you.", ref: "Jeremiah 29:11" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged.", ref: "Joshua 1:9" },
  { text: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" }
];

const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" }
];

const motivational = [
  { text: "Let's CRUSH today! You've got this! 💪", author: "ThriveNut" },
  { text: "Today is YOUR day to shine! Make it count! ✨", author: "ThriveNut" },
  { text: "You're unstoppable! Let's make magic happen! 🚀", author: "ThriveNut" },
  { text: "Rise and THRIVE! The world is waiting for you! 🌟", author: "ThriveNut" }
];

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function GreetingCard({ greetingType, userName }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);

  const getMessages = () => {
    if (greetingType === 'scripture') return scriptures;
    if (greetingType === 'positive_quote') return quotes;
    return motivational;
  };

  const messages = getMessages();

  // Initialize with "today's" message index
  React.useEffect(() => {
    const today = new Date().getDate();
    setCurrentIndex(today % messages.length);
  }, [greetingType]);

  // Auto-rotate on load
  React.useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, messages.length]);

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % messages.length);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + messages.length) % messages.length);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const message = messages[currentIndex];
  const Icon = greetingType === 'scripture' ? Heart : greetingType === 'positive_quote' ? Sparkles : Zap;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative group"
    >
      <Card className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white border-0 shadow-xl overflow-hidden relative">
        <CardContent className="p-8 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          
          {/* Navigation Arrows - Visible on Hover or Clickable */}
          <button 
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white/70 hover:text-white transition-all z-20"
            aria-label="Previous quote"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white/70 hover:text-white transition-all z-20"
            aria-label="Next quote"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="relative z-10 px-8">
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-6 h-6" />
              <p className="text-xl font-medium opacity-90">{getGreeting()}, {userName}!</p>
            </div>
            
            <div className="min-h-[120px] flex flex-col justify-center">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <blockquote className="text-2xl md:text-3xl font-bold leading-relaxed mb-3">
                  "{message.text}"
                </blockquote>
                <p className="text-white/80 text-lg">— {message.ref || message.author}</p>
              </motion.div>
            </div>
            
            {/* Dots Indicator */}
            <div className="flex justify-center gap-1.5 mt-4">
              {messages.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}