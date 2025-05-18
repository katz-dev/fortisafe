"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface SummaryCardProps {
  count: number;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor?: string;
}

export default function SummaryCard({ count, title, description, icon: Icon, iconColor = "bg-gradient-to-br from-indigo-400 to-indigo-600 text-white" }: SummaryCardProps) {
  return (
    <Card className="w-full bg-slate-900/80 text-white border border-slate-800 shadow-lg rounded-xl overflow-hidden backdrop-blur-sm hover:bg-slate-900 transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center h-10 w-10 rounded-lg shadow-md ${iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-gray-200 font-medium">{title}</span>
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
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              {count}
            </span>
          </motion.div>
        </div>
        <p className="mt-4 text-sm text-gray-400">{description}</p>

        {/* Add a subtle progress/status indicator */}
        <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, count * 10)}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </CardContent>
    </Card>
  );
}