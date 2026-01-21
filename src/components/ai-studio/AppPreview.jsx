import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Wand2, ArrowUp, FolderOpen, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DynamicInput from './DynamicInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

export default function AppPreview({ app, onClose, primaryColor, accentColor }) {
  const [inputs, setInputs] = useState({});
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('9:16');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [upscaling, setUpscaling] = useState(false);
  const [promptUsed, setPromptUsed] = useState('');
  const queryClient = useQueryClient();

  // Fetch past outputs for this app
  const { data: pastOutputs = [] } = useQuery({
    queryKey: ['appOutputs', app.id],
    queryFn: () => base44.entities.AIAppOutput.filter({ app_id: app.id }, '-created_date'),
  });

  const getSizeConfig = () => {
    const sizes = {
      '9:16': { width: 1080, height: 1920 },
      '1:1': { width: 1080, height: 1080 },
      '16:9': { width: 1920, height: 1080 },
      'fb-cover': { width: 820, height: 312 },
      'yt-thumbnail': { width: 1280, height: 720 },
      'linkedin-banner': { width: 1584, height: 396 },
      'ig-landscape': { width: 1080, height: 566 },
    };
    
    if (selectedSize === 'custom' && customWidth && customHeight) {
      return { width: parseInt(customWidth), height: parseInt(customHeight) };
    }
    
    return sizes[selectedSize] || sizes['9:16'];
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Fetch global context
      const [characters, brands, products] = await Promise.all([
        base44.entities.CharacterReference.list(),
        base44.entities.Brand.list(),
        base44.entities.BrandProduct.list()
      ]);

      const characterRef = localStorage.getItem('selectedCharacterId');
      const brandId = localStorage.getItem('selectedBrandId');
      const productId = localStorage.getItem('selectedProductId');

      const character = characters.find(c => c.id === characterRef);
      const brand = brands.find(b => b.id === brandId);
      const product = products.find(p => p.id === productId);

      // Build prompt using app's actual name and description
      let prompt = `Create an image for "${app.name}": ${app.description}\n\n`;
      
      // Add user inputs
      Object.entries(inputs).forEach(([key, value]) => {
        if (value) prompt += `${key}: ${value}\n`;
      });

      // Add context
      if (character) {
        prompt += `\nCharacter Reference: ${character.name} - ${character.description}`;
        if (character.prompt_snippet) prompt += `\n${character.prompt_snippet}`;
      }
      if (brand) {
        prompt += `\nBrand Style: ${brand.name} - ${brand.description}`;
        if (brand.tone_voice) prompt += ` (Tone: ${brand.tone_voice})`;
      }
      if (product) {
        prompt += `\nFeaturing Product: ${product.name} - ${product.description}`;
      }

      const sizeConfig = getSizeConfig();
      prompt += `\n\nImage dimensions: ${sizeConfig.width}x${sizeConfig.height}`;

      setPromptUsed(prompt);

      const response = await base44.integrations.Core.GenerateImage({ prompt });
      setGeneratedImage(response.url);

      // Save output
      await base44.entities.AIAppOutput.create({
        app_id: app.id,
        output_url: response.url,
        prompt_text: prompt,
        character_reference_id: characterRef,
        brand_id: brandId,
        product_id: productId
      });

      queryClient.invalidateQueries(['appOutputs', app.id]);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpscale = async () => {
    if (!generatedImage) return;
    setUpscaling(true);
    try {
      const upscalePrompt = `Upscale and enhance this image to 4K quality with maximum detail and clarity. ${promptUsed}`;
      const response = await base44.integrations.Core.GenerateImage({ 
        prompt: upscalePrompt,
        existing_image_urls: [generatedImage]
      });
      setGeneratedImage(response.url);
    } catch (error) {
      console.error('Upscale error:', error);
      alert('Failed to upscale image');
    } finally {
      setUpscaling(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{app.name}</DialogTitle>
              <p className="text-sm text-gray-600">{app.description}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="create" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create New</TabsTrigger>
            <TabsTrigger value="gallery">
              <FolderOpen className="w-4 h-4 mr-2" />
              The Closet ({pastOutputs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            {/* Size Selector */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-medium mb-3 block">Image Size</Label>
              <div className="grid grid-cols-4 gap-2">
                {['9:16', '1:1', '16:9', 'fb-cover', 'yt-thumbnail', 'linkedin-banner', 'ig-landscape', 'custom'].map(size => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                    className="text-xs"
                  >
                    {size === 'custom' ? 'Custom' : size}
                  </Button>
                ))}
              </div>
              {selectedSize === 'custom' && (
                <div className="flex gap-2 mt-3">
                  <Input type="number" placeholder="Width" value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} />
                  <span className="mt-2">×</span>
                  <Input type="number" placeholder="Height" value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} />
                </div>
              )}
            </div>

            {/* Dynamic Inputs */}
            {app.config_json?.inputFields?.map(field => (
              <div key={field.id}>
                <DynamicInput
                  field={field}
                  value={inputs[field.label] || ''}
                  onChange={(label, value) => setInputs({ ...inputs, [label]: value })}
                />
              </div>
            ))}

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate}
              disabled={generating}
              className="w-full"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Image
                </>
              )}
            </Button>

            {/* Result */}
            {generatedImage && (
              <div className="space-y-3">
                <img src={generatedImage} alt="Generated" className="w-full rounded-lg shadow-lg" />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(generatedImage, '_blank')}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleUpscale}
                    disabled={upscaling}
                    className="flex-1"
                  >
                    {upscaling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUp className="w-4 h-4 mr-2" />}
                    Upscale
                  </Button>
                </div>
                {promptUsed && (
                  <details className="text-xs bg-gray-50 p-3 rounded">
                    <summary className="cursor-pointer font-medium text-gray-700">View Prompt Used</summary>
                    <p className="mt-2 text-gray-600 whitespace-pre-wrap">{promptUsed}</p>
                  </details>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="mt-4">
            {pastOutputs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FolderOpen className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p>No images yet. Create your first one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {pastOutputs.map(output => (
                  <Card key={output.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                    <img 
                      src={output.output_url} 
                      alt="Past output" 
                      className="w-full h-48 object-cover"
                      onClick={() => window.open(output.output_url, '_blank')}
                    />
                    {output.prompt_text && (
                      <details className="p-2 text-xs bg-gray-50">
                        <summary className="cursor-pointer font-medium">Prompt</summary>
                        <p className="mt-1 text-gray-600 line-clamp-3">{output.prompt_text}</p>
                      </details>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}