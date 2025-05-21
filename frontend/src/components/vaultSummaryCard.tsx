"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface VaultSummaryCardProps {
  count: number;
  icon: React.ElementType;
  iconColor?: string;
}

export default function VaultSummaryCard({ 
  count, 
  icon: Icon, 
  iconColor = "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white" 
}: VaultSummaryCardProps) {
  return (
    <Card className="w-full h-[180px] bg-[#0a0f1a] text-white border border-slate-800/60 shadow-lg rounded-xl overflow-hidden hover:border-slate-700/60 transition-all duration-300 backdrop-blur-md">
      <CardContent className="p-6 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center h-12 w-12 rounded-lg shadow-lg ${iconColor}`}>
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-gray-200 text-lg font-medium">Vault Summary</span>
          </div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1
            }}
          >
            <span className="text-3xl font-bold text-white">
              {count}
            </span>
          </motion.div>
        </div>
        <div className="mt-3">
          <p className="text-base text-gray-300 font-medium tracking-wide">Total saved passwords</p>
        </div>
      </CardContent>
    </Card>
  );
}
