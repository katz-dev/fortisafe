import { useState, useEffect, useCallback, useRef } from "react";
import { AlertCircle, RefreshCw, ShieldAlert, ChevronDown, Eye, EyeOff, Copy, Shield } from "lucide-react";
import { LoginItem, getDecryptedPassword } from "@/lib/passwordService";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ReusedPasswordsViewProps {
  passwords: LoginItem[];
  onSelectLogin: (login: LoginItem) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface PasswordGroup {
  groupId: string;
  accounts: LoginItem[];
  isExpanded: boolean;
  showPassword: boolean;
  strength: 'weak' | 'okay' | 'strong';
  riskLevel: 'high' | 'medium' | 'low';
}

export default function ReusedPasswordsView({ passwords, onSelectLogin, isLoading: parentLoading = false, onRefresh }: ReusedPasswordsViewProps) {
  const [passwordGroups, setPasswordGroups] = useState<PasswordGroup[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const isLoading = parentLoading || internalLoading;
  
  // Store a reference to the previous password groups to maintain state across renders
  const passwordGroupsRef = useRef<PasswordGroup[]>(passwordGroups);
  
  // Update the ref when password groups change
  useEffect(() => {
    passwordGroupsRef.current = passwordGroups;
  }, [passwordGroups]);

  // Simple function to create a hash representation of a password
  const hashPassword = useCallback((password: string): string => {
    return password.substring(0, 2) + '•••••' + password.substring(password.length - 2);
  }, []);

  // Calculate password strength and risk level
  const calculateStrength = useCallback((password: string): 'weak' | 'okay' | 'strong' => {
    const length = password.length;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const criteria = [
      length >= 8,
      hasUpperCase,
      hasLowerCase,
      hasDigit,
      hasSpecialChar
    ].filter(Boolean).length;

    if (criteria >= 4) return 'strong';
    if (criteria >= 2) return 'okay';
    return 'weak';
  }, []);

  const calculateRiskLevel = useCallback((strength: 'weak' | 'okay' | 'strong', accountCount: number): 'high' | 'medium' | 'low' => {
    if (strength === 'weak' || accountCount > 3) return 'high';
    if (strength === 'okay' || accountCount === 3) return 'medium';
    return 'low';
  }, []);

  // Group passwords by reuse patterns using the isReused and reusedIn fields from API
  useEffect(() => {
    const groupPasswords = async () => {
      setInternalLoading(true);
      
      // Create a map to track password groups by ID
      const passwordGroupMap = new Map<string, Set<string>>();
      const reusedPasswords = passwords.filter(p => p.isReused);
      
      // First, identify all the reused password groups
      for (const password of reusedPasswords) {
        // Create a set for this password if it doesn't exist
        if (!passwordGroupMap.has(password.id)) {
          passwordGroupMap.set(password.id, new Set<string>([password.id]));
        }
        
        // Add all the passwords this one is reused with
        const currentGroup = passwordGroupMap.get(password.id)!;
        if (password.reusedIn && password.reusedIn.length > 0) {
          // Find the matching passwords in our list
          for (const reusedItem of password.reusedIn) {
            const matchingPassword = passwords.find(
              p => p.website === reusedItem.website && p.username === reusedItem.username
            );
            if (matchingPassword) {
              currentGroup.add(matchingPassword.id);
              
              // Also update the other password's group to include this one
              if (!passwordGroupMap.has(matchingPassword.id)) {
                passwordGroupMap.set(matchingPassword.id, new Set<string>([matchingPassword.id]));
              }
              passwordGroupMap.get(matchingPassword.id)!.add(password.id);
            }
          }
        }
      }
      
      // Merge overlapping groups
      const mergedGroups: Set<string>[] = [];
      const processedIds = new Set<string>();
      
      for (const [id, group] of passwordGroupMap.entries()) {
        if (processedIds.has(id)) continue;
        
        // Mark this ID as processed
        processedIds.add(id);
        
        // Create a new merged group starting with this group
        const mergedGroup = new Set<string>(group);
        
        // Check all IDs in this group
        for (const groupId of group) {
          if (groupId !== id && passwordGroupMap.has(groupId)) {
            // Add all IDs from the related group
            for (const relatedId of passwordGroupMap.get(groupId)!) {
              mergedGroup.add(relatedId);
              processedIds.add(relatedId);
            }
          }
        }
        
        // Only add groups with more than one password
        if (mergedGroup.size > 1) {
          mergedGroups.push(mergedGroup);
        }
      }
      
      // Now create the password groups
      const groups: PasswordGroup[] = [];
      
      for (const idGroup of mergedGroups) {
        // Get all the passwords in this group
        const accounts: LoginItem[] = [];
        let decryptedPassword: string | undefined;
        
        for (const id of idGroup) {
          const password = passwords.find(p => p.id === id);
          if (password) {
            try {
              // Decrypt the password if needed
              let passwordValue = password.password;
              if (passwordValue === '********') {
                passwordValue = await getDecryptedPassword(password.id);
              }
              
              // Set the decrypted password for the group if not already set
              if (!decryptedPassword) {
                decryptedPassword = passwordValue;
              }
              
              accounts.push({
                ...password,
                password: passwordValue // Store the actual decrypted password in the account
              });
            } catch (error) {
              console.error(`Error decrypting password ${password.id}:`, error);
              // Still add the password to the group even if we can't decrypt it
              accounts.push(password);
            }
          }
        }
        
        if (accounts.length > 1 && decryptedPassword) {
          // Find existing group to preserve state
          const existingGroup = passwordGroupsRef.current.find(g => 
            g.accounts.some(a => accounts.some(acc => acc.id === a.id))
          );
          const strength = calculateStrength(decryptedPassword);
          const riskLevel = calculateRiskLevel(strength, accounts.length);
          
          groups.push({
            groupId: [...idGroup].join('-'),
            accounts,
            isExpanded: existingGroup ? existingGroup.isExpanded : false,
            showPassword: existingGroup ? existingGroup.showPassword : false,
            strength,
            riskLevel
          });
        }
      }
      
      // Sort groups by risk level (high to low) and then by number of accounts (high to low)
      groups.sort((a, b) => {
        const riskOrder = { high: 0, medium: 1, low: 2 };
        const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        if (riskDiff !== 0) return riskDiff;
        return b.accounts.length - a.accounts.length;
      });
      
      setPasswordGroups(groups);
      setInternalLoading(false);
    };
    
    groupPasswords();
  }, [passwords, calculateStrength, calculateRiskLevel, hashPassword]);

  // Function to toggle group expansion
  const toggleExpand = useCallback((index: number) => {
    setPasswordGroups(prev => {
      const newGroups = [...prev];
      if (newGroups[index]) {
        newGroups[index] = { 
          ...newGroups[index], 
          isExpanded: !newGroups[index].isExpanded 
        };
      }
      return newGroups;
    });
  }, []);
  
  // Function to toggle password visibility
  const toggleShowPassword = useCallback((index: number) => {
    setPasswordGroups(prev => {
      const newGroups = [...prev];
      if (newGroups[index]) {
        newGroups[index] = { 
          ...newGroups[index], 
          showPassword: !newGroups[index].showPassword 
        };
      }
      return newGroups;
    });
  }, []);
  
  // Function to copy password to clipboard
  const copyPassword = useCallback((password: string) => {
    navigator.clipboard.writeText(password);
    toast.success("Password copied to clipboard");
  }, []);
  
  // Function to get color based on strength
  const getStrengthColor = useCallback((strength: 'weak' | 'okay' | 'strong') => {
    switch (strength) {
      case 'weak': return 'text-red-400';
      case 'okay': return 'text-amber-400';
      case 'strong': return 'text-green-400';
      default: return 'text-gray-400';
    }
  }, []);
  
  // Function to get color based on risk level
  const getRiskColor = useCallback((risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-purple-500/20 text-purple-400';
    }
  }, []);

  // Function to render the risk badge
  const renderRiskBadge = useCallback((risk: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-red-500/20 text-red-400',
      medium: 'bg-amber-500/20 text-amber-400',
      low: 'bg-green-500/20 text-green-400'
    };
    
    const labels = {
      high: 'High Risk',
      medium: 'Medium Risk',
      low: 'Low Risk'
    };
    
    return (
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${colors[risk]}`}>
        {labels[risk]}
      </div>
    );
  }, []);

  // Function to handle refresh action
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      setInternalLoading(true);
      onRefresh();
    }
  }, [onRefresh]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (passwordGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <AlertCircle className="h-12 w-12 text-indigo-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Reused Passwords</h3>
        <p className="text-gray-400 max-w-md">
          Great job! You don&apos;t have any passwords that are used across multiple accounts.
        </p>
      </div>
    );
  }
  
  // Calculate total reused passwords count - count unique passwords that are reused
  const reusedPasswordCount = passwords.filter(p => p.isReused).length;
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Reused Passwords</h2>
        {onRefresh && (
          <motion.button 
            onClick={handleRefresh}
            className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </motion.button>
        )}
      </div>
      
      {/* Summary panel showing count */}
      <div className="bg-slate-800/50 rounded-lg p-6 mb-4 border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-red-500/20 rounded-full">
              <ShieldAlert className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Reused Password Alert</h3>
              <p className="text-gray-400">
                You have <span className="text-red-400 font-medium">{reusedPasswordCount}</span> {reusedPasswordCount === 1 ? 'password' : 'passwords'} that {reusedPasswordCount === 1 ? 'is' : 'are'} used across multiple accounts.
              </p>
              <p className="text-gray-400 mt-2">
                Using the same password for multiple accounts creates a security risk. If one account is compromised, all accounts using that password are vulnerable.  
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dropdown list of reused password groups */}
      <div className="space-y-4">
        {passwordGroups.map((group, index) => (
          <motion.div 
            key={group.groupId}
            className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => toggleExpand(index)}
            >
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-indigo-400" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">Password used in {group.accounts.length} accounts</span>
                    {renderRiskBadge(group.riskLevel)}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Strength: <span className={getStrengthColor(group.strength)}>{group.strength}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleShowPassword(index);
                  }}
                  className="p-2 hover:bg-slate-700/50 rounded-full transition-colors"
                  aria-label={group.showPassword ? "Hide password" : "Show password"}
                >
                  {group.showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const account = group.accounts[0];
                    if (account && account.password) {
                      copyPassword(account.password);
                    }
                  }}
                  className="p-2 hover:bg-slate-700/50 rounded-full transition-colors"
                  aria-label="Copy password"
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </button>
                
                <ChevronDown 
                  className={`h-5 w-5 text-gray-400 transition-transform ${group.isExpanded ? 'rotate-180' : ''}`} 
                />
              </div>
            </div>
            
            <AnimatePresence>
              {group.isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 border-t border-slate-700/50">
                    {group.showPassword && (
                      <div className="mb-3 p-3 bg-slate-900/50 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Password:</div>
                        <div className="font-mono text-white">{group.accounts[0]?.password || '********'}</div>
                      </div>
                    )}
                    
                    <h4 className="text-white font-medium mb-2">Accounts using this password:</h4>
                    <div className="space-y-2">
                      {group.accounts.map((account, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/80 transition-colors cursor-pointer"
                          onClick={() => onSelectLogin(account)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {account.website?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div>
                              <div className="text-white font-medium">{account.website || 'Unknown'}</div>
                              <div className="text-gray-400 text-sm">{account.username || 'No username'}</div>
                            </div>
                          </div>
                          {account.isCompromised && (
                            <div className="text-red-400 text-xs flex items-center">
                              <AlertCircle className="h-3.5 w-3.5 mr-1" />
                              <span>At risk</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );


}
