import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Upload, Wand2, Plus, Trash2 } from 'lucide-react';

export default function ImageAppBuilder({ primaryColor, accentColor }) {
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [appIcon, setAppIcon] = useState(null);
  const [iconPrompt, setIconPrompt] = useState('');
  const [iconStyle, setIconStyle] = useState('');
  const [inputFields, setInputFields] = useState([]);

  const addInputField = () => {
    setInputFields([...inputFields, {
      id: Date.now(),
      label: '',
      type: 'text',
      required: true,
      placeholder: ''
    }]);
  };

  const removeInputField = (id) => {
    setInputFields(inputFields.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* App Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>App Information</CardTitle>
          <CardDescription>Basic details about your image generation app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>App Name *</Label>
            <Input 
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g., Product Photo Generator"
            />
          </div>

          <div>
            <Label>App Description</Label>
            <Textarea 
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              placeholder="Describe what your app does..."
              rows={3}
            />
          </div>

          {/* App Icon */}
          <div>
            <Label>App Icon</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {/* Manual Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-1">Upload Icon</p>
                <p className="text-xs text-gray-400">PNG, JPG (Square)</p>
              </div>

              {/* AI Generated */}
              <div className="border-2 border-dashed rounded-lg p-4" style={{ borderColor: primaryColor }}>
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 className="w-4 h-4" style={{ color: primaryColor }} />
                  <p className="text-sm font-medium">Generate with AI</p>
                </div>
                <Input 
                  value={iconPrompt}
                  onChange={(e) => setIconPrompt(e.target.value)}
                  placeholder="Describe the icon you want..."
                  className="mb-2"
                />
                <Input 
                  value={iconStyle}
                  onChange={(e) => setIconStyle(e.target.value)}
                  placeholder="Style (optional): flat, 3D, minimalist..."
                />
                <Button 
                  size="sm" 
                  className="w-full mt-3"
                  style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Icon
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Input Fields Configuration</CardTitle>
              <CardDescription>Define what inputs users will provide</CardDescription>
            </div>
            <Button 
              size="sm"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {inputFields.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500 mb-4">No input fields yet. Add fields or let AI suggest them.</p>
              <Button onClick={addInputField} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Input Field
              </Button>
            </div>
          ) : (
            <>
              {inputFields.map(field => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Field Label</Label>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => removeInputField(field.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input 
                    placeholder="e.g., Product Name"
                    value={field.label}
                    onChange={(e) => {
                      const updated = inputFields.map(f => 
                        f.id === field.id ? {...f, label: e.target.value} : f
                      );
                      setInputFields(updated);
                    }}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Field Type</Label>
                      <Select value={field.type}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Long Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="dropdown">Dropdown</SelectItem>
                          <SelectItem value="file">File Upload</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Required</Label>
                      <Select value={field.required ? 'yes' : 'no'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={addInputField} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Another Field
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Save Draft</Button>
        <Button style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}>
          <Sparkles className="w-4 h-4 mr-2" />
          Save & Test App
        </Button>
      </div>
    </div>
  );
}