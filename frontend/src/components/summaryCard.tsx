"use client";

import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  count: number;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor?: string;  // Added optional iconColor prop
}

export default function SummaryCard({ count, title, description, icon: Icon, iconColor = "text-black" }: SummaryCardProps) {
  return (
    <Card className="w-full bg-slate-900 text-white border-none shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-full">
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <span className="text-gray-300 text-sm">{title}</span>
        </div>
        <p className="mt-3 text-xl font-medium text-white">{count} {description}</p>
      </CardContent>
    </Card>
  );
}