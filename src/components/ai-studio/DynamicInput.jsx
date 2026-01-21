import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export default function DynamicInput({ field, value, onChange }) {
  const handleChange = (newValue) => {
    onChange(field.label, newValue);
  };

  switch (field.type) {
    case 'text':
      return (
        <div>
          <Label>{field.label} {field.required && '*'}</Label>
          <Input
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        </div>
      );

    case 'textarea':
    case 'long_text':
      return (
        <div>
          <Label>{field.label} {field.required && '*'}</Label>
          <Textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
          />
        </div>
      );

    case 'number':
      return (
        <div>
          <Label>{field.label} {field.required && '*'}</Label>
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        </div>
      );

    case 'dropdown':
      return (
        <div>
          <Label>{field.label} {field.required && '*'}</Label>
          <Select value={value} onValueChange={handleChange}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'slider':
      return (
        <div>
          <Label>{field.label} {field.required && '*'}</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[value || field.min || 0]}
              onValueChange={(val) => handleChange(val[0])}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              className="flex-1"
            />
            <span className="text-sm font-medium w-12">{value || field.min || 0}</span>
          </div>
        </div>
      );

    case 'toggle':
      return (
        <div className="flex items-center justify-between">
          <Label>{field.label} {field.required && '*'}</Label>
          <Switch
            checked={value || false}
            onCheckedChange={handleChange}
          />
        </div>
      );

    case 'file_upload':
    case 'file':
      return (
        <div>
          <Label>{field.label} {field.required && '*'}</Label>
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleChange(file);
            }}
            required={field.required}
          />
        </div>
      );

    case 'image':
      return (
        <div>
          <Label>{field.label} {field.required && '*'}</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleChange(file);
            }}
            required={field.required}
          />
        </div>
      );

    case 'language':
      return (
        <div>
          <Label>{field.label} {field.required && '*'}</Label>
          <Select value={value} onValueChange={handleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select language..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="it">Italian</SelectItem>
              <SelectItem value="pt">Portuguese</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
              <SelectItem value="ko">Korean</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );

    case 'url':
      return (
        <div>
          <Label>{field.label} {field.required && '*'}</Label>
          <Input
            type="url"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder || 'https://...'}
            required={field.required}
          />
        </div>
      );

    default:
      return (
        <div>
          <Label>{field.label} {field.required && '*'}</Label>
          <Input
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        </div>
      );
  }
}