"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface AlternatingCardProps {
  count: number;
  title: string;
  description: string;
  alternateCount: number;
  alternateTitle: string;
  alternateDescription: string;
  icon: React.ElementType;
  iconColor?: string;
}

export default function AlternatingCard({ 
  count, 
  title, 
  description, 
  alternateCount,
  alternateTitle,
  alternateDescription,
  icon: Icon, 
  iconColor = "bg-gradient-to-br from-indigo-400 to-indigo-600 text-white" 
}: AlternatingCardProps) {
  const [isAlternate, setIsAlternate] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAlternate(prev => !prev);
    }, 1000); // 1 second

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full h-[180px] bg-[#0a0f1a] text-white border border-slate-800/60 shadow-lg rounded-xl overflow-hidden hover:border-slate-700/60 transition-all duration-300 backdrop-blur-md">
      <CardContent className="p-6 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center h-12 w-12 rounded-lg shadow-lg ${iconColor}`}>
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-gray-200 text-lg font-medium">
              {isAlternate ? alternateTitle : title}
            </span>
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
              {isAlternate ? alternateCount : count}
            </span>
          </motion.div>
        </div>
        <div className="mt-3">
          <p className="text-base text-gray-300 font-medium tracking-wide">
            {isAlternate ? alternateDescription : description}
          </p>

          <div className="mt-5 w-full bg-slate-800/50 h-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (isAlternate ? alternateCount : count) * 10)}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
