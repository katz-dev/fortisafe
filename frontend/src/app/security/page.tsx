'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/PageLayout';
import { Shield, AlertTriangle, Check, Scan, X, RefreshCw } from 'lucide-react';

export default function SecurityPage() {
    const [scanning, setScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);

    const handleScan = () => {
        setScanning(true);
        // Simulate scan taking some time
        setTimeout(() => {
            setScanning(false);
            setScanComplete(true);
        }, 3000);
    };

    return (
        <PageLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Security</h1>
                <p className="text-gray-400">
                    Monitor and improve your online security
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <Card className="bg-[#1a1f2e] border-gray-800 shadow-lg">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-white text-lg mb-4 flex items-center">
                                <Scan className="mr-2 h-5 w-5" />
                                Security Scanner
                            </h3>

                            <div className="bg-[#252b3b] p-6 rounded-lg mb-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                                    <div className="mb-4 sm:mb-0">
                                        <h4 className="text-white font-medium mb-1">
                                            {scanning ? "Scanning your passwords..." : scanComplete ? "Scan Complete" : "Password Security Check"}
                                        </h4>
                                        <p className="text-sm text-gray-400">
                                            {scanning
                                                ? "Please wait while we analyze your passwords"
                                                : scanComplete
                                                    ? "We found some issues that need your attention"
                                                    : "Check for weak, reused or compromised passwords"}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleScan}
                                        disabled={scanning}
                                        className="bg-[#4f46e5] hover:bg-[#4338ca] text-white"
                                    >
                                        {scanning ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Scanning...
                                            </>
                                        ) : scanComplete ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Scan Again
                                            </>
                                        ) : (
                                            <>
                                                <Scan className="mr-2 h-4 w-4" />
                                                Start Scan
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {scanning && (
                                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-2 animate-progress"></div>
                                    </div>
                                )}

                                {scanComplete && (
                                    <div className="space-y-4">
                                        <div className="flex items-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                            <div className="flex-shrink-0 bg-red-500/20 text-red-400 p-2 rounded-full mr-4">
                                                <X className="h-4 w-4" />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-white text-sm">Weak password found on Gmail</p>
                                                <p className="text-gray-400 text-xs">Your password is too short and easy to guess</p>
                                            </div>
                                            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">Fix</Button>
                                        </div>

                                        <div className="flex items-center p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                            <div className="flex-shrink-0 bg-amber-500/20 text-amber-400 p-2 rounded-full mr-4">
                                                <AlertTriangle className="h-4 w-4" />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-white text-sm">Reused password on multiple sites</p>
                                                <p className="text-gray-400 text-xs">Same password used on GitHub and Dropbox</p>
                                            </div>
                                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">Fix</Button>
                                        </div>

                                        <div className="flex items-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                            <div className="flex-shrink-0 bg-green-500/20 text-green-400 p-2 rounded-full mr-4">
                                                <Check className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-white text-sm">10 strong passwords found</p>
                                                <p className="text-gray-400 text-xs">These passwords meet security requirements</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-white font-medium">Security History</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-[#252b3b] p-4 rounded-lg">
                                        <div className="flex items-center text-amber-400 mb-2">
                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                            <span className="font-medium">Security Alert</span>
                                        </div>
                                        <p className="text-sm text-gray-300">Possible phishing attempt blocked from mail.goggle.com</p>
                                        <p className="text-xs text-gray-400 mt-1">May 11, 2025 at 3:24 PM</p>
                                    </div>

                                    <div className="bg-[#252b3b] p-4 rounded-lg">
                                        <div className="flex items-center text-blue-400 mb-2">
                                            <Shield className="h-4 w-4 mr-2" />
                                            <span className="font-medium">Auto-Update</span>
                                        </div>
                                        <p className="text-sm text-gray-300">LinkedIn password automatically updated to strong password</p>
                                        <p className="text-xs text-gray-400 mt-1">May 9, 2025 at 10:12 AM</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="bg-[#1a1f2e] border-gray-800 shadow-lg mb-6">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-white text-lg mb-4">Security Score</h3>
                            <div className="relative h-32 w-32 mx-auto mb-4">
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
                                        stroke="#4f46e5"
                                        strokeWidth="3"
                                        strokeDasharray="75, 100"
                                    />
                                </svg>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                    <span className="text-white text-2xl font-bold">75%</span>
                                </div>
                            </div>
                            <p className="text-center text-gray-400 text-sm">Good protection level</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1f2e] border-gray-800 shadow-lg">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-white text-lg mb-4">Security Tips</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start">
                                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-300">Use a different password for each account</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-300">Enable two-factor authentication on critical accounts</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-300">Create passwords with at least 12 characters</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-300">Avoid using personal information in passwords</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-300">Update your passwords regularly</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageLayout>
    );
}
