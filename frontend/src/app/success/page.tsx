"use client";

import { Button } from "@/app/components/ui/button";    
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronRight, ArrowLeft } from "lucide-react";

export default function SuccessPage() {
  const [countdown, setCountdown] = useState(10);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080b15] bg-[url('/bg-network.svg')] bg-cover bg-center bg-blend-overlay">
      <div className="w-full max-w-md rounded-xl bg-[#0c1222]/90 p-8 shadow-2xl backdrop-blur-sm">
        <h1 className="mb-4 text-center text-3xl font-bold text-white">Fortisafe</h1>
        
        <div className="mb-8 mt-12 text-center">
          <h2 className="mb-4 text-2xl font-medium text-white">You're all set!</h2>
          <p className="text-center text-sm text-gray-400">
            Welcome back. You can return to the extension to continue, or head to your Fortisafe dashboard for more tools.
          </p>
        </div>
        
        <div className="space-y-3">
          <Button 
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#4f46e5] py-6 text-white hover:bg-[#4338ca]"
          >
            Proceed to site
            <ChevronRight size={18} />
          </Button>
          
          <Button 
            variant="ghost"
            className="flex w-full items-center justify-center gap-2 py-3 text-gray-300 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft size={16} />
            Return to extension
          </Button>
        </div>
        
        <div className="mt-12 text-center text-sm text-gray-500">
          This window will close automatically in {countdown} seconds...
        </div>
      </div>
    </div>
  );
}