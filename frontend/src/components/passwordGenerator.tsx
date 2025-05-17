"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function PasswordGenerator() {
  const [password, setPassword] = useState("/L-76+7e1rGj");

  const generatePassword = () => {
    // Here you would implement your password generation logic
    // This is a simple example that creates a random string
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=/<>";
    const length = 12;
    let newPassword = "/";
    
    for (let i = 0; i < length; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setPassword(newPassword);
    toast.success("New password generated");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    toast.success("Password copied to clipboard");
  };

  return (
    <Card className="w-full bg-slate-900 text-white border-none shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-400">
            <KeyRound className="h-4 w-4 text-black" />
          </div>
          <span className="text-gray-300 text-sm">Generate password</span>
        </div>
        
        <div className="flex items-center justify-between rounded-md bg-slate-800 px-3 py-2">
          <p className="font-mono text-md text-white">{password}</p>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-400 hover:bg-slate-700 hover:text-white"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-400 hover:bg-slate-700 hover:text-white"
              onClick={generatePassword}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}