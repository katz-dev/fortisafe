import { useState, useEffect, useCallback, useRef } from "react";
import { AlertCircle, ChevronDown, Copy, Eye, EyeOff, Shield, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { LoginItem, getDecryptedPassword } from "@/lib/passwordService";
import { motion, AnimatePresence } from "framer-motion";

interface ReusedPasswordsViewProps {
  passwords: LoginItem[];
  onSelectLogin: (login: LoginItem) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface PasswordGroup {
  passwordHash: string;
  accounts: LoginItem[];
  isExpanded: boolean;
  decryptedPassword?: string;
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

  // Group passwords by their actual password value
  useEffect(() => {
    const groupPasswords = async () => {
      setInternalLoading(true);
      
      // Create a map to group passwords
      const passwordMap = new Map<string, LoginItem[]>();
      
      // First, decrypt all passwords and group them
      for (const password of passwords) {
        try {
          // If the password is already decrypted (has a real value, not placeholder)
          const passwordValue = password.password !== '********' 
            ? password.password 
            : await getDecryptedPassword(password.id);
          
          // Use the password value as the key
          if (!passwordMap.has(passwordValue)) {
            passwordMap.set(passwordValue, []);
          }
          
          passwordMap.get(passwordValue)?.push({
            ...password,
            password: passwordValue
          });
        } catch (error) {
          console.error(`Error decrypting password ${password.id}:`, error);
        }
      }
      
      // Convert map to array of groups
      const groups: PasswordGroup[] = [];
      passwordMap.forEach((accounts, passwordValue) => {
        // Only include groups with more than one account
        if (accounts.length > 1) {
          // Find existing group to preserve state
          const existingGroup = passwordGroupsRef.current.find(g => 
            g.decryptedPassword === passwordValue
          );
          const strength = calculateStrength(passwordValue);
          const riskLevel = calculateRiskLevel(strength, accounts.length);
          
          groups.push({
            passwordHash: hashPassword(passwordValue),
            accounts,
            isExpanded: existingGroup ? existingGroup.isExpanded : false,
            decryptedPassword: passwordValue,
            showPassword: existingGroup ? existingGroup.showPassword : false,
            strength,
            riskLevel
          });
        }
      });
      
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
  

  
  const toggleExpand = useCallback((index: number) => {
    setPasswordGroups(prev => {
      // Create a shallow copy to avoid unnecessary re-renders of unchanged items
      const newGroups = [...prev];
      newGroups[index] = { ...newGroups[index], isExpanded: !newGroups[index].isExpanded };
      return newGroups;
    });
  }, []);
  
  const toggleShowPassword = useCallback((index: number) => {
    setPasswordGroups(prev => 
      prev.map((group, i) => 
        i === index ? { ...group, showPassword: !group.showPassword } : group
      )
    );
  }, []);
  
  const copyPassword = useCallback((password: string) => {
    navigator.clipboard.writeText(password);
    toast.success("Password copied to clipboard");
  }, []);
  
  const getStrengthColor = useCallback((strength: 'weak' | 'okay' | 'strong') => {
    switch (strength) {
      case 'weak': return 'text-red-400';
      case 'okay': return 'text-amber-400';
      case 'strong': return 'text-green-400';
      default: return 'text-gray-400';
    }
  }, []);
  
  const getRiskColor = useCallback((risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-purple-500/20 text-purple-400';
    }
  }, []);
  
  const getRiskLabel = useCallback((risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high': return 'High Risk';
      case 'medium': return 'Medium Risk';
      case 'low': return 'Low Risk';
      default: return 'Unknown Risk';
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
      
      <p className="text-gray-400 mb-6">
        These passwords are used across multiple accounts, which is a security risk. Consider using unique passwords for each account.
      </p>
      
      <div className="space-y-4">
          {passwordGroups.map((group, index) => (
            <motion.div
              key={index}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -2 }}
              layout
            >
              <motion.div 
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => toggleExpand(index)}
                whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.3)' }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${getRiskColor(group.riskLevel)} p-2 rounded-md`}>
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-medium">
                        Password used in {group.accounts.length} accounts
                      </h3>
                      {renderRiskBadge(group.riskLevel)}
                    </div>
                    <div className="flex items-center mt-1">
                      <div className="text-gray-400 text-sm flex items-center">
                        <span className={`font-mono ${getStrengthColor(group.strength)}`}>
                          {group.showPassword ? group.decryptedPassword : group.passwordHash}
                        </span>
                        <motion.button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleShowPassword(index);
                          }}
                          className="ml-2 text-gray-500 hover:text-gray-300"
                          aria-label={group.showPassword ? "Hide password" : "Show password"}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {group.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </motion.button>
                        <motion.button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (group.decryptedPassword) {
                              copyPassword(group.decryptedPassword);
                            }
                          }}
                          className="ml-2 text-gray-500 hover:text-gray-300"
                          aria-label="Copy password"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Copy className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-xs text-gray-400 mr-3">
                    {group.strength === 'weak' ? 'Weak' : group.strength === 'okay' ? 'Moderate' : 'Strong'}
                  </div>
                  <motion.div
                    animate={{ rotate: group.isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </motion.div>
                </div>
              </motion.div>
              
              <AnimatePresence>
                {group.isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-700/50 p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-300">Accounts using this password:</h4>
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Shield className="h-3.5 w-3.5 mr-1" />
                        <span>Security risk: {getRiskLabel(group.riskLevel)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {group.accounts.map((account, accountIndex) => (
                        <motion.div
                          key={account.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-slate-700/30 cursor-pointer"
                          onClick={() => onSelectLogin(account)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: 0.05 * accountIndex }}
                          whileHover={{ scale: 1.02, backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {account.site.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-medium">{account.site}</div>
                              <div className="text-gray-400 text-sm">{account.username}</div>
                            </div>
                          </div>
                          {account.securityRisk && !account.securityRisk.isSafe && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="text-red-400 text-xs flex items-center"
                            >
                              <AlertCircle className="h-3.5 w-3.5 mr-1" />
                              <span>At risk</span>
                            </motion.div>
                          )}
                        </motion.div>
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
