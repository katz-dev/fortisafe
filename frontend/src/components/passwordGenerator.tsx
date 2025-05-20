"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, Copy, RefreshCw, Shield, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function PasswordGenerator() {
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState<'weak' | 'okay' | 'strong'>('strong');
  const [isGenerating, setIsGenerating] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Calculate password strength
  const calculateStrength = (pwd: string) => {
    // This is a simple strength calculation for demonstration
    if (pwd.length < 8) return 'weak';

    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

    const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (score < 3) return 'weak';
    if (score === 3) return 'okay';
    return 'strong';
  };

  useEffect(() => {
    // Generate a random password when component mounts
    if (isInitialLoad) {
      generatePasswordSilently();
    }
  }, []);

  useEffect(() => {
    if (password) {
      setStrength(calculateStrength(password));
    }
  }, [password]);

  // Helper function to generate password logic
  const generatePasswordLogic = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_-+=/<>?";

    const allChars = lowercase + uppercase + numbers + special;
    const length = 14;
    let newPassword = "";

    // Ensure at least one character from each category
    newPassword += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    newPassword += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    newPassword += numbers.charAt(Math.floor(Math.random() * numbers.length));
    newPassword += special.charAt(Math.floor(Math.random() * special.length));

    // Fill the rest of the password
    for (let i = 4; i < length; i++) {
      newPassword += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password characters
    return newPassword
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  };

  // Generate password silently (for initial load)
  const generatePasswordSilently = () => {
    setIsGenerating(true);
    const newPassword = generatePasswordLogic();
    
    // Simulate delay for visual effect
    setTimeout(() => {
      setPassword(newPassword);
      setIsGenerating(false);
      setIsInitialLoad(false); // Mark initial load as complete
    }, 500);
  };

  // Generate password with notification (for user-triggered generations)
  const generatePassword = () => {
    setIsGenerating(true);
    const newPassword = generatePasswordLogic();
    
    // Simulate delay for visual effect
    setTimeout(() => {
      setPassword(newPassword);
      setIsGenerating(false);
      toast.success("New password generated");
    }, 500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Password copied to clipboard");

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const getStrengthColor = () => {
    switch (strength) {
      case 'weak': return 'text-red-500';
      case 'okay': return 'text-orange-500';
      case 'strong': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };
  return (
    <Card className="w-full h-[180px] bg-[#0a0f1a] text-white border border-slate-800/60 shadow-lg rounded-xl overflow-hidden hover:border-slate-700/60 transition-all duration-300 backdrop-blur-md">
      <CardContent className="p-6 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <span className="text-gray-100 text-lg font-medium">Password Generator</span>
          </div>
          <div className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            <span className={`text-base font-medium ${getStrengthColor()}`}>
              {strength.charAt(0).toUpperCase() + strength.slice(1)}
            </span>
          </div>
        </div>

        <div className="flex-1 mt-2">
          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3 border border-slate-700/50 shadow-inner">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-base text-gray-300 flex items-center space-x-1"
                >
                  <span>Generating</span>
                  <span className="inline-flex">
                    <motion.span
                      animate={{
                        opacity: [0, 1, 0],
                        transition: { repeat: Infinity, duration: 1 }
                      }}
                    >.</motion.span>
                    <motion.span
                      animate={{
                        opacity: [0, 1, 0],
                        transition: { repeat: Infinity, duration: 1, delay: 0.2 }
                      }}
                    >.</motion.span>
                    <motion.span
                      animate={{
                        opacity: [0, 1, 0],
                        transition: { repeat: Infinity, duration: 1, delay: 0.4 }
                      }}
                    >.</motion.span>
                  </span>
                </motion.div>
              ) : (
                <motion.p
                  key="password"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-base text-white select-all truncate max-w-[180px]"
                >
                  {password}
                </motion.p>)}
            </AnimatePresence>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:bg-slate-700 hover:text-white transition-colors"
                onClick={copyToClipboard}
                disabled={isGenerating}
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:bg-slate-700 hover:text-white transition-colors"
                onClick={generatePassword}
                disabled={isGenerating}
              >
                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Strength indicator */}
          <div className="w-full bg-slate-800/50 rounded-full h-2 mt-4 mb-2">
            <motion.div
              className={`h-2 rounded-full transition-all duration-500 ${strength === 'weak' ? 'bg-red-500 w-1/3' :
                strength === 'okay' ? 'bg-orange-500 w-2/3' :
                  'bg-green-500 w-full'
                }`}
              initial={{ width: 0 }}
              animate={{ width: strength === 'weak' ? '33%' : strength === 'okay' ? '66%' : '100%' }}
              transition={{ duration: 0.5 }}
            ></motion.div>
          </div>
          <p className="text-sm text-gray-400 text-right">Click refresh to generate a new password</p>
        </div>
      </CardContent>
    </Card>
  );
}