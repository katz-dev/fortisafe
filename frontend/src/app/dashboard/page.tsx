'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import PageLayout from '@/components/PageLayout';
import { getUserProfile } from '@/lib/api';
import { Shield, AlertTriangle, Check } from 'lucide-react';

// Types for profile data
type UserProfile = {
    auth0Profile?: {
        name?: string;
        email?: string;
        picture?: string;
    };
    _id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
};

export default function Dashboard() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
                    const profile = await getUserProfile();
                    setUserProfile(profile);
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // Get display name from profile
    const displayName = userProfile?.auth0Profile?.name ||
        (userProfile?.firstName && userProfile?.lastName ?
            `${userProfile.firstName} ${userProfile.lastName}` :
            userProfile?.email?.split('@')[0] || 'User');

    return (
        <PageLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Welcome{displayName ? `, ${displayName}` : ""}
                </h1>
                <p className="text-gray-400">
                    Here&apos;s a summary of your security status
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Security Score Card */}
                <Card className="bg-[#0a0f1a] border-slate-800/60 shadow-lg hover:border-slate-700/60 transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-white">Security Score</h3>
                            <div className="bg-blue-500/20 text-blue-400 p-2 rounded-full">
                                <Shield className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="relative h-2 bg-gray-800 rounded-full mb-2">
                            <div className="absolute top-0 left-0 h-2 w-2/3 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-blue-400 font-medium">Good</span>
                            <span className="text-gray-400">66%</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Weak Passwords Card */}
                <Card className="bg-[#0a0f1a] border-slate-800/60 shadow-lg hover:border-slate-700/60 transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-white">Weak Passwords</h3>
                            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-full">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-amber-500">3</p>
                        <p className="text-gray-400 text-sm mt-1">Passwords need attention</p>
                    </CardContent>
                </Card>

                {/* Protected Logins */}
                <Card className="bg-[#0a0f1a] border-slate-800/60 shadow-lg hover:border-slate-700/60 transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-white">Protected Logins</h3>
                            <div className="bg-green-500/20 text-green-400 p-2 rounded-full">
                                <Check className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-green-500">12</p>
                        <p className="text-gray-400 text-sm mt-1">Sites protected</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-[#0a0f1a] border-slate-800/60 shadow-lg hover:border-slate-700/60 transition-all duration-300 lg:col-span-2">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-white text-lg mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="animate-pulse space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="bg-gray-800 h-14 rounded"></div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center p-3 bg-[#1a1f2e] rounded-lg">
                                        <div className="flex-shrink-0 bg-green-500/20 text-green-400 p-2 rounded-full mr-4">
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm">Facebook.com login secured</p>
                                            <p className="text-gray-400 text-xs">Today at 10:30 AM</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center p-3 bg-[#1a1f2e] rounded-lg">
                                        <div className="flex-shrink-0 bg-blue-500/20 text-blue-400 p-2 rounded-full mr-4">
                                            <Shield className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm">Password updated for Amazon</p>
                                            <p className="text-gray-400 text-xs">Yesterday at 5:15 PM</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center p-3 bg-[#1a1f2e] rounded-lg">
                                        <div className="flex-shrink-0 bg-amber-500/20 text-amber-400 p-2 rounded-full mr-4">
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm">Weak password detected on GitHub</p>
                                            <p className="text-gray-400 text-xs">May 10, 2025</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#0a0f1a] border-slate-800/60 shadow-lg hover:border-slate-700/60 transition-all duration-300">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-white text-lg mb-4">Browser Protection</h3>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Phishing Protection</span>
                                <span className="text-green-400">Active</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Tracker Blocking</span>
                                <span className="text-green-400">Active</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Safe Browsing</span>
                                <span className="text-green-400">Active</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Password Monitoring</span>
                                <span className="text-amber-400">Warning</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Dark Web Monitoring</span>
                                <span className="text-gray-400">Not Active</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
