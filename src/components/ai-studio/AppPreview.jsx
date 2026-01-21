import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Loader2, Download } from 'lucide-react';
import DynamicInput from './DynamicInput';
import { base44 } from '@/api/base44Client';

export default function AppPreview({ app, onClose, primaryColor, accentColor }) {
  const [inputs, setInputs] = useState({});
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  const handleInputChange = (label, value) => {
    setInputs({ ...inputs, [label]: value });
  };

  const generateImage = async () => {
    setGenerating(true);
    try {
      // Build prompt from inputs
      let prompt = `${app.description}. `;
      Object.entries(inputs).forEach(([key, value]) => {
        if (value) prompt += `${key}: ${value}. `;
      });

      const response = await base44.integrations.Core.GenerateImage({
        prompt: prompt.trim()
      });

      if (response?.url) {
        setGeneratedImage(response.url);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  const inputFields = app.config_json?.inputFields || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {app.app_icon_url && (
              <img src={app.app_icon_url} alt={app.name} className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div>
              <h2 className="text-2xl font-bold">{app.name}</h2>
              <p className="text-sm text-gray-500">Preview Mode</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {app.description && (
            <p className="text-gray-600">{app.description}</p>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Configure Your Image</CardTitle>
              <CardDescription>Fill in the details below to generate your custom image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inputFields.map((field) => (
                <DynamicInput
                  key={field.id}
                  field={field}
                  value={inputs[field.label]}
                  onChange={handleInputChange}
                />
              ))}

              <Button
                onClick={generateImage}
                disabled={generating}
                className="w-full"
                style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedImage && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full rounded-lg"
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(generatedImage, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setGeneratedImage(null)}
                  >
                    Generate Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}