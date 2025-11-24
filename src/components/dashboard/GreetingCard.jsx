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

export default function GreetingCard({ greetingType, userName }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getDailyMessage = () => {
    const today = new Date().getDate();
    
    if (greetingType === 'scripture') {
      return scriptures[today % scriptures.length];
    } else if (greetingType === 'positive_quote') {
      return quotes[today % quotes.length];
    } else {
      return motivational[today % motivational.length];
    }
  };

  const message = getDailyMessage();
  const Icon = greetingType === 'scripture' ? Heart : greetingType === 'positive_quote' ? Sparkles : Zap;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white border-0 shadow-xl overflow-hidden">
        <CardContent className="p-8 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-6 h-6" />
              <p className="text-xl font-medium opacity-90">{getGreeting()}, {userName}!</p>
            </div>
            <blockquote className="text-2xl md:text-3xl font-bold leading-relaxed mb-3">
              "{message.text}"
            </blockquote>
            <p className="text-white/80 text-lg">— {message.ref || message.author}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}