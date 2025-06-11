'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import MeasurementForm from "@/components/MeasurementForm";
import { db } from "@/lib/firebase";
import { collection, addDoc } from 'firebase/firestore';
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

const measurementTypes = [
  { value: 'top', label: 'Top' },
  { value: 'blouse', label: 'Blouse' },
  { value: 'salwar', label: 'Salwar' },
];

export default function AddCustomer() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    measurementType: '',
    measurements: null as Record<string, number> | null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateStep1 = () => {
    const newErrors = {
      name: '',
      phone: '',
      measurementType: '',
    };

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.measurementType) {
      newErrors.measurementType = 'Please select a measurement type';
    }

    const hasErrors = Object.values(newErrors).some(error => error);
    if (hasErrors) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: Object.values(newErrors).find(error => error) || "Please check your input.",
      });
    }
    return !hasErrors;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleMeasurementSubmit = async (measurements: Record<string, number>) => {
    const capitalizedType = formData.measurementType.charAt(0).toUpperCase() + formData.measurementType.slice(1);
    const customerData = {
      name: formData.name,
      phone: formData.phone,
      measurements: {
        [capitalizedType]: measurements
      }
    };

    try {
      setIsLoading(true);

      await addDoc(collection(db, 'customers'), customerData);

      toast({
        title: "Success!",
        description: `Successfully added ${capitalizedType} measurements for ${formData.name}`,
        className: "bg-green-500 text-white border-green-600",
      });

      // Reset form
      setFormData({
        name: '',
        phone: '',
        measurementType: '',
        measurements: null,
      });

      // Navigate back
      router.push('/');
    } catch (err) {
      console.error('Error adding customer:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to add customer. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-2xl font-bold">
          {step === 1 ? 'Add New Customer' : 'Add Measurements'}
        </h1>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {step === 1 ? (
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter 10-digit phone number"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="measurementType">Measurement Type</Label>
              <Select
                value={formData.measurementType}
                onValueChange={(value) => setFormData({ ...formData, measurementType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select measurement type" />
                </SelectTrigger>
                <SelectContent>
                  {measurementTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Next'}
            </Button>
          </form>
        ) : (
          <MeasurementForm
            type={formData.measurementType as 'top' | 'blouse' | 'salwar'}
            onSubmit={handleMeasurementSubmit}
          />
        )}
      </div>
      <Toaster />
    </div>
  );
} 