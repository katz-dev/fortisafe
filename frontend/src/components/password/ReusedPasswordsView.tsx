import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ChevronDown, ChevronUp, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { LoginItem, getDecryptedPassword } from "@/lib/passwordService";

interface ReusedPasswordsViewProps {
  passwords: LoginItem[];
  onSelectLogin: (login: LoginItem) => void;
  isLoading?: boolean;
}

interface PasswordGroup {
  passwordHash: string;
  accounts: LoginItem[];
  isExpanded: boolean;
  decryptedPassword?: string;
  showPassword: boolean;
}

export default function ReusedPasswordsView({ passwords, onSelectLogin, isLoading: parentLoading = false }: ReusedPasswordsViewProps) {
  const [passwordGroups, setPasswordGroups] = useState<PasswordGroup[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const isLoading = parentLoading || internalLoading;

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
          groups.push({
            passwordHash: hashPassword(passwordValue),
            accounts,
            isExpanded: false,
            decryptedPassword: passwordValue,
            showPassword: false
          });
        }
      });
      
      setPasswordGroups(groups);
      setInternalLoading(false);
    };
    
    groupPasswords();
  }, [passwords]);
  
  // Simple function to create a hash representation of a password
  const hashPassword = (password: string): string => {
    return password.substring(0, 2) + '•••••' + password.substring(password.length - 2);
  };
  
  const toggleExpand = (index: number) => {
    setPasswordGroups(prev => 
      prev.map((group, i) => 
        i === index ? { ...group, isExpanded: !group.isExpanded } : group
      )
    );
  };
  
  const toggleShowPassword = (index: number) => {
    setPasswordGroups(prev => 
      prev.map((group, i) => 
        i === index ? { ...group, showPassword: !group.showPassword } : group
      )
    );
  };
  
  const copyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast.success("Password copied to clipboard");
  };

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
          Great job! You don't have any passwords that are used across multiple accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold text-white mb-4">Reused Passwords</h2>
      <p className="text-gray-400 mb-6">
        These passwords are used across multiple accounts, which is a security risk. Consider using unique passwords for each account.
      </p>
      
      <div className="space-y-4">
        {passwordGroups.map((group, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden"
          >
            <div 
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => toggleExpand(index)}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-purple-500/20 p-2 rounded-md">
                  <AlertCircle className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">
                    Password used in {group.accounts.length} accounts
                  </h3>
                  <div className="flex items-center mt-1">
                    <div className="text-gray-400 text-sm flex items-center">
                      <span className="font-mono">
                        {group.showPassword ? group.decryptedPassword : group.passwordHash}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleShowPassword(index);
                        }}
                        className="ml-2 text-gray-500 hover:text-gray-300"
                      >
                        {group.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (group.decryptedPassword) {
                            copyPassword(group.decryptedPassword);
                          }
                        }}
                        className="ml-2 text-gray-500 hover:text-gray-300"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {group.isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </div>
            
            {group.isExpanded && (
              <div className="border-t border-slate-700/50 p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Accounts using this password:</h4>
                <div className="space-y-2">
                  {group.accounts.map((account, accountIndex) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: accountIndex * 0.05 }}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-slate-700/30 cursor-pointer"
                      onClick={() => onSelectLogin(account)}
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
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
