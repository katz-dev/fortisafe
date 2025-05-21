import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronDown, ChevronUp, Eye, EyeOff, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordHistoryItem, getPasswordHistory } from "@/lib/passwordService";
import { formatDistanceToNow } from "date-fns";

interface PasswordHistoryViewProps {
  passwordId: string;
  isVisible: boolean;
}

export default function PasswordHistoryView({ passwordId, isVisible }: PasswordHistoryViewProps) {
  const [historyItems, setHistoryItems] = useState<PasswordHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());

  const fetchPasswordHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const history = await getPasswordHistory(passwordId);
      setHistoryItems(history);
    } catch (err) {
      console.error("Error fetching password history:", err);
      setError("Failed to load password history");
    } finally {
      setIsLoading(false);
    }
  }, [passwordId]);

  useEffect(() => {
    if (isVisible && passwordId) {
      fetchPasswordHistory();
    }
  }, [passwordId, isVisible, fetchPasswordHistory]);

  const toggleExpandItem = (itemId: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(itemId)) {
      newExpandedItems.delete(itemId);
    } else {
      newExpandedItems.add(itemId);
    }
    setExpandedItems(newExpandedItems);
  };

  const toggleShowPassword = (itemId: string) => {
    const newShowPasswords = new Set(showPasswords);
    if (newShowPasswords.has(itemId)) {
      newShowPasswords.delete(itemId);
    } else {
      newShowPasswords.add(itemId);
    }
    setShowPasswords(newShowPasswords);
  };

  if (!isVisible) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2" />
          <p className="text-gray-400">Loading password history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-900/20 rounded-lg border border-red-700/50">
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="flex items-center text-gray-400">
          <History className="h-4 w-4 mr-2 text-indigo-400" />
          <p>No password history available. History will be recorded when this password is changed.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4"
    >
      <div className="space-y-3">
        {historyItems.map((item) => (
          <div
            key={item.id}
            className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
          >
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/70"
              onClick={() => toggleExpandItem(item.id)}
            >
              <div className="flex items-center">
                <div className="mr-3 bg-indigo-900/50 text-indigo-300 p-1.5 rounded-full">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    Previous password
                    {item.replacedAt && (
                      <span className="ml-2 text-xs text-gray-400">
                        changed {formatDistanceToNow(item.replacedAt, { addSuffix: true })}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {item.createdAt.toLocaleDateString()} - 
                    {item.replacedAt ? item.replacedAt.toLocaleDateString() : "Present"}
                  </p>
                </div>
              </div>
              {expandedItems.has(item.id) ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>

            <AnimatePresence>
              {expandedItems.has(item.id) && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-slate-700/50"
                >
                  <div className="p-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Website</p>
                        <p className="text-sm text-white">{item.website}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Username</p>
                        <p className="text-sm text-white">{item.username}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400 mb-1">Password</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleShowPassword(item.id);
                          }}
                        >
                          {showPasswords.has(item.id) ? (
                            <EyeOff className="h-3 w-3 text-gray-400" />
                          ) : (
                            <Eye className="h-3 w-3 text-gray-400" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-white font-mono">
                        {showPasswords.has(item.id) ? item.password : "••••••••••"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
