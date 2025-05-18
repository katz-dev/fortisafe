"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, Copy, RefreshCw, Shield, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function PasswordGenerator() {
  const [password, setPassword] = useState("/L-76+7e1rGj");
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState<'weak' | 'okay' | 'strong'>('strong');
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate password strength
  const calculateStrength = (pwd: string) => {
    // This is a simple strength calculation for demonstration
    if (pwd.length < 8) return 'weak';

    let hasLower = /[a-z]/.test(pwd);
    let hasUpper = /[A-Z]/.test(pwd);
    let hasNumber = /[0-9]/.test(pwd);
    let hasSpecial = /[^A-Za-z0-9]/.test(pwd);

    let score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (score < 3) return 'weak';
    if (score === 3) return 'okay';
    return 'strong';
  };

  useEffect(() => {
    setStrength(calculateStrength(password));
  }, [password]);

  const generatePassword = () => {
    setIsGenerating(true);

    // Here you would implement your password generation logic
    // This is a simple example that creates a random string
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
    newPassword = newPassword
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

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
    <Card className="w-full bg-slate-900/80 backdrop-blur-sm text-white border border-slate-800 shadow-xl rounded-xl overflow-hidden hover:bg-slate-900 transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
              <KeyRound className="h-5 w-5 text-white" />
            </div>
            <span className="text-gray-100 font-medium">Password Generator</span>
          </div>
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-1.5" />
            <span className={`text-sm font-medium ${getStrengthColor()}`}>
              {strength.charAt(0).toUpperCase() + strength.slice(1)}
            </span>
          </div>
        </div>

        <motion.div
          className="relative flex items-center justify-between rounded-lg bg-slate-800/70 backdrop-blur-sm px-4 py-3 border border-slate-700 shadow-inner mb-3"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-mono text-md text-gray-300 flex items-center space-x-1"
              >
                <span>Generating</span>
                <span className="inline-flex">
                  <motion.span
                    animate={{
                      opacity: [0, 1, 0],
                      transition: { repeat: Infinity, duration: 1.5 }
                    }}
                  >.</motion.span>
                  <motion.span
                    animate={{
                      opacity: [0, 1, 0],
                      transition: { repeat: Infinity, duration: 1.5, delay: 0.2 }
                    }}
                  >.</motion.span>
                  <motion.span
                    animate={{
                      opacity: [0, 1, 0],
                      transition: { repeat: Infinity, duration: 1.5, delay: 0.4 }
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
                className="font-mono text-md text-white select-all"
              >
                {password}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex gap-1">
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
        </motion.div>

        {/* Strength indicator */}
        <div className="w-full bg-slate-800/50 rounded-full h-1.5 mb-1">
          <motion.div
            className={`h-1.5 rounded-full transition-all duration-500 ${strength === 'weak' ? 'bg-red-500 w-1/3' :
                strength === 'okay' ? 'bg-orange-500 w-2/3' :
                  'bg-green-500 w-full'
              }`}
            initial={{ width: 0 }}
            animate={{ width: strength === 'weak' ? '33%' : strength === 'okay' ? '66%' : '100%' }}
            transition={{ duration: 0.5 }}
          ></motion.div>
        </div>
        <p className="text-xs text-gray-400 text-right">Click refresh to generate a new secure password</p>
      </CardContent>
    </Card>
  );
}