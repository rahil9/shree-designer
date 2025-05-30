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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Minus, MessageCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Customer {
  id: string;
  name: string;
  phone: string;
  measurements: {
    [measurementType: string]: {
      [key: string]: string;
    };
  };
}

interface Bill {
  customerId: string;
  customerName: string;
  customerPhone: string;
  clothingType: string;
  subType: string;
  otherClothing?: string;
  quantity: number;
  amount: number;
}

export default function GenerateBill() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [clothingType, setClothingType] = useState('');
  const [subType, setSubType] = useState('');
  const [otherClothing, setOtherClothing] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

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

  const handleQuantityChange = (increment: boolean) => {
    setQuantity(prev => {
      const newValue = increment ? prev + 1 : prev - 1;
      return newValue < 1 ? 1 : newValue;
    });
  };

  const handleWhatsAppBill = async () => {
    if (!selectedCustomer) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a customer first.",
      });
      return;
    }

    if (!clothingType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a clothing type.",
      });
      return;
    }

    if (!amount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the amount.",
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const billData: Bill = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        clothingType,
        subType: clothingType === 'other' ? '' : subType,
        otherClothing: clothingType === 'other' ? otherClothing : '',
        quantity,
        amount: Number(amount)
      };

      await addDoc(collection(db, 'bills'), billData);

      const res = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate invoice');
      }

      setPdfUrl(data.pdfUrl);

      // Format WhatsApp number (remove spaces, dashes, and ensure it starts with country code)
      let whatsappNumber = selectedCustomer.phone.replace(/[\s-]/g, '');
      if (!whatsappNumber.startsWith('+')) {
        whatsappNumber = '+91' + whatsappNumber; // Default to India's country code if not provided
      }
      
      // Generate WhatsApp link
      const message = encodeURIComponent(
        `Hello ${selectedCustomer.name},\n\nThank you for your purchase!\nYour invoice is ready:\n${data.pdfUrl}\n\nBest regards,\nShree Designer`
      );
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

      // Open WhatsApp in new tab
      const whatsappWindow = window.open(whatsappUrl, '_blank');
      if (!whatsappWindow) {
        throw new Error('Please allow popups to open WhatsApp');
      }

      toast({
        title: "Success!",
        description: "Bill generated and WhatsApp message prepared.",
        className: "bg-green-500 text-white border-green-600",
      });

      // Reset form
      setSelectedCustomer(null);
      setClothingType('');
      setSubType('');
      setOtherClothing('');
      setQuantity(1);
      setAmount('');
    } catch (error) {
      console.error('Error saving bill:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save bill. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="max-w-md mx-auto space-y-6">
        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label>Select Customer</Label>
          <Select
            value={selectedCustomer?.id}
            onValueChange={(value) => {
              const customer = customers.find(c => c.id === value);
              setSelectedCustomer(customer || null);
            }}
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

        <div className="space-y-2">
          <Label>Type of Clothes</Label>
          <Select value={clothingType} onValueChange={setClothingType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blouse">Blouse</SelectItem>
              <SelectItem value="suit">Suit</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {clothingType === 'blouse' && (
          <div className="space-y-2">
            <Label>Blouse Type</Label>
            <Select value={subType} onValueChange={setSubType}>
              <SelectTrigger>
                <SelectValue placeholder="Select blouse type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal Blouse</SelectItem>
                <SelectItem value="padding">Padding Blouse</SelectItem>
                <SelectItem value="lining">Lining Blouse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {clothingType === 'suit' && (
          <div className="space-y-2">
            <Label>Suit Type</Label>
            <Select value={subType} onValueChange={setSubType}>
              <SelectTrigger>
                <SelectValue placeholder="Select suit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal Suit</SelectItem>
                <SelectItem value="full-lining">Full Lining</SelectItem>
                <SelectItem value="top-lining">Top Lining</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {clothingType === 'other' && (
          <div className="space-y-2">
            <Label>Specify Clothing Type</Label>
            <Input
              value={otherClothing}
              onChange={(e) => setOtherClothing(e.target.value)}
              placeholder="Enter clothing type"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Quantity</Label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(false)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Amount (₹)</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <Button
          className="w-full"
          onClick={handleWhatsAppBill}
          disabled={isLoading}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          {isLoading ? 'Processing...' : 'Send WhatsApp Bill'}
        </Button>
      </div>
      <Toaster />
    </div>
  );
} 