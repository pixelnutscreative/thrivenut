import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, ExternalLink } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

const resources = [
  {
    title: 'Bible Gateway',
    description: 'Read the Bible in multiple translations',
    url: 'https://www.biblegateway.com/',
    category: 'Bible Reading'
  },
  {
    title: 'YouVersion Bible App',
    description: 'Bible plans, devotionals, and audio Bible',
    url: 'https://www.bible.com/',
    category: 'Bible Reading'
  },
  {
    title: 'Blue Letter Bible',
    description: 'Bible study tools with original languages',
    url: 'https://www.blueletterbible.org/',
    category: 'Bible Study'
  },
  {
    title: 'Got Questions',
    description: 'Biblical answers to tough questions',
    url: 'https://www.gotquestions.org/',
    category: 'Study & Learning'
  },
  {
    title: 'BibleProject',
    description: 'Animated videos explaining Bible books',
    url: 'https://bibleproject.com/',
    category: 'Study & Learning'
  },
  {
    title: 'DesiringGod',
    description: 'Sermons and articles by John Piper',
    url: 'https://www.desiringgod.org/',
    category: 'Devotionals'
  },
  {
    title: 'The Gospel Coalition',
    description: 'Articles, podcasts, and resources',
    url: 'https://www.thegospelcoalition.org/',
    category: 'Articles & Podcasts'
  },
  {
    title: 'Crossway',
    description: 'Christian books and Bible resources',
    url: 'https://www.crossway.org/',
    category: 'Books'
  }
];

export default function BibleResources() {
  const { isDark, bgClass, textClass, primaryColor, cardBgClass } = useTheme();

  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.category]) acc[resource.category] = [];
    acc[resource.category].push(resource);
    return acc;
  }, {});

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, #bd84f5)` }}
          >
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${textClass}`}>Bible Resources</h1>
            <p className="text-gray-500">Trusted Christian resources for Bible study and spiritual growth</p>
          </div>
        </div>

        {Object.entries(groupedResources).map(([category, items]) => (
          <div key={category}>
            <h2 className={`text-xl font-bold mb-3 ${textClass}`}>{category}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((resource) => (
                <a
                  key={resource.url}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Card className={`${cardBgClass} transition-all hover:shadow-lg border-2 hover:border-purple-300`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span>{resource.title}</span>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                      </CardTitle>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        ))}

        <Card className={cardBgClass}>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              💡 <strong>Note:</strong> These are external resources. Always test teaching against Scripture and consult trusted spiritual leaders.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}