import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Globe } from "lucide-react";
import { LoginItem } from "@/lib/passwordService";

interface WebsitePasswordsViewProps {
  passwords: LoginItem[];
  onSelectLogin: (login: LoginItem) => void;
  isLoading?: boolean;
}

interface WebsiteGroup {
  domain: string;
  accounts: LoginItem[];
  isExpanded: boolean;
}

// Create a memoized account item component to prevent unnecessary re-renders
const AccountItem = memo(({ account, onSelect }: { account: LoginItem; onSelect: (login: LoginItem) => void }) => {
  return (
    <motion.div
      key={account.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-between p-2 rounded-md hover:bg-slate-700/30 cursor-pointer"
      onClick={() => onSelect(account)}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
          <Globe className="h-4 w-4 text-indigo-400" />
        </div>
        <div>
          <div className="text-white font-medium">{account.username}</div>
          <div className="text-gray-400 text-sm">{account.url || "No URL"}</div>
        </div>
      </div>
    </motion.div>
  );
});

// Add display name to fix the react/display-name warning
AccountItem.displayName = "AccountItem";

export default function WebsitePasswordsView({ passwords, onSelectLogin, isLoading = false }: WebsitePasswordsViewProps) {
  const [websiteGroups, setWebsiteGroups] = useState<WebsiteGroup[]>([]);
  // Memoize the groups to prevent unnecessary re-renders
  const memoizedGroups = useMemo(() => websiteGroups, [websiteGroups]);

  // Memoize the grouping logic to prevent unnecessary recalculations
  const groupedPasswords = useMemo(() => {
    // Group passwords by website domain
    const groupMap = new Map<string, LoginItem[]>();
    
    // Avoid unnecessary work if passwords array is empty
    if (passwords.length === 0) return [];
    
    passwords.forEach(password => {
      const domain = password.site;
      if (!groupMap.has(domain)) {
        groupMap.set(domain, []);
      }
      groupMap.get(domain)?.push(password);
    });
    
    // Convert map to array and sort by domain name
    return Array.from(groupMap.entries())
      .map(([domain, accounts]) => ({
        domain,
        // Sort accounts to ensure stable rendering
        accounts: accounts.sort((a, b) => a.username.localeCompare(b.username)),
      }))
      .sort((a, b) => a.domain.localeCompare(b.domain));
  }, [passwords]);
  
  // Update website groups while preserving expanded state
  useEffect(() => {
    setWebsiteGroups(prevGroups => {
      return groupedPasswords.map(group => {
        // Preserve expanded state if group already exists
        const existingGroup = prevGroups.find(g => g.domain === group.domain);
        return {
          ...group,
          isExpanded: existingGroup ? existingGroup.isExpanded : false
        };
      });
    });
  }, [groupedPasswords]);

  // Memoize the toggle function to prevent recreating it on each render
  const toggleExpand = useCallback((index: number) => {
    setWebsiteGroups(prev =>
      prev.map((group, i) =>
        i === index ? { ...group, isExpanded: !group.isExpanded } : group
      )
    );
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your passwords...</p>
        </div>
      </div>
    );
  }

  if (passwords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Globe className="h-12 w-12 text-indigo-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Passwords Found</h3>
        <p className="text-gray-400 max-w-md">
          You haven&apos;t saved any passwords yet. Add your first password to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-4">
        {memoizedGroups.map((group, index) => (
          <motion.div
            key={group.domain}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden"
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => toggleExpand(index)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {group.domain.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-medium">{group.domain}</h3>
                  <div className="text-gray-400 text-sm">
                    {group.accounts.length} {group.accounts.length === 1 ? "account" : "accounts"}
                  </div>
                </div>
              </div>
              {group.isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>

            <AnimatePresence>
              {group.isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-slate-700/50 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="space-y-2">
                      {group.accounts.map((account) => (
                        <AccountItem 
                          key={account.id} 
                          account={account} 
                          onSelect={onSelectLogin} 
                        />
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
