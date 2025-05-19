"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import SummaryCard from "@/components/summaryCard";
import PasswordGenerator from "@/components/passwordGenerator";
import SavedLogins from "@/components/savedList";
import PageLayout from "@/components/PageLayout";
import SearchBar from "@/components/password/SearchBar";
import FilterTabs from "@/components/password/FilterTabs";
import PasswordDetailView from "@/components/password/PasswordDetailView";
import AddPasswordButton from "@/components/password/AddPasswordButton";
import { Plus } from "lucide-react";
import { getAllPasswords, getDecryptedPassword, LoginItem, calculatePasswordStrength } from "@/lib/passwordService";
import { toast } from "sonner";

export default function PasswordVaultPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedLogins, setSavedLogins] = useState<LoginItem[]>([]);
  const [selectedLogin, setSelectedLogin] = useState<LoginItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weakPasswordCount, setWeakPasswordCount] = useState(0);

  // Fetch password function that can be reused
  const fetchPasswords = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllPasswords();

      // Process each password to get decrypted values and strength
      const processedData = await Promise.all(
        data.map(async (login) => {
          try {
            // Get the actual password
            const decryptedPassword = await getDecryptedPassword(login.id);
            // Calculate strength based on the real password
            const strength = calculatePasswordStrength(decryptedPassword);

            return {
              ...login,
              password: decryptedPassword,
              strength,
            };
          } catch (error) {
            console.error(`Error processing password ${login.id}:`, error);
            return login;
          }
        })
      );

      setSavedLogins(processedData);

      // Calculate weak password count
      const weakCount = processedData.filter(p => p.strength === 'weak').length;
      setWeakPasswordCount(weakCount);

      // Set the first login as selected if data exists
      if (processedData.length > 0 && !selectedLogin) {
        setSelectedLogin(processedData[0]);
      }
    } catch (error) {
      console.error('Error loading saved logins:', error);
      toast.error('Failed to load passwords. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLogin]);

  // Load saved logins from backend API
  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords]);

  // Filter logins based on active tab and search term
  const filteredLogins = savedLogins.filter(login => {
    // First filter by tab
    if (activeTab === "weak" && login.strength !== "weak") return false;
    if (activeTab === "reused") {
      // Count duplicates by username
      const duplicateUsernames = savedLogins.filter(
        l => l.username === login.username && l.site !== login.site
      );
      if (duplicateUsernames.length === 0) return false;
    }
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

  const handleAddPassword = () => {
    // This will be implemented with modal or navigation
    console.log("Add password clicked");
  };

  const handleDeletePassword = (id: string) => {
    // Remove the deleted password from the state
    const updatedLogins = savedLogins.filter(login => login.id !== id);
    setSavedLogins(updatedLogins);
    
    // If the deleted password was selected, select another one
    if (selectedLogin && selectedLogin.id === id) {
      if (updatedLogins.length > 0) {
        setSelectedLogin(updatedLogins[0]);
      } else {
        setSelectedLogin(null);
      }
    }
    
    // Update weak password count
    const weakCount = updatedLogins.filter(p => p.strength === 'weak').length;
    setWeakPasswordCount(weakCount);
  };

  return (
    <PageLayout className="h-screen flex flex-col bg-[#070b14]">
      {/* Page content wrapper - take full height */}
      <div className="flex-1 flex flex-col w-full px-4 sm:px-6 md:px-8 py-4">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Password Vault</h1>
          <p className="text-gray-400">Manage and secure your passwords in one place</p>
        </div>

        {/* Summary Cards */}        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Vault Summary Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <SummaryCard
              count={savedLogins.length || 0}
              title="Vault Summary"
              description="Saved logins"
              icon={() => (
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15V17M6 9V7C6 5.4087 6.63214 3.88258 7.75736 2.75736C8.88258 1.63214 10.4087 1 12 1C13.5913 1 15.1174 1.63214 16.2426 2.75736C17.3679 3.88258 18 5.4087 18 7V9M6 9H18M6 9C5.46957 9 4.96086 9.21071 4.58579 9.58579C4.21071 9.96086 4 10.4696 4 11V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V11C20 10.4696 19.7893 9.96086 19.4142 9.58579C19.0391 9.21071 18.5304 9 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              iconColor="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
            />
          </motion.div>          {/* Weak Passwords Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <SummaryCard
              count={weakPasswordCount}
              title="Weak Passwords"
              description="Security risks"
              icon={() => (
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M20.6179 5.98434C20.4132 5.99472 20.2072 5.99997 20 5.99997C16.9265 5.99997 14.123 4.84453 11.9999 2.94434C9.87691 4.84446 7.07339 5.99985 4 5.99985C3.79277 5.99985 3.58678 5.9946 3.38213 5.98422C3.1327 6.94783 3 7.95842 3 9.00001C3 14.5915 6.82432 19.2898 12 20.622C17.1757 19.2898 21 14.5915 21 9.00001C21 7.95847 20.8673 6.94791 20.6179 5.98434Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              iconColor="bg-gradient-to-br from-red-400 to-red-600 text-white"
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
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* Tabs and Add Button */}
        <div className="flex items-center justify-between mb-5">
          <FilterTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <AddPasswordButton onClick={handleAddPassword} />
        </div>        {/* Content Area - Flex-1 to take remaining height */}
        <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">          {/* Left Sidebar - Logins List */}
          <div className="col-span-12 md:col-span-5 lg:col-span-4 flex flex-col h-full">
            <div className="bg-[#0a0f1a] border border-slate-800/60 rounded-xl overflow-hidden shadow-lg h-full backdrop-blur-md">
              <SavedLogins
                logins={filteredLogins}
                onSelectLogin={setSelectedLogin}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Right Content - Password Details */}          <div className="col-span-12 md:col-span-7 lg:col-span-8 flex flex-col h-full">            {selectedLogin ? (
            <PasswordDetailView 
              login={selectedLogin} 
              onDelete={handleDeletePassword}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-[#0a0f1a] border border-slate-800/60 rounded-xl p-6 shadow-lg backdrop-blur-md">
              <div className="text-center">
                <div className="rounded-full bg-gradient-to-br from-slate-800/60 to-slate-800/40 p-4 mx-auto mb-5 w-16 h-16 flex items-center justify-center shadow-lg border border-slate-700/30">
                  <Plus className="h-7 w-7 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No password selected</h3>
                <p className="text-gray-400 max-w-md">
                  Select a password from the list or add a new one to view details
                </p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        body, html {
          background-color: #070b14;
        }
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
