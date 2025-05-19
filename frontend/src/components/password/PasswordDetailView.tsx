import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Eye, EyeOff, Copy, Check, AlertTriangle, ExternalLink, Info, Edit, Trash2, AlertCircle } from "lucide-react";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import { deletePassword } from "@/lib/passwordService";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";

// WebsiteIcon component that displays the first letter of the website
function WebsiteIcon({ siteName }: { siteName: string }) {
    // Get the first letter and convert to uppercase
    const firstLetter = siteName.charAt(0).toUpperCase();

    // Generate a consistent color based on the site name
    const getColor = (name: string) => {
        // Simple hash function to generate a consistent number from a string
        const hash = name.split('').reduce((acc, char) => {
            return acc + char.charCodeAt(0);
        }, 0);

        // List of attractive background colors
        const colors = [
            { bg: "#4285F4", text: "#FFFFFF" }, // Google Blue
            { bg: "#EA4335", text: "#FFFFFF" }, // Google Red
            { bg: "#FBBC05", text: "#000000" }, // Google Yellow
            { bg: "#34A853", text: "#FFFFFF" }, // Google Green
            { bg: "#7B1FA2", text: "#FFFFFF" }, // Purple
            { bg: "#1976D2", text: "#FFFFFF" }, // Blue
            { bg: "#C2185B", text: "#FFFFFF" }, // Pink
            { bg: "#388E3C", text: "#FFFFFF" }, // Green
            { bg: "#F57C00", text: "#FFFFFF" }, // Orange
            { bg: "#0097A7", text: "#FFFFFF" }, // Teal
        ];

        // Use the hash to select a color
        const colorIndex = hash % colors.length;
        return colors[colorIndex];
    };

    const color = getColor(siteName);

    return (
        <div
            style={{
                backgroundColor: color.bg,
                color: color.text,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '22px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
        >
            {firstLetter}
        </div>
    );
}

interface LoginItem {
    id: string;
    site: string;
    username: string;
    password: string;
    strength: 'weak' | 'okay' | 'strong';
    website?: string;
    notes?: string;
}

interface PasswordDetailViewProps {
    login: LoginItem;
    onDelete?: (id: string) => void;
}

export default function PasswordDetailView({ login, onDelete }: PasswordDetailViewProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copiedUsername, setCopiedUsername] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleCopyPassword = () => {
        navigator.clipboard.writeText(login.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyUsername = () => {
        navigator.clipboard.writeText(login.username);
        setCopiedUsername(true);
        setTimeout(() => setCopiedUsername(false), 2000);
    };

    const getIssueText = (strength: string) => {
        switch (strength) {
            case 'weak':
                return 'This password is too weak. Consider using a stronger password with a mix of uppercase, lowercase, numbers, and special characters.';
            case 'okay':
                return 'This password could be stronger. Try adding more variety of characters or increasing its length.';
            case 'strong':
                return 'Great job! This password is strong and secure.';
            default:
                return 'Unable to determine password strength.';
        }
    };

    const openWebsite = () => {
        // Check if the website URL already has a protocol, if not add https://
        let url = login.website || login.site.toLowerCase();
        
        // Make sure the URL is properly formatted with protocol
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }
        
        window.open(url, '_blank');
    };
    
    const handleDeleteConfirm = async () => {
        try {
            setIsDeleting(true);
            await deletePassword(login.id);
            toast.success(`Password for ${login.site} deleted successfully`);
            if (onDelete) {
                onDelete(login.id);
            }
        } catch (error) {
            console.error('Error deleting password:', error);
            toast.error('Failed to delete password. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };
    
    const openDeleteDialog = () => {
        setIsDeleteDialogOpen(true);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full"
                key={login.id} // Add key to ensure animation triggers on login change
            >
                <Card className="bg-[#0a0f1a] border border-slate-800/60 rounded-xl shadow-lg overflow-hidden h-full flex flex-col backdrop-blur-md">
                    <CardContent className="p-0 flex-1 flex flex-col">
                        {/* Header with site logo and info */}
                        <div className="p-6 border-b border-slate-800/70 bg-gradient-to-r from-[#0a0f1a] via-[#0c1120] to-[#0e1326]">
                            <div className="flex items-start justify-between">
                                <motion.div
                                    className="flex items-center"
                                    initial={{ x: -20 }}
                                    animate={{ x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="h-16 w-16 rounded-xl mr-5 flex items-center justify-center shadow-lg overflow-hidden">
                                        <WebsiteIcon siteName={login.site} />
                                    </div>
                                    <div>
                                        <motion.h2
                                            className="text-2xl font-bold text-white mb-1"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.1, duration: 0.3 }}
                                        >
                                            {login.site}
                                        </motion.h2>
                                        <motion.p
                                            className="text-gray-400"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2, duration: 0.3 }}
                                        >
                                            {login.username}
                                        </motion.p>
                                    </div>
                                </motion.div>
                                <div className="flex space-x-2">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ y: -10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3, duration: 0.3 }}
                                    >
                                        <Button 
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                                            onClick={openWebsite}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Visit
                                        </Button>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ y: -10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.4, duration: 0.3 }}
                                    >
                                        <Button 
                                            className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
                                            onClick={openDeleteDialog}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    </motion.div>
                                </div>
                            </div>
                        </div>                <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-[#0a0f1a]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div
                                className="space-y-1.5"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                            >                                <label className="text-gray-400 text-sm font-medium flex items-center">
                                    <span className="w-5 h-5 mr-1.5 text-indigo-400 inline-flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    </span>
                                    Username
                                </label>
                                <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 transition-colors group">
                                    <p className="text-white font-medium select-all">{login.username}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 group-hover:text-white hover:bg-slate-700"
                                        onClick={handleCopyUsername}
                                    >
                                        {copiedUsername ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </motion.div>

                            <motion.div
                                className="space-y-1.5"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.3 }}
                            >
                                <label className="text-gray-400 text-sm font-medium flex items-center">
                                    <span className="w-5 h-5 mr-1.5 text-indigo-400 inline-flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                    </span>
                                    Website
                                </label>                            <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 transition-colors group">
                                    <p className="text-white font-medium">{login.website || `${login.site.toLowerCase()}.com`}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 group-hover:text-white hover:bg-slate-700"
                                        onClick={openWebsite}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            className="space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                        >
                            <label className="text-gray-400 text-sm font-medium flex items-center">
                                <span className="w-5 h-5 mr-1.5 text-indigo-400 inline-flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                </span>
                                Password
                                {login.strength === 'weak' && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-300 border border-red-800">
                                        <AlertTriangle className="w-3 h-3 mr-1" /> Weak
                                    </span>
                                )}
                            </label>                        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 transition-colors group">
                                <p className="text-white font-mono select-all transition-all">{showPassword ? login.password : '••••••••••'}</p>
                                <div className="flex">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="mr-1 text-gray-400 group-hover:text-white hover:bg-slate-700/70"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 group-hover:text-white hover:bg-slate-700/70"
                                        onClick={handleCopyPassword}
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Password Strength Indicator */}
                            <PasswordStrengthIndicator strength={login.strength} />
                        </motion.div>

                        <motion.div
                            className="space-y-1.5"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.3 }}
                        >
                            <label className="text-gray-400 text-sm font-medium flex items-center">
                                <span className="w-5 h-5 mr-1.5 text-indigo-400 inline-flex items-center justify-center">
                                    <Info className="h-4 w-4" />
                                </span>
                                Security Analysis
                            </label>                        <div className={`bg-slate-800/50 rounded-lg p-4 border backdrop-blur-sm ${login.strength === 'strong' ? 'border-green-700/50 bg-green-950/20' :
                                login.strength === 'okay' ? 'border-orange-700/50 bg-orange-950/20' :
                                    'border-red-700/50 bg-red-950/20'
                                }`}>
                                <div className="flex items-start">
                                    {login.strength === 'strong' ? (
                                        <div className="mr-3 bg-green-900/80 text-green-300 p-1.5 rounded-full">
                                            <Check className="h-4 w-4" />
                                        </div>
                                    ) : (
                                        <div className="mr-3 bg-red-900/80 text-red-300 p-1.5 rounded-full">
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-300">
                                        {getIssueText(login.strength)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </CardContent>
            </Card>
            </motion.div>
            
            {/* Delete Confirmation Dialog */}
            <Dialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                title="Delete Password"
                description={`Are you sure you want to delete the password for ${login.site}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                variant="danger"
                icon={<AlertCircle className="h-5 w-5" />}
            />
        </>
    );
}
