'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
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
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

interface MeasurementType {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

const measurementTypes: MeasurementType[] = [
  { value: 'top', label: 'Top' },
  { value: 'blouse', label: 'Blouse' },
  { value: 'salwar', label: 'Salwar' },
];

interface Customer {
  id: string;
  name: string;
  phone: string;
  measurements: Record<string, any>;
}

export default function AddMeasurement() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingMeasurements, setExistingMeasurements] = useState<any>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const customersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customersList);
    };
    fetchCustomers();
  }, []);

  const handleCustomerSelect = async (customerId: string) => {
    setSelectedCustomer(customerId);
    setSelectedType('');
    setExistingMeasurements(null);
    
    const customer = customers.find(c => c.id === customerId);
    if (customer?.measurements) {
      setExistingMeasurements(customer.measurements);
    }
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
  };

  const handleMeasurementSubmit = async (measurements: any) => {
    if (!selectedCustomer || !selectedType) return;

    setIsSubmitting(true);
    const capitalizedType = selectedType.charAt(0).toUpperCase() + selectedType.slice(1);
    const customer = customers.find(c => c.id === selectedCustomer);
    
    try {
      const customerRef = doc(db, 'customers', selectedCustomer);
      const customerDoc = await getDoc(customerRef);
      
      if (!customerDoc.exists()) {
        throw new Error('Customer not found');
      }

      const customerData = customerDoc.data();
      const updatedMeasurements = {
        ...customerData.measurements,
        [capitalizedType]: measurements
      };

      await updateDoc(customerRef, {
        measurements: updatedMeasurements
      });

      toast({
        title: "Success!",
        description: `Successfully added ${capitalizedType} measurements for ${customer?.name}`,
        className: "bg-green-500 text-white border-green-600",
      });
      router.push('/');
    } catch (error) {
      console.error('Error saving measurements:', error);
      toast({
        title: "Error",
        description: "Failed to save measurements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableTypes = () => {
    if (!existingMeasurements) return measurementTypes;
    
    return measurementTypes.map(type => ({
      ...type,
      disabled: !!existingMeasurements[type.label],
      description: existingMeasurements[type.label] ? 'Already exists' : undefined
    }));
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
            <CardTitle className="text-2xl text-center">Add New Measurement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="customer">Select Customer</Label>
                <Select
                  value={selectedCustomer}
                  onValueChange={handleCustomerSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer && (
                <div className="space-y-2">
                  <Label htmlFor="measurementType">Measurement Type</Label>
                  <Select
                    value={selectedType}
                    onValueChange={handleTypeSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select measurement type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTypes().map((type) => (
                        <SelectItem 
                          key={type.value} 
                          value={type.value}
                          disabled={type.disabled}
                        >
                          {type.label}
                          {type.description && (
                            <span className="text-muted-foreground ml-2">
                              ({type.description})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedCustomer && selectedType && (
                <MeasurementForm
                  type={selectedType as 'top' | 'blouse' | 'salwar'}
                  onSubmit={handleMeasurementSubmit}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 