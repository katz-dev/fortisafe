"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState } from "react";
import { Loader2, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoginItem {
  id: string;
  site: string;
  username: string;
  password: string;
  strength: "weak" | "okay" | "strong";
  website?: string;
  notes?: string;
}

interface SavedLoginsProps {
  logins: LoginItem[];
  onSelectLogin: (login: LoginItem) => void;
  isLoading?: boolean;
}

export default function SavedLogins({
  logins,
  onSelectLogin,
  isLoading = false,
}: SavedLoginsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (login: LoginItem) => {
    setSelectedId(login.id);
    onSelectLogin(login);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your passwords...</p>
        </div>
      </div>
    );
  }

  if (logins.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="rounded-full bg-slate-800/80 p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <rect
                width="18"
                height="11"
                x="3"
                y="11"
                rx="2"
                ry="2"
              ></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No passwords found
          </h3>
          <p className="text-gray-400 max-w-md">
            Start adding your passwords to keep them secure and easily accessible
          </p>
        </div>
      </div>
    );
  } return (
    <Card className="w-full h-full bg-[#0a0f1a] text-white border-none shadow-md">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="p-3 border-b border-slate-800/60 bg-[#0a0f1a]/90 backdrop-blur-sm sticky top-0 z-10">
          <h3 className="font-semibold text-white flex items-center">
            <Key className="h-4 w-4 mr-2 text-indigo-400" />
            Your Passwords
            <span className="ml-2 text-xs py-0.5 px-2 bg-slate-800/70 rounded-full text-gray-400">
              {logins.length}
            </span>
          </h3>
        </div>
        <ScrollArea className="flex-1 h-[calc(100vh-340px)] md:h-[480px]]">
          <div>
            <AnimatePresence>
              {logins.map((login) => (
                <motion.div
                  key={login.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center p-3 hover:bg-slate-800/50 cursor-pointer transition-all duration-200 ${selectedId === login.id ? 'bg-slate-800/70 border-l-2 border-indigo-500' : ''}`}
                  onClick={() => handleSelect(login)}
                >
                  <div className="h-10 w-10 rounded-md mr-3 flex items-center justify-center overflow-hidden shadow-md">
                    <WebsiteIcon siteName={login.site} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{login.site}</p>
                    <p className="text-gray-400 text-sm truncate">{login.username}</p>
                  </div>
                  {login.strength === 'weak' && (
                    <div className="ml-2 p-1 rounded-full bg-red-900/30 border border-red-700/50">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// WebsiteIcon component that displays the first letter of the website
function WebsiteIcon({ siteName }: { siteName: string }) {
  // Get the first letter and convert to uppercase
  const firstLetter = siteName.charAt(0).toUpperCase();

  // Generate a consistent color based on the site name
  const getColor = (name: string) => {
    // Simple hash function to generate a consistent number from a string
    const hash = name.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    // List of attractive background colors
    const colors = [
      { bg: "#4285F4", text: "#FFFFFF" }, // Google Blue
      { bg: "#EA4335", text: "#FFFFFF" }, // Google Red
      { bg: "#FBBC05", text: "#000000" }, // Google Yellow
      { bg: "#34A853", text: "#FFFFFF" }, // Google Green
      { bg: "#7B1FA2", text: "#FFFFFF" }, // Purple
      { bg: "#1976D2", text: "#FFFFFF" }, // Blue
      { bg: "#C2185B", text: "#FFFFFF" }, // Pink
      { bg: "#388E3C", text: "#FFFFFF" }, // Green
      { bg: "#F57C00", text: "#FFFFFF" }, // Orange
      { bg: "#0097A7", text: "#FFFFFF" }, // Teal
    ];

    // Use the hash to select a color
    const colorIndex = hash % colors.length;
    return colors[colorIndex];
  };

  const color = getColor(siteName);

  return (
    <div
      style={{
        backgroundColor: color.bg,
        color: color.text,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '16px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }}
    >
      {firstLetter}
    </div>
  );
}