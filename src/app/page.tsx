'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PasswordProtection from "@/components/PasswordProtection";
import { Button } from "@/components/ui/button";
import { LogOut, UserPlus, Ruler, Search, Pencil } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <PasswordProtection onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        className="absolute top-4 right-4"
      >
        <LogOut className="h-5 w-5" />
        <span className="sr-only">Logout</span>
      </Button>

      <main className="h-screen flex flex-col items-center justify-center gap-6">
        <Image 
          src="/logo.jpg" 
          alt="Shree Designer Logo" 
          className="mb-8 object-contain" 
          width={128}
          height={128}
          priority
        />
{/* 
        <h1 className="text-3xl font-bold mb-8">Shree Designer</h1>
         */}
        <div className="flex flex-col gap-4 w-full max-w-sm px-4">
          <Button 
            className="h-16 flex items-center justify-center gap-3 text-lg"
            onClick={() => router.push('/add-customer')}
          >
            <UserPlus className="h-6 w-6" />
            <span>Add New Customer</span>
          </Button>

          <Button 
            className="h-16 flex items-center justify-center gap-3 text-lg"
            onClick={() => router.push('/add-measurement')}
          >
            <Ruler className="h-6 w-6" />
            <span>Add Measurement</span>
          </Button>

          <Button 
            className="h-16 flex items-center justify-center gap-3 text-lg"
            onClick={() => router.push('/search-customer')}
          >
            <Search className="h-6 w-6" />
            <span>Search Customer</span>
          </Button>

          <Button 
            className="h-16 flex items-center justify-center gap-3 text-lg"
            onClick={() => router.push('/edit-measurement')}
          >
            <Pencil className="h-6 w-6" />
            <span>Edit Measurement</span>
          </Button>
        </div>
      </main>
    </div>
  );
}
