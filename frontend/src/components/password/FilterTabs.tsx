import { motion } from "framer-motion";

export interface FilterTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    weakCount: number;
    reusedCount: number;
    securityRiskCount: number;
    compromisedCount: number;
}

export default function FilterTabs({ activeTab, onTabChange, weakCount, reusedCount, securityRiskCount, compromisedCount }: FilterTabsProps) {
    const tabs = [
        {
            id: "all",
            label: "All",
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12V19M12 19L9 16M12 19L15 16M19 6V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            bgColor: "bg-gradient-to-r from-amber-400 to-amber-500"
        },
        {
            id: "reused",
            label: "Reused",
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 8L15 12H18C18 15.3137 15.3137 18 12 18C10.9071 18 9.89002 17.7024 9 17.1779M5 16L9 12H6C6 8.68629 8.68629 6 12 6C13.0929 6 14.11 6.29765 15 6.82209" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            bgColor: "bg-gradient-to-r from-teal-400 to-teal-500"
        },
        {
            id: "weak",
            label: "Weak",
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9V12M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            bgColor: "bg-gradient-to-r from-red-400 to-red-500"
        },
        {
            id: "security",
            label: "Security risks",
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15H12.01M12 12V9M4.98207 19H19.0179C20.5615 19 21.5233 17.3333 20.7551 16L13.7372 4C12.9689 2.66667 11.0311 2.66667 10.2628 4L3.24485 16C2.47666 17.3333 3.43849 19 4.98207 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            bgColor: "bg-gradient-to-r from-orange-400 to-orange-500"
        }
    ];

    return (
        <div className="flex overflow-x-auto pb-2 hide-scrollbar space-x-2">
            {tabs.map((tab, index) => (
                <motion.button
                    key={tab.id}
                    whileHover={{ y: -2, scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }} className={`flex items-center rounded-lg px-4 py-2.5 transition-all duration-200 ${activeTab === tab.id
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-lg border border-indigo-500/70 font-medium"
                        : "text-gray-400 hover:text-white bg-[#0a0f1a]/90 backdrop-blur-md border border-slate-800/60 hover:border-slate-700/70 hover:shadow-md"
                        }`}
                    onClick={() => onTabChange(tab.id)}
                >
                    <span className={`flex items-center justify-center w-5 h-5 mr-2 rounded-md ${tab.bgColor} text-white shadow-sm`}>
                        {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                    {tab.id === 'weak' && weakCount > 0 && (
                        <span className="ml-2 text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full">
                            {weakCount}
                        </span>
                    )}
                    {tab.id === 'reused' && reusedCount > 0 && (
                        <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">
                            {reusedCount}
                        </span>
                    )}
                    {(tab.id === 'security') && (securityRiskCount > 0 || compromisedCount > 0) && (
                        <span className="bg-red-500/20 text-red-300 text-xs px-2 py-0.5 rounded-full">
                            {securityRiskCount + compromisedCount}
                        </span>
                    )}
                    {activeTab === tab.id && (
                        <motion.span
                            layoutId="activeTabIndicator"
                            className="ml-2 w-1.5 h-1.5 rounded-full bg-white"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        />
                    )}
                </motion.button>
            ))}
        </div>
    );
}
