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
import { ArrowLeft } from "lucide-react";
import MeasurementForm from "@/components/MeasurementForm";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

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
  measurements: Record<string, Record<string, number>>;
}

export default function AddMeasurement() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [existingMeasurements, setExistingMeasurements] = useState<Record<string, Record<string, number>> | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'customers'));
        const customersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Customer[];
        setCustomers(customersList);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch customers. Please try again.",
        });
      }
    };
    fetchCustomers();
  }, [toast]);

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

  const handleMeasurementSubmit = async (measurements: Record<string, number>) => {
    if (!selectedCustomer || !selectedType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a customer and measurement type.",
      });
      return;
    }

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
        variant: "destructive",
        title: "Error",
        description: "Failed to save measurements. Please try again.",
      });
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
          Add Measurements
        </h1>
      </div>

      <div className="max-w-md mx-auto space-y-6">
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
      </div>
      <Toaster />
    </div>
  );
} 