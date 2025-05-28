"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

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

export default function SearchCustomer() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedMeasurement, setExpandedMeasurement] = useState<Record<string, string | null>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchCustomers = async () => {
      const querySnapshot = await getDocs(collection(db, "customers"));
      const customersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];
      setCustomers(customersList);
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const q = search.toLowerCase();
    return (
      customer.name.toLowerCase().includes(q) ||
      customer.phone.includes(q)
    );
  });

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-2xl font-bold">Search Customers</h1>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          Total: {customers.length}
        </span>
      </div>
      <div className="space-y-0 border rounded-none">
        {filteredCustomers.length === 0 && (
          <div className="text-center text-muted-foreground py-8">No customers found.</div>
        )}
        {filteredCustomers.map((customer, idx) => (
          <div key={customer.id}>
            <button
              className="w-full flex justify-between items-center px-4 py-3 text-left focus:outline-none hover:bg-muted transition"
              onClick={() => setExpanded(expanded === customer.id ? null : customer.id)}
              aria-expanded={expanded === customer.id}
            >
              <span className="font-medium">{customer.name}</span>
              {expanded === customer.id ? <ChevronUp /> : <ChevronDown />}
            </button>
            {expanded === customer.id && (
              <div className="px-4 pb-4">
                <div className="mb-2 text-md">Phone: <strong>{customer.phone}</strong></div>
                <div>
                  <div className="font-semibold mb-1">Measurements:</div>
                  {customer.measurements ? (
                    <ul className="pl-0">
                      {Object.entries(customer.measurements).map(([type, values]) => (
                        <li key={type} className="mb-2">
                          <div className="border border-gray-300 rounded-lg mb-2">
                            <button
                              className="w-full flex justify-between items-center py-2 px-2 text-left rounded-lg hover:bg-gray-100 transition"
                              onClick={() => setExpandedMeasurement(prev => ({
                                ...prev,
                                [customer.id]: prev[customer.id] === type ? null : type
                              }))}
                            >
                              <span className="font-medium">{type}</span>
                              {expandedMeasurement[customer.id] === type ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {expandedMeasurement[customer.id] === type && (
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 px-2 pb-2">
                                {Object.entries(values)
                                  .sort(([a], [b]) => a.localeCompare(b))
                                  .map(([k, v]) => (
                                    <div key={k} className="text-sm flex items-center">
                                      <span className="font-semibold mr-1">{k}:</span> {v} in
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-muted-foreground">No measurements</div>
                  )}
                </div>
              </div>
            )}
            {idx !== filteredCustomers.length - 1 && <hr className="border-t border-gray-200" />}
          </div>
        ))}
      </div>
    </div>
  );
} 