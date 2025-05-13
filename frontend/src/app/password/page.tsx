"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, EyeOff, Copy, Check, AlertTriangle } from "lucide-react";
import SummaryCard from "@/components/summaryCard";
import PasswordGenerator from "@/components/passwordGenerator";
import SavedLogins from "@/components/savedList";
import PageLayout from "@/components/PageLayout";
import { motion } from "framer-motion";
import { Tooltip } from "@/components/ui/tooltip";

// Types
interface LoginItem {
  id: string;
  site: string;
  username: string;
  password: string;
  strength: 'weak' | 'okay' | 'strong';
  website?: string;
  notes?: string;
}

export default function FortisafeDashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedLogins, setSavedLogins] = useState<LoginItem[]>([]);
  const [selectedLogin, setSelectedLogin] = useState<LoginItem | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load saved logins from JSON
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/saved-logins.json');
        const data = await response.json();
        setSavedLogins(data);
        if (data.length > 0) {
          setSelectedLogin(data[0]);
        }
      } catch (error) {
        console.error('Error loading saved logins:', error);
        // Fallback data
        const fallbackData: LoginItem[] = [
          { id: '1', site: 'Google', username: 'john@katz .com', password: 'Str0ngP@ssw0rd!', strength: 'strong', website: 'Google.com' },
          { id: '2', site: 'Google', username: 'john@toxic.com', password: 'weak123', strength: 'weak', website: 'Google.com' },
          { id: '3', site: 'Google', username: 'john@toxic.com', password: 'OkayP@ss', strength: 'okay', website: 'Google.com' },
          { id: '4', site: 'Google', username: 'john@toxic.com', password: 'StrongP@ss123!', strength: 'strong', website: 'Google.com' },
          { id: '5', site: 'Google', username: 'john@toxic.com', password: '123456', strength: 'weak', website: 'Google.com' },
        ];
        setSavedLogins(fallbackData);
        setSelectedLogin(fallbackData[0]);
      }
    };

    fetchData();
  }, []);

  // Filter logins based on active tab and search term
  const filteredLogins = savedLogins.filter(login => {
    // First filter by tab
    if (activeTab === "weak" && login.strength !== "weak") return false;
    if (activeTab === "reused" && login.username !== "john@toxic.com") return false; // Just for demo, we'd need real reused detection
    if (activeTab === "security" && login.strength !== "weak") return false;

    // Then filter by search term
    if (searchTerm) {
      return (
        login.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
        login.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return true;
  });

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500';
      case 'okay':
        return 'bg-orange-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStrengthWidth = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'w-1/3';
      case 'okay':
        return 'w-2/3';
      case 'strong':
        return 'w-full';
      default:
        return 'w-0';
    }
  };

  const getStrengthText = (strength: string) => {
    return strength.charAt(0).toUpperCase() + strength.slice(1);
  };

  const handleCopyPassword = () => {
    if (selectedLogin) {
      navigator.clipboard.writeText(selectedLogin.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getIssueText = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'This password is too weak. Consider using a stronger password with a mix of uppercase, lowercase, numbers, and special characters.';
      case 'okay':
        return 'This password could be stronger. Try adding more variety of characters or increasing its length.';
      case 'strong':
        return 'Great job! This password is strong and secure.';
      default:
        return 'Unable to determine password strength.';
    }
  };

  return (
    <PageLayout className="h-screen flex flex-col">
      {/* Page content wrapper - take full height */}
      <div className="flex-1 flex flex-col w-full px-4 sm:px-6 md:px-8 py-4">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Password Vault</h1>
          <p className="text-gray-400">Manage and secure your passwords in one place</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Vault Summary Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <SummaryCard
              count={savedLogins.length || 18}
              title="Vault Summary"
              description="Saved logins"
              icon={() => (
                <svg className="h-5 w-5 text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15V17M6 9V7C6 5.4087 6.63214 3.88258 7.75736 2.75736C8.88258 1.63214 10.4087 1 12 1C13.5913 1 15.1174 1.63214 16.2426 2.75736C17.3679 3.88258 18 5.4087 18 7V9M6 9H18M6 9C5.46957 9 4.96086 9.21071 4.58579 9.58579C4.21071 9.96086 4 10.4696 4 11V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V11C20 10.4696 19.7893 9.96086 19.4142 9.58579C19.0391 9.21071 18.5304 9 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              iconColor="bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900"
            />
          </motion.div>

          {/* Site Scans Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <SummaryCard
              count={5}
              title="Site scans"
              description="Threats blocked"
              icon={() => (
                <svg className="h-5 w-5 text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M20.6179 5.98434C20.4132 5.99472 20.2072 5.99997 20 5.99997C16.9265 5.99997 14.123 4.84453 11.9999 2.94434C9.87691 4.84446 7.07339 5.99985 4 5.99985C3.79277 5.99985 3.58678 5.9946 3.38213 5.98422C3.1327 6.94783 3 7.95842 3 9.00001C3 14.5915 6.82432 19.2898 12 20.622C17.1757 19.2898 21 14.5915 21 9.00001C21 7.95847 20.8673 6.94791 20.6179 5.98434Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              iconColor="bg-gradient-to-br from-blue-300 to-blue-500 text-blue-900"
            />
          </motion.div>

          {/* Password Generator */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <PasswordGenerator />
          </motion.div>
        </div>

        {/* Search */}
        <div className="relative mb-5 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
          <div className="relative bg-slate-900 rounded-lg shadow-xl">
            <Input
              placeholder="Search passwords, sites, or usernames..."
              className="bg-slate-900 border border-slate-700 rounded-lg text-white w-full pl-10 pr-10 py-6 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 h-8 w-8 hover:text-gray-200"
                onClick={() => setSearchTerm("")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex overflow-x-auto pb-2 hide-scrollbar space-x-2">
            <motion.button
              whileHover={{ y: -2 }}
              className={`flex items-center rounded-lg px-4 py-3 transition-all duration-200 ${activeTab === "all"
                ? "bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-lg border border-indigo-700"
                : "text-gray-400 hover:text-gray-300 bg-slate-900 border border-slate-800 hover:border-slate-700"
                }`}
              onClick={() => setActiveTab("all")}
            >
              <span className="flex items-center justify-center w-6 h-6 mr-2 rounded-md bg-amber-500 text-black">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12V19M12 19L9 16M12 19L15 16M19 6V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              All
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              className={`flex items-center rounded-lg px-4 py-3 transition-all duration-200 ${activeTab === "reused"
                ? "bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-lg border border-indigo-700"
                : "text-gray-400 hover:text-gray-300 bg-slate-900 border border-slate-800 hover:border-slate-700"
                }`}
              onClick={() => setActiveTab("reused")}
            >
              <span className="flex items-center justify-center w-6 h-6 mr-2 rounded-md bg-teal-500 text-black">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 8L15 12H18C18 15.3137 15.3137 18 12 18C10.9071 18 9.89002 17.7024 9 17.1779M5 16L9 12H6C6 8.68629 8.68629 6 12 6C13.0929 6 14.11 6.29765 15 6.82209" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Reused
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              className={`flex items-center rounded-lg px-4 py-3 transition-all duration-200 ${activeTab === "weak"
                ? "bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-lg border border-indigo-700"
                : "text-gray-400 hover:text-gray-300 bg-slate-900 border border-slate-800 hover:border-slate-700"
                }`}
              onClick={() => setActiveTab("weak")}
            >
              <span className="flex items-center justify-center w-6 h-6 mr-2 rounded-md bg-yellow-600 text-black">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V12M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Weak
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              className={`flex items-center rounded-lg px-4 py-3 transition-all duration-200 ${activeTab === "security"
                ? "bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-lg border border-indigo-700"
                : "text-gray-400 hover:text-gray-300 bg-slate-900 border border-slate-800 hover:border-slate-700"
                }`}
              onClick={() => setActiveTab("security")}
            >
              <span className="flex items-center justify-center w-6 h-6 mr-2 rounded-md bg-orange-500 text-black">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15H12.01M12 12V9M4.98207 19H19.0179C20.5615 19 21.5233 17.3333 20.7551 16L13.7372 4C12.9689 2.66667 11.0311 2.66667 10.2628 4L3.24485 16C2.47666 17.3333 3.43849 19 4.98207 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Security risks
            </motion.button>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-500/25 transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              Add password
            </Button>
          </motion.div>
        </div>

        {/* Content Area - Flex-1 to take remaining height */}
        <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
          {/* Left Sidebar - Logins List */}
          <div className="col-span-12 md:col-span-5 lg:col-span-4 flex flex-col">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl h-full">
              <SavedLogins logins={filteredLogins} onSelectLogin={setSelectedLogin} />
            </div>
          </div>

          {/* Right Content - Password Details */}
          {selectedLogin && (
            <div className="col-span-12 md:col-span-7 lg:col-span-8 flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <Card className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden h-full flex flex-col">
                  <CardContent className="p-0 flex-1 flex flex-col">
                    {/* Header with site logo and info */}
                    <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="h-14 w-14 rounded-xl bg-white mr-4 flex items-center justify-center shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-white">{selectedLogin.site}</h2>
                            <p className="text-gray-400">{selectedLogin.username}</p>
                          </div>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button className="bg-white hover:bg-gray-100 text-indigo-800 shadow-lg">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            Edit
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-gray-400 text-sm font-medium">Username</label>
                          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <p className="text-white">{selectedLogin.username}</p>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-slate-700">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-gray-400 text-sm font-medium">Website</label>
                          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <p className="text-white">{selectedLogin.website || 'Google.com'}</p>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-slate-700">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" x2="21" y1="14" y2="3"></line>
                              </svg>
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-gray-400 text-sm font-medium flex items-center">
                          Password
                          {selectedLogin.strength === 'weak' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-300">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Weak
                            </span>
                          )}
                        </label>
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                          <p className="text-white font-mono">{showPassword ? selectedLogin.password : '••••••••••'}</p>
                          <div className="flex">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mr-1 text-gray-400 hover:text-white hover:bg-slate-700"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 hover:text-white hover:bg-slate-700"
                              onClick={handleCopyPassword}
                            >
                              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Password Strength Indicator */}
                        <div className="mt-2">
                          <div className="w-full bg-slate-800 rounded-full h-2 mb-1.5">
                            <div
                              className={`h-2 rounded-full ${getStrengthColor(selectedLogin.strength)} ${getStrengthWidth(selectedLogin.strength)} transition-all duration-500`}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-400">Password strength: <span className={
                            selectedLogin.strength === 'strong' ? 'text-green-400' :
                              selectedLogin.strength === 'okay' ? 'text-orange-400' :
                                'text-red-400'
                          }>{getStrengthText(selectedLogin.strength)}</span></p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-gray-400 text-sm font-medium flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" x2="12" y1="8" y2="12"></line>
                            <line x1="12" x2="12.01" y1="16" y2="16"></line>
                          </svg>
                          Security Analysis
                        </label>
                        <div className={`bg-slate-800 rounded-lg p-4 border ${selectedLogin.strength === 'strong' ? 'border-green-700' :
                          selectedLogin.strength === 'okay' ? 'border-orange-700' :
                            'border-red-700'
                          }`}>
                          <div className="flex items-start">
                            {selectedLogin.strength === 'strong' ? (
                              <div className="mr-3 bg-green-900 text-green-300 p-1.5 rounded-full">
                                <Check className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="mr-3 bg-red-900 text-red-300 p-1.5 rounded-full">
                                <AlertTriangle className="h-4 w-4" />
                              </div>
                            )}
                            <p className="text-sm text-gray-300">
                              {getIssueText(selectedLogin.strength)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </PageLayout>
  );
}