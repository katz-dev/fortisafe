import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export default function SearchBar({ searchTerm, setSearchTerm }: SearchBarProps) {
    return (
        <div className="relative mb-3 sm:mb-5 group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-[#0a0f1a]/90 backdrop-blur-md rounded-lg shadow-xl border border-slate-800/80">
                <Input
                    placeholder="Search passwords..."
                    className="bg-transparent border-none rounded-lg text-white w-full pl-10 sm:pl-12 pr-8 sm:pr-10 py-4 sm:py-6 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 h-12 sm:h-14 text-sm sm:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, repeat: 0 }}
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-indigo-400"
                >
                    <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.div>
                <AnimatePresence>
                    {searchTerm && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 h-6 w-6 sm:h-8 sm:w-8 hover:text-white hover:bg-slate-800/70"
                                onClick={() => setSearchTerm("")}
                            >
                                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {searchTerm && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-3 -bottom-6 text-xs text-indigo-300"
                >
                    Searching for &quot;{searchTerm}&quot;
                </motion.div>
            )}
        </div>
    );
}
