import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

export default function WebsitePasswordsView({ passwords, onSelectLogin, isLoading = false }: WebsitePasswordsViewProps) {
  const [websiteGroups, setWebsiteGroups] = useState<WebsiteGroup[]>([]);

  useEffect(() => {
    // Group passwords by website domain
    const groupMap = new Map<string, LoginItem[]>();
    
    passwords.forEach(password => {
      let domain = password.site;
      if (!groupMap.has(domain)) {
        groupMap.set(domain, []);
      }
      groupMap.get(domain)?.push(password);
    });
    
    // Convert map to array and sort by domain name
    const groups = Array.from(groupMap.entries())
      .map(([domain, accounts]) => {
        // Preserve expanded state if group already exists
        const existingGroup = websiteGroups.find(g => g.domain === domain);
        return {
          domain,
          accounts,
          isExpanded: existingGroup ? existingGroup.isExpanded : false
        };
      })
      .sort((a, b) => a.domain.localeCompare(b.domain));
    
    setWebsiteGroups(groups);
  }, [passwords]);

  const toggleExpand = (index: number) => {
    setWebsiteGroups(prev =>
      prev.map((group, i) =>
        i === index ? { ...group, isExpanded: !group.isExpanded } : group
      )
    );
  };

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
          You haven't saved any passwords yet. Add your first password to get started.
        </p>
      </div>
    );
  }



  return (
    <div className="p-4">
      <div className="space-y-4">
        {websiteGroups.map((group, index) => (
          <motion.div
            key={group.domain}
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
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {group.domain.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-medium">{group.domain}</h3>
                  <div className="text-gray-400 text-sm">
                    {group.accounts.length} {group.accounts.length === 1 ? 'account' : 'accounts'}
                  </div>
                </div>
              </div>
              {group.isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>

            {group.isExpanded && (
              <div className="border-t border-slate-700/50 p-4">
                <div className="space-y-2">
                  {group.accounts.map((account) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-slate-700/30 cursor-pointer"
                      onClick={() => onSelectLogin(account)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                          <Globe className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{account.username}</div>
                          <div className="text-gray-400 text-sm">{account.url || 'No URL'}</div>
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
