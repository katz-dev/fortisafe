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
  securityRiskCount: number;
  total: number;
}

export default function AlternatingCard({ 
  count, 
  title, 
  description, 
  alternateCount,
  alternateTitle,
  alternateDescription,
  securityRiskCount,
  total
}: AlternatingCardProps) {
  const [displayState, setDisplayState] = useState(0); // 0: weak, 1: reused, 2: security risks

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayState((prev) => (prev + 1) % 3);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(timer);
  }, []);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <Card className="w-full h-[180px] bg-gradient-to-br from-[#0a0f1a] to-[#131b2e] text-white border border-slate-800/60 shadow-lg rounded-xl overflow-hidden hover:border-slate-600/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-[1.02] transition-all duration-500 ease-out backdrop-blur-md relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <CardContent className="p-6 h-full flex flex-col justify-between overflow-hidden relative z-10">
        <motion.div 
          className="flex items-center justify-between"
          initial="enter"
          animate="center"
          exit="exit"
          variants={variants}
          transition={{
            x: { type: "spring", stiffness: 400, damping: 25 },
            opacity: { duration: 0.5 },
            layout: { duration: 0.4 }
          }}
          layout
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className={`flex items-center justify-center h-12 w-12 rounded-lg shadow-lg
              transition-all duration-700 ease-out transform hover:rotate-6 hover:scale-110 ${displayState === 0 ? 'bg-gradient-to-br from-red-400 to-red-500' : displayState === 1 ? 'bg-gradient-to-br from-teal-400 to-teal-500' : 'bg-gradient-to-br from-orange-400 to-orange-500'} text-white ring-1 ring-white/10 hover:ring-white/20`}>
              {displayState === 0 ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V12M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : displayState === 1 ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 8L15 12H18C18 15.3137 15.3137 18 12 18C10.9071 18 9.89002 17.7024 9 17.1779M5 16L9 12H6C6 8.68629 8.68629 6 12 6C13.0929 6 14.11 6.29765 15 6.82209" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15H12.01M12 12V9M4.98207 19H19.0179C20.5615 19 21.5233 17.3333 20.7551 16L13.7372 4C12.9689 2.66667 11.0311 2.66667 10.2628 4L3.24485 16C2.47666 17.3333 3.43849 19 4.98207 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </motion.div>
            <motion.span 
              className="text-gray-200 text-lg font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1]
              }}>
              {displayState === 0 ? title : displayState === 1 ? alternateTitle : "Security Risks"}
            </motion.span>
          </div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 15,
              delay: 0.2
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">
              {displayState === 0 ? count : displayState === 1 ? alternateCount : securityRiskCount}
            </span>
          </motion.div>
        </motion.div>
        <div className="mt-3">
          <p className="text-base text-gray-300 font-medium tracking-wide">
            {displayState === 0 ? description : displayState === 1 ? alternateDescription : "Unsafe URLs and compromised passwords"}
          </p>

          <div className="mt-5 w-full bg-slate-800/50 h-2.5 rounded-full overflow-hidden ring-1 ring-white/5 relative">
            <motion.div
              className={`h-full ${displayState === 0 ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-500' : displayState === 1 ? 'bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500' : 'bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500'}`}
              style={{
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)'
              }}
              initial={false}
              animate={{ 
                width: total > 0 ? `${Math.min(
                  ((displayState === 0 ? count : displayState === 1 ? alternateCount : securityRiskCount) / total) * 100, 
                  100
                )}%` : '0%'
              }}
              transition={{
                duration: 0.8,
                ease: 'easeOut'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"/>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
