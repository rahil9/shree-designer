'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MeasurementFormProps {
  type: 'top' | 'blouse' | 'salwar';
  onSubmit: (measurements: any) => void;
}

const topAndBlouseFields = [
  { id: 'length', label: 'Length' },
  { id: 'shoulder', label: 'Shoulder' },
  { id: 'upperChest', label: 'Upper Chest' },
  { id: 'chest', label: 'Chest' },
  { id: 'waist', label: 'Waist' },
  { id: 'hip', label: 'Hip' },
  { id: 'sleevesLength', label: 'Sleeves Length' },
  { id: 'armRound', label: 'Arm Round' },
  { id: 'bottomRound', label: 'Bottom Round' },
  { id: 'bicep', label: 'Bicep' },
  { id: 'frontNeck', label: 'Front Neck' },
  { id: 'backNeck', label: 'Back Neck' },
];

const salwarFields = [
  { id: 'length', label: 'Length' },
  { id: 'bottomRound', label: 'Bottom Round' },
  { id: 'kneeRound', label: 'Knee Round' },
  { id: 'kneeLength', label: 'Knee Length' },
  { id: 'thigh', label: 'Thigh' },
];

export default function MeasurementForm({ type, onSubmit }: MeasurementFormProps) {
  const fields = type === 'salwar' ? salwarFields : topAndBlouseFields;
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateMeasurements = () => {
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (!measurements[field.id]) {
        newErrors[field.id] = 'This field is required';
      } else if (isNaN(Number(measurements[field.id]))) {
        newErrors[field.id] = 'Please enter a valid number';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateMeasurements()) {
      onSubmit(measurements);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>{field.label}</Label>
          <Input
            id={field.id}
            type="number"
            step="0.1"
            value={measurements[field.id] || ''}
            onChange={(e) => setMeasurements({ ...measurements, [field.id]: e.target.value })}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
          {errors[field.id] && (
            <p className="text-sm text-destructive">{errors[field.id]}</p>
          )}
        </div>
      ))}
      <Button type="submit" className="w-full">
        Submit Measurements
      </Button>
    </form>
  );
} 