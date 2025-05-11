'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/PageLayout';
import { Settings as SettingsIcon, Moon, Sun, Globe, Bell, Lock, Shield, Monitor, Eye } from 'lucide-react';

export default function SettingsPage() {
    const [darkMode, setDarkMode] = useState(true);
    const [notifications, setNotifications] = useState({
        securityAlerts: true,
        passwordBreaches: true,
        newLogins: false,
        tips: true,
    });

    const [securitySettings, setSecuritySettings] = useState({
        autoLock: true,
        passwordCheck: true,
        phishingProtection: true,
        trackingProtection: false,
    });

    const handleToggle = (setting: string, category: 'notifications' | 'security') => {
        if (category === 'notifications') {
            setNotifications(prev => ({
                ...prev,
                [setting]: !prev[setting as keyof typeof notifications]
            }));
        } else {
            setSecuritySettings(prev => ({
                ...prev,
                [setting]: !prev[setting as keyof typeof securitySettings]
            }));
        }
    };

    return (
        <PageLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-gray-400">
                    Configure your application preferences
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6 lg:col-span-2">
                    {/* Appearance Settings */}
                    <Card className="bg-[#1a1f2e] border-gray-800 shadow-lg">
                        <CardContent className="p-6">
                            <h3 className="text-white text-lg font-medium mb-6 flex items-center">
                                <Monitor className="mr-2 h-5 w-5" />
                                Appearance
                            </h3>

                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#252b3b] rounded-lg">
                                    <div className="flex items-center">
                                        {darkMode ? (
                                            <Moon className="h-5 w-5 mr-3 text-blue-400" />
                                        ) : (
                                            <Sun className="h-5 w-5 mr-3 text-amber-400" />
                                        )}
                                        <div>
                                            <h4 className="text-white font-medium">Theme</h4>
                                            <p className="text-gray-400 text-sm">
                                                {darkMode ? 'Dark mode is enabled' : 'Light mode is enabled'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 md:mt-0 flex">
                                        <button
                                            onClick={() => setDarkMode(false)}
                                            className={`p-2 rounded-l-md ${!darkMode ? 'bg-[#4f46e5] text-white' : 'bg-gray-800 text-gray-400'}`}
                                        >
                                            <Sun className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDarkMode(true)}
                                            className={`p-2 rounded-r-md ${darkMode ? 'bg-[#4f46e5] text-white' : 'bg-gray-800 text-gray-400'}`}
                                        >
                                            <Moon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-[#252b3b] rounded-lg">
                                    <div className="flex items-center">
                                        <Globe className="h-5 w-5 mr-3 text-green-400" />
                                        <div>
                                            <h4 className="text-white font-medium">Language</h4>
                                            <p className="text-gray-400 text-sm">
                                                English (United States)
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="border-gray-700 text-white hover:bg-gray-800"
                                    >
                                        Change
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Settings */}
                    <Card className="bg-[#1a1f2e] border-gray-800 shadow-lg">
                        <CardContent className="p-6">
                            <h3 className="text-white text-lg font-medium mb-6 flex items-center">
                                <Shield className="mr-2 h-5 w-5" />
                                Security
                            </h3>

                            <div className="space-y-4">
                                <ToggleOption
                                    icon={<Lock className="h-5 w-5 text-blue-400" />}
                                    title="Auto-Lock"
                                    description="Automatically lock your vault after 5 minutes of inactivity"
                                    isEnabled={securitySettings.autoLock}
                                    onToggle={() => handleToggle('autoLock', 'security')}
                                />

                                <ToggleOption
                                    icon={<Eye className="h-5 w-5 text-purple-400" />}
                                    title="Password Strength Check"
                                    description="Analyze your passwords and alert you to weak or compromised ones"
                                    isEnabled={securitySettings.passwordCheck}
                                    onToggle={() => handleToggle('passwordCheck', 'security')}
                                />

                                <ToggleOption
                                    icon={<Shield className="h-5 w-5 text-green-400" />}
                                    title="Phishing Protection"
                                    description="Block known phishing websites and suspicious domains"
                                    isEnabled={securitySettings.phishingProtection}
                                    onToggle={() => handleToggle('phishingProtection', 'security')}
                                />

                                <ToggleOption
                                    icon={<Eye className="h-5 w-5 text-red-400" />}
                                    title="Tracking Protection"
                                    description="Block trackers and protect your privacy while browsing"
                                    isEnabled={securitySettings.trackingProtection}
                                    onToggle={() => handleToggle('trackingProtection', 'security')}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Notifications Settings */}
                    <Card className="bg-[#1a1f2e] border-gray-800 shadow-lg">
                        <CardContent className="p-6">
                            <h3 className="text-white text-lg font-medium mb-6 flex items-center">
                                <Bell className="mr-2 h-5 w-5" />
                                Notifications
                            </h3>

                            <div className="space-y-4">
                                <ToggleOption
                                    title="Security Alerts"
                                    description="Get notified about important security issues"
                                    isEnabled={notifications.securityAlerts}
                                    onToggle={() => handleToggle('securityAlerts', 'notifications')}
                                />

                                <ToggleOption
                                    title="Password Breaches"
                                    description="Be alerted when your passwords appear in data breaches"
                                    isEnabled={notifications.passwordBreaches}
                                    onToggle={() => handleToggle('passwordBreaches', 'notifications')}
                                />

                                <ToggleOption
                                    title="New Device Logins"
                                    description="Get notified when a new device logs into your account"
                                    isEnabled={notifications.newLogins}
                                    onToggle={() => handleToggle('newLogins', 'notifications')}
                                />

                                <ToggleOption
                                    title="Security Tips & Updates"
                                    description="Receive tips on improving your security"
                                    isEnabled={notifications.tips}
                                    onToggle={() => handleToggle('tips', 'notifications')}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Advanced Settings */}
                    <Card className="bg-[#1a1f2e] border-gray-800 shadow-lg">
                        <CardContent className="p-6">
                            <h3 className="text-white text-lg font-medium mb-4 flex items-center">
                                <SettingsIcon className="mr-2 h-5 w-5" />
                                Advanced
                            </h3>

                            <div className="space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full border-gray-700 text-white hover:bg-gray-800 justify-start"
                                >
                                    Sync Options
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full border-gray-700 text-white hover:bg-gray-800 justify-start"
                                >
                                    Import Data
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full border-gray-700 text-white hover:bg-gray-800 justify-start"
                                >
                                    Export Data
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full border-gray-700 text-white hover:bg-gray-800 justify-start text-red-400 hover:text-red-400"
                                >
                                    Clear All Data
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageLayout>
    );
}

// Toggle Option Component
function ToggleOption({
    icon,
    title,
    description,
    isEnabled,
    onToggle
}: {
    icon?: React.ReactNode;
    title: string;
    description: string;
    isEnabled: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 bg-[#252b3b] rounded-lg">
            <div className="flex items-start">
                {icon && <span className="mr-3 mt-1">{icon}</span>}
                <div>
                    <h4 className="text-white font-medium">{title}</h4>
                    <p className="text-gray-400 text-sm">{description}</p>
                </div>
            </div>

            <div className="flex-shrink-0">
                <button
                    onClick={onToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isEnabled ? 'bg-[#4f46e5]' : 'bg-gray-700'
                        }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>
        </div>
    );
}
