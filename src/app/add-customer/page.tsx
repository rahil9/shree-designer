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
import { useToast } from "@/hooks/use-toast";

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
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    measurementType: '',
  });

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

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
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
      await addDoc(collection(db, 'customers'), customerData);
      toast({
        title: "Success!",
        description: `Successfully added ${capitalizedType} measurements for ${formData.name}`,
        className: "bg-green-500 text-white border-green-600",
      });
      router.push('/');
    } catch (error) {
      console.error('Error saving customer data:', error);
      toast({
        title: "Error",
        description: "Failed to save customer data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen p-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.back()}
        className="absolute top-4 left-4"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Back</span>
      </Button>

      <div className="max-w-md mx-auto pt-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {step === 1 ? 'Add New Customer' : 'Add Measurements'}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
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
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
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
                  {errors.measurementType && (
                    <p className="text-sm text-destructive">{errors.measurementType}</p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  Next
                </Button>
              </form>
            ) : (
              <MeasurementForm
                type={formData.measurementType as 'top' | 'blouse' | 'salwar'}
                onSubmit={handleMeasurementSubmit}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 