"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import AlternatingCard from "@/components/alternatingCard";
import VaultSummaryCard from "@/components/vaultSummaryCard";
import PasswordGenerator from "@/components/passwordGenerator";
import SavedLogins from "@/components/savedList";
import PageLayout from "@/components/PageLayout";
import SearchBar from "@/components/password/SearchBar";
import FilterTabs from "@/components/password/FilterTabs";
import PasswordDetailView from "@/components/password/PasswordDetailView";
import AddPasswordButton from "@/components/password/AddPasswordButton";
import AddPasswordForm from "@/components/password/AddPasswordForm";
import ReusedPasswordsView from "@/components/password/ReusedPasswordsView";
import WebsitePasswordsView from "@/components/password/WebsitePasswordsView";
import { Plus } from "lucide-react";
import { getAllPasswords, getDecryptedPassword, LoginItem, calculatePasswordStrength, checkSecurityRisks } from "@/lib/passwordService";
import { toast } from "sonner";
import { useSecurityContext } from "../contexts/security-context";

export default function PasswordVaultPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedLogins, setSavedLogins] = useState<LoginItem[]>([]);
  const [selectedLogin, setSelectedLogin] = useState<LoginItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weakPasswordCount, setWeakPasswordCount] = useState(0);
  const [reusedPasswordCount, setReusedPasswordCount] = useState(0);
  const [reusedPasswordIds, setReusedPasswordIds] = useState<Set<string>>(new Set());
  const [securityRiskCount, setSecurityRiskCount] = useState(0);
  const [compromisedPasswordCount, setCompromisedPasswordCount] = useState(0);
  const [isAddPasswordModalOpen, setIsAddPasswordModalOpen] = useState(false);
  
  // Get the security context to trigger refreshes
  const { refreshSecurityData } = useSecurityContext();

  // Fetch password function that can be reused
  const fetchPasswords = useCallback(async () => {
    setIsLoading(true);
    try {
      const passwords = await getAllPasswords();
      
      // Count security metrics
      let weakCount = 0;
      let securityRiskCount = 0;
      let compromisedCount = 0;
      const reusedIds = new Set<string>();
      
      // Process each password
      for (const password of passwords) {
        try {
          // Decrypt the password to calculate strength
          const decryptedPassword = await getDecryptedPassword(password.id);
          password.password = decryptedPassword;
          password.strength = calculatePasswordStrength(decryptedPassword);
          
          // Count weak passwords
          if (password.strength === "weak") {
            weakCount++;
          }
          
          // Count compromised passwords
          if (password.isCompromised) {
            compromisedCount++;
            
            // Set the compromiseInfo for UI compatibility
            if (!password.compromiseInfo) {
              password.compromiseInfo = {
                isCompromised: password.isCompromised,
                breachCount: password.breachCount || 0
              };
            }
          }
          
          // Count unsafe URLs
          if (password.isUrlUnsafe) {
            securityRiskCount++;
            
            // Set the securityRisk for UI compatibility
            if (!password.securityRisk) {
              password.securityRisk = {
                isSafe: !password.isUrlUnsafe,
                threatTypes: password.urlThreatTypes
              };
            }
          }
          
          // Track reused passwords
          if (password.isReused) {
            reusedIds.add(password.id);
          }
        } catch (error) {
          console.error(`Error processing password ${password.id}:`, error);
        }
      }
      
      // Update state with the processed passwords
      setSavedLogins(passwords);
      setWeakPasswordCount(weakCount);
      setReusedPasswordCount(reusedIds.size);
      setReusedPasswordIds(reusedIds);
      setSecurityRiskCount(securityRiskCount);
      setCompromisedPasswordCount(compromisedCount);
    } catch (error) {
      console.error("Error fetching passwords:", error);
      toast.error("Failed to fetch passwords");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to fetch passwords on component mount
  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords]);

  // Filter passwords based on active tab and search term
  const filteredPasswords = savedLogins.filter((login) => {
    const matchesSearch =
      login.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      login.username.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeTab) {
      case "all":
        return true;
      case "weak":
        return login.strength === "weak";
      case "secure":
        return login.strength === "strong";
      case "reused":
        // Use the isReused field from the API
        return login.isReused === true;
      case "security":
        // Use the isUrlUnsafe and isCompromised fields from the API
        return login.isUrlUnsafe === true || login.isCompromised === true;
      default:
        return true;
    }
  });

  const handleAddPassword = () => {
    setIsAddPasswordModalOpen(true);
  };
  
  const handlePasswordAdded = async (newPassword: LoginItem) => {
    // Add the new password to the list
    setSavedLogins(prevLogins => [newPassword, ...prevLogins]);
    
    // Update weak password count if needed
    if (newPassword.strength === 'weak') {
      setWeakPasswordCount(prevCount => prevCount + 1);
    }
    
    // Perform security checks on the new password
    try {
      // The backend will automatically check for compromised passwords and unsafe URLs
      // during creation, but we'll perform a scan to get the results for immediate UI update
      const securityResult = await checkSecurityRisks(
        newPassword.url,
        newPassword.password,
        newPassword.id
      );
      
      // Update the password with security information
      if (securityResult.markedPasswords && securityResult.markedPasswords.length > 0) {
        const markedPassword = securityResult.markedPasswords.find(p => p.id === newPassword.id);
        if (markedPassword) {
          // Update the password with security information
          newPassword.isCompromised = markedPassword.isCompromised;
          newPassword.breachCount = markedPassword.breachCount;
          newPassword.isUrlUnsafe = markedPassword.isUrlUnsafe;
          newPassword.urlThreatTypes = markedPassword.urlThreatTypes;
          newPassword.isReused = markedPassword.isReused;
          newPassword.reusedIn = markedPassword.reusedIn;
          
          // Update UI-specific fields for backward compatibility
          if (markedPassword.isCompromised) {
            newPassword.compromiseInfo = {
              isCompromised: markedPassword.isCompromised,
              breachCount: markedPassword.breachCount || 0
            };
            setCompromisedPasswordCount(prevCount => prevCount + 1);
          }
          
          if (markedPassword.isUrlUnsafe) {
            newPassword.securityRisk = {
              isSafe: !markedPassword.isUrlUnsafe,
              threatTypes: markedPassword.urlThreatTypes
            };
            setSecurityRiskCount(prevCount => prevCount + 1);
          }
          
          if (markedPassword.isReused) {
            // Update reused password IDs
            const newReusedIds = new Set(reusedPasswordIds);
            newReusedIds.add(newPassword.id);
            setReusedPasswordIds(newReusedIds);
            setReusedPasswordCount(newReusedIds.size);
          }
        }
      }
      
      // Update the saved logins with the updated password
      setSavedLogins(prevLogins => {
        return prevLogins.map(p => p.id === newPassword.id ? newPassword : p);
      });
    } catch (error) {
      console.error('Error checking security for new password:', error);
    }
    
    // Select the newly added password
    setSelectedLogin(newPassword);
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
    
    // Update reused password IDs
    const newReusedIds = new Set(reusedPasswordIds);
    newReusedIds.delete(id);
    setReusedPasswordIds(newReusedIds);
    setReusedPasswordCount(newReusedIds.size);
  };
  
  const handleUpdatePassword = async (updatedPassword: LoginItem) => {
    // Perform security checks on the updated password first
    try {
      // The backend will automatically check for compromised passwords and unsafe URLs
      // during update, but we'll perform a scan to get the results for immediate UI update
      const securityResult = await checkSecurityRisks(
        updatedPassword.url,
        updatedPassword.password,
        updatedPassword.id
      );
      
      // Update the password with security information
      if (securityResult.markedPasswords && securityResult.markedPasswords.length > 0) {
        const markedPassword = securityResult.markedPasswords.find(p => p.id === updatedPassword.id);
        if (markedPassword) {
          // Track previous security state to update counts
          const wasCompromised = updatedPassword.isCompromised || false;
          const wasUrlUnsafe = updatedPassword.isUrlUnsafe || false;
          const wasReused = updatedPassword.isReused || false;
          
          // Update the password with security information
          updatedPassword.isCompromised = markedPassword.isCompromised;
          updatedPassword.breachCount = markedPassword.breachCount;
          updatedPassword.isUrlUnsafe = markedPassword.isUrlUnsafe;
          updatedPassword.urlThreatTypes = markedPassword.urlThreatTypes;
          updatedPassword.isReused = markedPassword.isReused;
          updatedPassword.reusedIn = markedPassword.reusedIn;
          updatedPassword.lastScanned = new Date();
          
          // Update UI-specific fields for backward compatibility
          if (markedPassword.isCompromised) {
            updatedPassword.compromiseInfo = {
              isCompromised: markedPassword.isCompromised,
              breachCount: markedPassword.breachCount || 0
            };
            
            // Update compromised count if status changed
            if (!wasCompromised) {
              setCompromisedPasswordCount(prevCount => prevCount + 1);
            }
          } else if (wasCompromised) {
            // Password is no longer compromised
            setCompromisedPasswordCount(prevCount => Math.max(0, prevCount - 1));
          }
          
          if (markedPassword.isUrlUnsafe) {
            updatedPassword.securityRisk = {
              isSafe: !markedPassword.isUrlUnsafe,
              threatTypes: markedPassword.urlThreatTypes
            };
            
            // Update security risk count if status changed
            if (!wasUrlUnsafe) {
              setSecurityRiskCount(prevCount => prevCount + 1);
            }
          } else if (wasUrlUnsafe) {
            // URL is no longer unsafe
            setSecurityRiskCount(prevCount => Math.max(0, prevCount - 1));
          }
          
          // Update reused password IDs
          const newReusedIds = new Set(reusedPasswordIds);
          
          if (markedPassword.isReused) {
            // This password is reused, add it to the set
            newReusedIds.add(updatedPassword.id);
            
            // Also check if we need to update other passwords that might be reused with this one
            if (markedPassword.reusedIn && markedPassword.reusedIn.length > 0) {
              // Find all the passwords that are reused with this one
              for (const reusedItem of markedPassword.reusedIn) {
                const matchingPassword = savedLogins.find(
                  p => p.website === reusedItem.website && p.username === reusedItem.username
                );
                if (matchingPassword) {
                  // Mark this password as reused too
                  matchingPassword.isReused = true;
                  if (!matchingPassword.reusedIn) matchingPassword.reusedIn = [];
                  
                  // Add this password to the reused set
                  newReusedIds.add(matchingPassword.id);
                }
              }
            }
          } else if (wasReused) {
            // This password is no longer reused, remove it from the set
            newReusedIds.delete(updatedPassword.id);
            
            // We should also refresh all passwords to make sure reuse status is correct
            // This is a bit heavy but ensures consistency
            fetchPasswords();
          }
          
          setReusedPasswordIds(newReusedIds);
          setReusedPasswordCount(newReusedIds.size);
        }
      }
    } catch (error) {
      console.error('Error checking security for updated password:', error);
    }
    
    // Update weak password count
    const updatedLogins = savedLogins.map(login => 
      login.id === updatedPassword.id ? updatedPassword : login
    );
    const weakCount = updatedLogins.filter(p => p.strength === 'weak').length;
    setWeakPasswordCount(weakCount);
    
    // Update the saved logins with the updated password
    setSavedLogins(updatedLogins);
    
    // Ensure the reused password count is correctly updated
    setReusedPasswordCount(reusedPasswordIds.size);
    
    // Update the selected login if it was the one that was updated
    if (selectedLogin && selectedLogin.id === updatedPassword.id) {
      setSelectedLogin(updatedPassword);
    }
    
    // Trigger a refresh of the security page data
    refreshSecurityData();
  };

  return (
    <PageLayout className="min-h-screen flex flex-col bg-[#070b14]">
      {/* Page content wrapper - take full height */}
      <div className="flex-1 flex flex-col w-full px-3 sm:px-6 md:px-8 py-3 sm:py-4 overflow-x-hidden">
        {/* Page Title */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Password Vault</h1>
          <p className="text-gray-400">Manage and secure your passwords in one place</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5 mb-4 sm:mb-6">
          {/* Vault Summary Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <VaultSummaryCard
              count={savedLogins.length}
              icon={() => (
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15V17M6 9V7C6 5.4087 6.63214 3.88258 7.75736 2.75736C8.88258 1.63214 10.4087 1 12 1C13.5913 1 15.1174 1.63214 16.2426 2.75736C17.3679 3.88258 18 5.4087 18 7V9M6 9H18M6 9C5.46957 9 4.96086 9.21071 4.58579 9.58579C4.21071 9.96086 4 10.4696 4 11V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V11C20 10.4696 19.7893 9.96086 19.4142 9.58579C19.0391 9.21071 18.5304 9 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            />
          </motion.div>
          {/* Weak Passwords Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <AlternatingCard
              count={weakPasswordCount}
              title="Weak Passwords"
              description="Passwords with low strength score"
              alternateCount={reusedPasswordCount}
              alternateTitle="Reused Passwords"
              alternateDescription="Passwords used across multiple sites"
              securityRiskCount={securityRiskCount + compromisedPasswordCount}
              total={savedLogins.length}
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-5">
          <FilterTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            weakCount={weakPasswordCount}
            reusedCount={reusedPasswordCount}
            securityRiskCount={securityRiskCount}
            compromisedCount={compromisedPasswordCount}
            isLoading={isLoading}
          />
          <AddPasswordButton onClick={handleAddPassword} />
        </div>

        {/* Content Area - Flex-1 to take remaining height */}
        <div className="grid grid-cols-12 gap-3 sm:gap-5 flex-1 min-h-0">
          {/* Left Sidebar - Logins List */}
          <div className="col-span-12 md:col-span-5 lg:col-span-4 flex flex-col h-full mb-3 md:mb-0">
            <div className="bg-[#0a0f1a] border border-slate-800/60 rounded-xl overflow-hidden shadow-lg h-full backdrop-blur-md">
              {(() => {
                switch (activeTab) {
                  case "reused":
                    return (
                      <ReusedPasswordsView
                        passwords={savedLogins.filter(login => reusedPasswordIds.has(login.id))}
                        onSelectLogin={setSelectedLogin}
                        isLoading={isLoading}
                      />
                    );
                  case "all":
                    return (
                      <WebsitePasswordsView
                        passwords={isLoading ? savedLogins : filteredPasswords}
                        onSelectLogin={setSelectedLogin}
                        isLoading={isLoading}
                      />
                    );
                  default:
                    return (
                      <SavedLogins
                        logins={filteredPasswords}
                        onSelectLogin={setSelectedLogin}
                        isLoading={isLoading}
                      />
                    );
                }
              })()}
            </div>
          </div>

          {/* Right Content - Password Details */}          <div className="col-span-12 md:col-span-7 lg:col-span-8 flex flex-col h-full">            {selectedLogin ? (
            <PasswordDetailView 
              login={selectedLogin} 
              onDelete={handleDeletePassword}
              onUpdate={handleUpdatePassword}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-[#0a0f1a] border border-slate-800/60 rounded-xl p-4 sm:p-6 shadow-lg backdrop-blur-md">
              <div className="text-center">
                <div className="rounded-full bg-gradient-to-br from-slate-800/60 to-slate-800/40 p-4 mx-auto mb-5 w-16 h-16 flex items-center justify-center shadow-lg border border-slate-700/30">
                  <Plus className="h-7 w-7 text-indigo-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No password selected</h3>
                <p className="text-gray-400 text-sm sm:text-base max-w-md">
                  Select a password from the list or add a new one to view details
                </p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Add Password Modal */}
      <AddPasswordForm 
        isOpen={isAddPasswordModalOpen}
        onClose={() => setIsAddPasswordModalOpen(false)}
        onPasswordAdded={handlePasswordAdded}
      />

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
