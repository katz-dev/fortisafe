'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/PageLayout';
import { Shield, Check, Scan, X, RefreshCw, Lock, FileText } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import { useSecurityContext } from '../contexts/security-context';
import axios from 'axios';
import { toast } from 'sonner';

// API URL for backend
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Define types for our data structures
interface PasswordLog {
    action: string;
    website?: string;
    username?: string;
    timestamp: string;
    passwordId: string;
}

interface UrlScanResult {
    url: string;
    isSafe: boolean;
    threatTypes?: string[];
}

interface ScanResults {
    urlResults?: UrlScanResult[];
    weakPasswords?: number;
    reusedPasswords?: number;
    strongPasswords?: number;
    compromisedPasswords?: number;
}

// Log interfaces
interface LogEntry {
    _id: string;
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    source?: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
}

export default function SecurityPage() {
    // State management
    const [scanning, setScanning] = useState(false);
    // This state variable is defined but not used in the component
    // We'll keep it for potential future use
    const [, setScanComplete] = useState(false);
    const [urlScanResults, setUrlScanResults] = useState<UrlScanResult[]>([]);
    const [isLoadingUrlCheck, setIsLoadingUrlCheck] = useState(false);
    const [urlToCheck, setUrlToCheck] = useState('');
    
    // We're commenting out these variables as they're defined but not used in the UI
    // const [passwordLogs, setPasswordLogs] = useState<PasswordLog[]>([]);
    // const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    
    // Define state for scan statistics
    const [scanStats, setScanStats] = useState({
        weakPasswords: 0,
        reusedPasswords: 0,
        strongPasswords: 0,
        compromisedPasswords: 0
    });
    
    // Security score calculation
    const [securityScore, setSecurityScore] = useState(0);
    
    // System logs state
    const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
    const [isLoadingSystemLogs, setIsLoadingSystemLogs] = useState(false);
    
    // Auth context
    const { user } = useAuth();
    
    // Security context for refreshing data when passwords are updated
    const { securityDataVersion } = useSecurityContext();

    /**
     * Calculates a security score based on password strength and URL scan results
     * @param stats Password statistics
     * @param urlResults URL scan results
     */
    const calculateSecurityScore = useCallback((stats: typeof scanStats, urlResults: UrlScanResult[]) => {
        // Base score starts at 100
        let score = 100;
        
        // Deduct for weak passwords (up to -40)
        const totalPasswords = stats.weakPasswords + stats.reusedPasswords + stats.strongPasswords + stats.compromisedPasswords;
        if (totalPasswords > 0) {
            const weakPercentage = stats.weakPasswords / totalPasswords;
            score -= Math.min(weakPercentage * 40, 40);
            
            // Deduct for reused passwords (up to -30)
            const reusedPercentage = stats.reusedPasswords / totalPasswords;
            score -= Math.min(reusedPercentage * 30, 30);
            
            // Deduct for compromised passwords (up to -30)
            const compromisedPercentage = stats.compromisedPasswords / totalPasswords;
            score -= Math.min(compromisedPercentage * 30, 30);
        }
        
        // Deduct for unsafe URLs (up to -20)
        if (urlResults.length > 0) {
            const unsafeUrls = urlResults.filter(url => !url.isSafe).length;
            const unsafePercentage = unsafeUrls / urlResults.length;
            score -= Math.min(unsafePercentage * 20, 20);
        }
        
        // Ensure score is between 0 and 100
        score = Math.max(0, Math.min(100, Math.round(score)));
        setSecurityScore(score);
    }, [setSecurityScore]);

    /**
     * Scans saved passwords for security issues
     * Handles API request and updates state with scan results
     */
    const handleScan = useCallback(async () => {
        setScanning(true);
        setScanComplete(false);
        
        try {
            // Get token from localStorage
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication error. Please log in again.');
                return;
            }
            
            const response = await axios.post<ScanResults>(
                `${API_URL}/scanner/scan-saved-passwords`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: 30000, // 30 second timeout
                }
            );
            
            if (response.data) {
                // Update URL scan results if available
                if (response.data.urlResults) {
                    setUrlScanResults(response.data.urlResults);
                }
                
                // Update scan statistics
                const stats = {
                    weakPasswords: response.data.weakPasswords || 0,
                    reusedPasswords: response.data.reusedPasswords || 0,
                    strongPasswords: response.data.strongPasswords || 0,
                    compromisedPasswords: response.data.compromisedPasswords || 0
                };
                
                setScanStats(stats);
                
                // Calculate security score
                calculateSecurityScore(stats, response.data.urlResults || []);
                
                setScanComplete(true);
                toast.success('Security scan completed successfully');
            }
        } catch (error) {
            console.error('Error scanning passwords:', error);
            toast.error('Failed to complete security scan. Please try again.');
        } finally {
            setScanning(false);
        }
    }, [calculateSecurityScore]);

    /**
     * Fetches password history logs from the API
     * Processes and formats the data for display
     * Note: This function is kept for future use but currently not displaying logs in the UI
     */
    const fetchPasswordLogs = useCallback(async () => {
        if (!user) {
            toast.error('You must be logged in to view password logs');
            return;
        }
        
        // Since we're not using the loading state or logs in the UI, we've commented these out
        // setIsLoadingLogs(true);
        try {
            // Get token from localStorage
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication error. Please log in again.');
                return;
            }
            
            const response = await axios.get(
                `${API_URL}/passwords/history/all`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: 10000 // 10 second timeout
                }
            );
            
            if (!response.data) {
                // setPasswordLogs([]);
                return;
            }
            
            // Convert the object of arrays into a flat array with password ID
            const logs: PasswordLog[] = [];
            for (const [passwordId, history] of Object.entries(response.data)) {
                if (Array.isArray(history)) {
                    history.forEach((entry: Omit<PasswordLog, 'passwordId'>) => {
                        logs.push({
                            ...entry,
                            passwordId
                        });
                    });
                }
            }
            
            // Sort by timestamp, newest first
            logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            // setPasswordLogs(logs.slice(0, 10)); // Show only the 10 most recent logs
            
            if (logs.length === 0) {
                toast.info('No password history found');
            }
        } catch (error) {
            console.error('Error fetching password logs:', error);
            toast.error('Failed to fetch password history');
            // setPasswordLogs([]);
        } finally {
            // setIsLoadingLogs(false);
        }
    }, [user]);

    /**
     * Checks a URL for security threats
     * Validates input and handles API request
     */
    const checkUrl = async () => {
        // Input validation
        if (!urlToCheck) {
            toast.error('Please enter a URL to check');
            return;
        }
        
        // URL format validation
        let url = urlToCheck;
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
            setUrlToCheck(url);
        }
        
        setIsLoadingUrlCheck(true);
        try {
            // Get token from localStorage
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication error. Please log in again.');
                return;
            }
            
            const response = await axios.post(
                `${API_URL}/scanner`,
                {
                    urls: [url]
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: 15000 // 15 second timeout
                }
            );
            
            if (response.data && response.data.urlResults) {
                setUrlScanResults(response.data.urlResults);
                toast.success('URL scan completed');
            } else {
                toast.warning('No scan results returned');
                setUrlScanResults([]);
            }
        } catch (error) {
            console.error('Error checking URL:', error);
            toast.error('Failed to check URL. Please try again.');
            setUrlScanResults([]);
        } finally {
            setIsLoadingUrlCheck(false);
        }
    };

    // The calculateSecurityScore function has been moved above the handleScan function
    
    /**
     * Fetches user logs from the API
     */
    const fetchSystemLogs = useCallback(async () => {
        if (!user) {
            toast.error('You must be logged in to view your logs');
            return;
        }
        
        setIsLoadingSystemLogs(true);
        try {
            // Get token from localStorage
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication error. Please log in again.');
                return;
            }
            
            // Fetch user logs from API
            const response = await axios.get(
                `${API_URL}/logs/user`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: 10000 // 10 second timeout
                }
            );
            
            if (response.data && Array.isArray(response.data)) {
                setSystemLogs(response.data);
                if (response.data.length === 0) {
                    toast.info('No logs found for your account');
                } else {
                    toast.success('User logs loaded successfully');
                }
            } else {
                console.warn('API returned invalid data format');
                setSystemLogs([]);
                toast.error('Failed to load logs: Invalid data format');
            }
        } catch (error) {
            console.error('Error in logs component:', error);
            toast.error('Failed to load user logs');
            setSystemLogs([]);
        } finally {
            setIsLoadingSystemLogs(false);
        }
    }, [user]);
    
    // Load password logs and system logs when user is authenticated
    useEffect(() => {
        if (user) {
            fetchPasswordLogs();
            fetchSystemLogs();
            // Initial security scan when page loads
            handleScan();
        }
    }, [user, fetchPasswordLogs, fetchSystemLogs, handleScan]);
    
    // Refresh security data when securityDataVersion changes
    // This ensures the security page updates when passwords are modified elsewhere
    useEffect(() => {
        if (user && securityDataVersion > 0) {
            // Refresh security scan data
            handleScan();
            toast.success('Security data refreshed');
        }
    }, [securityDataVersion, user, handleScan]);

    return (
        <PageLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Security</h1>
                <p className="text-gray-400">
                    Monitor and improve your online security
                </p>
            </div>

            <div className="mb-8">
                <Card className="bg-[#1a1f2e] border-gray-800 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Security Score Section */}
                            <div className="lg:w-1/3">
                                <h3 className="font-semibold text-white text-lg mb-4 flex items-center">
                                    <Shield className="mr-2 h-5 w-5" />
                                    Security Score
                                </h3>
                                <div className="bg-[#252b3b] p-6 rounded-lg">
                                    <div className="relative h-40 w-40 mx-auto mb-4">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#2A3347"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke={securityScore >= 70 ? '#10b981' : securityScore >= 40 ? '#f59e0b' : '#ef4444'}
                                                strokeWidth="3"
                                                strokeDasharray={`${securityScore}, 100`}
                                            />
                                        </svg>
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                            <span className="text-white text-3xl font-bold">{securityScore}%</span>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {securityScore >= 80 ? 'Excellent' : 
                                                 securityScore >= 60 ? 'Good' : 
                                                 securityScore >= 40 ? 'Fair' : 
                                                 securityScore >= 20 ? 'Poor' : 'Critical'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <Button
                                        onClick={handleScan}
                                        disabled={scanning}
                                        className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white mt-4"
                                    >
                                        {scanning ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Scanning...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Refresh Security Score
                                            </>
                                        )}
                                    </Button>
                                </div>
                                
                                {/* System Logs Section */}
                                <div className="mt-6">
                                    <h3 className="font-semibold text-white text-lg mb-4 flex items-center">
                                        <FileText className="mr-2 h-5 w-5" />
                                        Security Logs
                                    </h3>
                                    <div className="bg-[#252b3b] p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-sm text-gray-400">Recent system activity</p>
                                            <motion.button
                                                onClick={fetchSystemLogs}
                                                disabled={isLoadingSystemLogs}
                                                className="bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-md px-3 py-1.5 text-sm font-medium shadow-md transition-all duration-200 flex items-center justify-center"
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                {isLoadingSystemLogs ? (
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="h-4 w-4" />
                                                )}
                                            </motion.button>
                                        </div>
                                        
                                        {isLoadingSystemLogs ? (
                                            <motion.div 
                                                className="w-full bg-[#1a1f2e] h-2 rounded-full overflow-hidden mb-4 shadow-inner"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <motion.div 
                                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                ></motion.div>
                                            </motion.div>
                                        ) : (
                                            <AnimatePresence>
                                                {systemLogs.length > 0 ? (
                                                    <motion.div 
                                                        className="space-y-3 max-h-80 overflow-y-auto pr-1 hide-scrollbar"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        {systemLogs.map((log, index) => {
                                                            // Determine log type based on source and metadata
                                                            let logIcon;
                                                            let logTitle;
                                                            const logDetails = [];
                                                            
                                                            // Set color based on log level
                                                            const levelColor = 
                                                                log.level === 'error' || log.level === 'fatal' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 
                                                                log.level === 'warn' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 
                                                                'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
                                                        
                                                    // Determine log type and details based on source and metadata
                                                    if (log.source === 'passwords') {
                                                        logIcon = <Lock className="h-4 w-4" />;
                                                        logTitle = 'Password Activity';
                                                        
                                                        if (log.metadata) {
                                                            // Add website and username if available
                                                            if (log.metadata.website) {
                                                                logDetails.push(`Website: ${log.metadata.website}`);
                                                            }
                                                            if (log.metadata.username) {
                                                                logDetails.push(`Username: ${log.metadata.username}`);
                                                            }
                                                            
                                                            // Add security info if available
                                                            if (log.metadata.isCompromised) {
                                                                logDetails.push('Security: Compromised password detected');
                                                            }
                                                            if (log.metadata.isUrlUnsafe) {
                                                                logDetails.push('Security: Unsafe URL detected');
                                                            }
                                                            if (log.metadata.isReused) {
                                                                logDetails.push('Security: Password reuse detected');
                                                            }
                                                            
                                                            // Add action if available
                                                            if (log.metadata.action) {
                                                                const action = log.metadata.action.toString().replace('_', ' ');
                                                                logDetails.push(`Action: ${action}`);
                                                            }
                                                        }
                                                    } else if (log.source === 'auth-service' || log.source === 'auth') {
                                                        logIcon = <Shield className="h-4 w-4" />;
                                                        logTitle = 'Authentication';
                                                    } else if (log.source === 'scanner' || log.source === 'scanner-service') {
                                                        logIcon = <Scan className="h-4 w-4" />;
                                                        logTitle = 'Security Scan';
                                                        
                                                        if (log.metadata) {
                                                            if (log.metadata.url) {
                                                                logDetails.push(`URL: ${log.metadata.url}`);
                                                            }
                                                            if (log.metadata.threatTypes) {
                                                                logDetails.push(`Threats: ${log.metadata.threatTypes}`);
                                                            }
                                                        }
                                                    } else {
                                                        logIcon = <FileText className="h-4 w-4" />;
                                                        logTitle = log.source || 'System';
                                                    }
                                                    
                                                    // Format timestamp
                                                    const timestamp = new Date(log.timestamp);
                                                    const formattedDate = timestamp.toLocaleDateString();
                                                    const formattedTime = timestamp.toLocaleTimeString();
                                                    
                                                    return (
                                                        <motion.div 
                                                            key={log._id}
                                                            className={`p-3 rounded-lg text-sm border ${levelColor} backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200`}
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                                            whileHover={{ scale: 1.02, y: -2 }}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <motion.div 
                                                                    className={`p-2 rounded-full ${levelColor.split(' ')[0]} shadow-md`}
                                                                    whileHover={{ rotate: 15 }}
                                                                    transition={{ type: "spring", stiffness: 300 }}
                                                                >
                                                                    {logIcon}
                                                                </motion.div>
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="font-medium text-white">{logTitle}</span>
                                                                        <span className="text-gray-400 text-xs bg-[#0a0f1a]/50 px-2 py-0.5 rounded-full">
                                                                            {formattedDate}, {formattedTime}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-gray-300 mt-1.5">{log.message}</p>
                                                                    
                                                                    {logDetails.length > 0 && (
                                                                        <motion.div 
                                                                            className="mt-3 space-y-1.5 bg-[#0a0f1a]/30 p-2 rounded-md"
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            transition={{ duration: 0.2, delay: 0.1 }}
                                                                        >
                                                                            {logDetails.map((detail, idx) => (
                                                                                <motion.div 
                                                                                    key={idx} 
                                                                                    className="text-xs text-gray-400 flex items-center gap-1.5"
                                                                                    initial={{ opacity: 0, x: -5 }}
                                                                                    animate={{ opacity: 1, x: 0 }}
                                                                                    transition={{ duration: 0.2, delay: 0.1 + (idx * 0.05) }}
                                                                                >
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                                                    <span>{detail}</span>
                                                                                </motion.div>
                                                                            ))}
                                                                        </motion.div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                                    </motion.div>
                                                ) : (
                                                    <motion.div 
                                                        className="text-center py-8 text-gray-400 bg-[#0a0f1a]/30 rounded-lg border border-slate-800/60 shadow-inner"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <motion.div
                                                            initial={{ scale: 0.8, opacity: 0.5 }}
                                                            animate={{ scale: 1, opacity: 0.7 }}
                                                            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                                                        >
                                                            <FileText className="h-10 w-10 mx-auto mb-3" />
                                                        </motion.div>
                                                        <p className="text-sm font-medium">No system logs available</p>
                                                        <p className="text-xs mt-1 text-gray-500 max-w-xs mx-auto">System logs will appear here when there is activity in your account</p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Password Security Section */}
                            <div className="lg:w-2/3">
                                <h3 className="font-semibold text-white text-lg mb-4 flex items-center">
                                    <Lock className="mr-2 h-5 w-5" />
                                    Password Security
                                </h3>
                                
                                <div className="bg-[#252b3b] p-6 rounded-lg mb-6">
                                    {scanning && (
                                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-6">
                                            <div className="bg-blue-500 h-2 animate-progress"></div>
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-[#1a1f2e] p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-white mb-1">{scanStats.strongPasswords}</div>
                                            <div className="text-sm text-green-400">Strong Passwords</div>
                                        </div>
                                        <div className="bg-[#1a1f2e] p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-white mb-1">{scanStats.weakPasswords}</div>
                                            <div className="text-sm text-red-400">Weak Passwords</div>
                                        </div>
                                        <div className="bg-[#1a1f2e] p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-white mb-1">{scanStats.reusedPasswords}</div>
                                            <div className="text-sm text-amber-400">Reused Passwords</div>
                                        </div>
                                        <div className="bg-[#1a1f2e] p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-white mb-1">{scanStats.compromisedPasswords}</div>
                                            <div className="text-sm text-red-500">Compromised Passwords</div>
                                        </div>
                                    </div>
                                    
                                    {/* URL Scan Results */}
                                    <h4 className="text-white font-medium mb-4">URL Security Check</h4>
                                    <div className="flex space-x-2 mb-4">
                                        <input
                                            id="url-check"
                                            type="text"
                                            value={urlToCheck}
                                            onChange={(e) => setUrlToCheck(e.target.value)}
                                            placeholder="https://example.com"
                                            className="flex-1 bg-[#1a1f2e] border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                                        />
                                        <Button
                                            onClick={checkUrl}
                                            disabled={isLoadingUrlCheck || !urlToCheck}
                                            className="bg-[#4f46e5] hover:bg-[#4338ca] text-white"
                                        >
                                            {isLoadingUrlCheck ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Scan className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    
                                    {urlScanResults.length > 0 && (
                                        <div className="space-y-3">
                                            {urlScanResults.map((result, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex items-center p-3 ${result.isSafe ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'} rounded-lg`}
                                                >
                                                    <div className={`flex-shrink-0 ${result.isSafe ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} p-2 rounded-full mr-4`}>
                                                        {result.isSafe ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm">{result.url}</p>
                                                        <p className="text-gray-400 text-xs">
                                                            {result.isSafe ? 'Safe to visit' : `Threat detected: ${result.threatTypes?.join(', ') || 'Unknown threat'}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>


        </PageLayout>
    );
}
