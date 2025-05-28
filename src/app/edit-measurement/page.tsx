'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  measurements: {
    [measurementType: string]: {
      [key: string]: string;
    };
  };
}

export default function EditMeasurement() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeasurementType, setSelectedMeasurementType] = useState<string>('');
  const [measurements, setMeasurements] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const customersRef = collection(db, 'customers');
      const querySnapshot = await getDocs(customersRef);
      const customersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch customers. Please try again.",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedMeasurementType('');
    setMeasurements({});
    setOpen(false);
  };

  const handleMeasurementTypeSelect = (type: string) => {
    setSelectedMeasurementType(type);
    if (selectedCustomer && selectedCustomer.measurements[type]) {
      setMeasurements(selectedCustomer.measurements[type]);
    } else {
      setMeasurements({});
    }
  };

  const handleMeasurementChange = (key: string, newValue: string) => {
    // Remove any character that is not a digit or a decimal point
    let cleanedValue = newValue.replace(/[^0-9.]/g, '');

    // Handle multiple decimal points: keep only the first one
    const decimalParts = cleanedValue.split('.');
    if (decimalParts.length > 2) {
      cleanedValue = decimalParts[0] + '.' + decimalParts.slice(1).join('');
    }

    setMeasurements(prev => ({
      ...prev,
      [key]: cleanedValue
    }));
  };

  const handleSave = async () => {
    if (!selectedCustomer || !selectedMeasurementType) return;

    // Validate all measurements are valid numbers
    const hasInvalidMeasurements = Object.values(measurements).some(
      value => value === '' || isNaN(Number(value))
    );

    if (hasInvalidMeasurements) {
      toast({
        variant: "destructive",
        title: "Invalid Measurements",
        description: "Please ensure all measurements are valid numbers.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const customerRef = doc(db, 'customers', selectedCustomer.id);
      const updatedMeasurements = {
        ...selectedCustomer.measurements,
        [selectedMeasurementType]: measurements
      };
      
      await updateDoc(customerRef, {
        measurements: updatedMeasurements
      });
      
      toast({
        title: "Success",
        description: "Measurements updated successfully!",
      });
      
      router.push('/');
    } catch (error) {
      console.error('Error updating measurements:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update measurements. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableMeasurementTypes = selectedCustomer 
    ? Object.keys(selectedCustomer.measurements || {})
    : [];

  return (
    <div className="min-h-screen p-6">
      <Button
        variant="ghost"
        onClick={() => router.push('/')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Measurements</h1>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Search Customer</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedCustomer ? selectedCustomer.name : "Select customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search customer..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup>
                    {filteredCustomers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.name}
                        onSelect={() => handleCustomerSelect(customer)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {customer.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedCustomer && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Measurement Type</Label>
                <Select
                  value={selectedMeasurementType}
                  onValueChange={handleMeasurementTypeSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select measurement type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMeasurementTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMeasurementType && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">
                    Edit {selectedMeasurementType} Measurements for {selectedCustomer.name}
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(measurements).map(([key]) => (
                      <div key={key} className="space-y-2">
                        <Label>{key}</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={measurements[key] || ''}
                          onChange={(e) => handleMeasurementChange(key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={isLoading || Object.values(measurements).some(v => v === '' || isNaN(Number(v)))}
                    className="w-full"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 