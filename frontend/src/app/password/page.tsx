"use client";

import { KeyRound, Shield } from "lucide-react";
import PasswordGenerator from "@/components/passwordGenerator";
import SummaryCard from "@/components/summaryCard";
import SavedLogins from "@/components/savedList";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function PasswordPage() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <SummaryCard 
          count={1} 
          title="Security Keys" 
          description="Active security keys" 
          icon={KeyRound} 
          iconColor="text-yellow-400" 
        />
        <SummaryCard 
          count={1} 
          title="Site Scans" 
          description="Recent security scans" 
          icon={Shield} 
          iconColor="text-yellow-400" 
        />
      </div>
      
      <PasswordGenerator />
      
      <Card className="bg-slate-900 border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Saved Logins</CardTitle>
        </CardHeader>
        <SavedLogins />
      </Card>
    </div>
  );
}