'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import PageLayout from '@/components/PageLayout';
import { getUserProfile } from '@/lib/api';
import Image from 'next/image';
import { User, Mail, AtSign, Lock, Save } from 'lucide-react';

// Types for profile data
type UserProfile = {
    auth0Profile?: {
        name?: string;
        email?: string;
        picture?: string;
        nickname?: string;
        sub?: string;
    };
    _id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
};

export default function ProfilePage() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
                    const profile = await getUserProfile();
                    setUserProfile(profile);

                    // Pre-populate form data with user profile
                    setFormData({
                        firstName: profile.firstName || profile.auth0Profile?.name?.split(' ')[0] || '',
                        lastName: profile.lastName || profile.auth0Profile?.name?.split(' ')[1] || '',
                        email: profile.email || profile.auth0Profile?.email || '',
                        username: profile.auth0Profile?.nickname || '',
                    });
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate API call to update profile
        setTimeout(() => {
            setIsSaving(false);
            // Show success notification or update UI
        }, 1000);
    };

    const profilePicture = userProfile?.auth0Profile?.picture || userProfile?.picture;
    const userId = userProfile?.auth0Profile?.sub?.split('|')[1] || '';

    return (
        <PageLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
                <p className="text-gray-400">
                    Manage your account settings and profile information
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="bg-[#1a1f2e] border-gray-800 shadow-lg h-fit">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center">
                            <div className="relative mb-4">
                                {profilePicture ? (
                                    <Image
                                        src={profilePicture}
                                        alt="Profile picture"
                                        width={100}
                                        height={100}
                                        className="rounded-full border-2 border-[#4f46e5]"
                                    />
                                ) : (
                                    <div className="w-24 h-24 bg-[#4f46e5] rounded-full flex items-center justify-center text-2xl text-white font-bold">
                                        {formData.firstName?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <button className="absolute bottom-0 right-0 bg-[#4f46e5] rounded-full p-1.5 border-2 border-[#1a1f2e]">
                                    <User className="h-4 w-4 text-white" />
                                </button>
                            </div>

                            <h3 className="text-white text-lg font-medium mt-2">{formData.firstName} {formData.lastName}</h3>
                            <p className="text-gray-400 text-sm">@{formData.username || 'username'}</p>

                            <div className="w-full border-t border-gray-800 my-4"></div>

                            <div className="w-full space-y-3 text-sm">
                                <div className="flex items-center text-gray-400">
                                    <Mail className="h-4 w-4 mr-3" />
                                    <span>{formData.email}</span>
                                </div>
                                <div className="flex items-center text-gray-400">
                                    <AtSign className="h-4 w-4 mr-3" />
                                    <span>User ID: {userId || '12345'}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#1a1f2e] border-gray-800 shadow-lg lg:col-span-2">
                    <CardContent className="p-6">
                        <h3 className="text-white text-lg font-medium mb-6">Personal Information</h3>

                        {isLoading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-10 bg-gray-800 rounded w-full"></div>
                                <div className="h-10 bg-gray-800 rounded w-full"></div>
                                <div className="h-10 bg-gray-800 rounded w-full"></div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
                                        <div className="relative">
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                className="bg-[#252b3b] border-gray-700 pl-10 text-white"
                                                placeholder="First Name"
                                            />
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
                                        <div className="relative">
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                className="bg-[#252b3b] border-gray-700 pl-10 text-white"
                                                placeholder="Last Name"
                                            />
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="bg-[#252b3b] border-gray-700 pl-10 text-white"
                                            placeholder="Email"
                                            disabled={!!userProfile?.auth0Profile?.email}
                                        />
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                    </div>
                                    {userProfile?.auth0Profile?.email && (
                                        <p className="text-xs text-gray-500">Email is managed by your authentication provider and cannot be changed here.</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-gray-300">Username</Label>
                                    <div className="relative">
                                        <Input
                                            id="username"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="bg-[#252b3b] border-gray-700 pl-10 text-white"
                                            placeholder="Username"
                                        />
                                        <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className="bg-[#4f46e5] hover:bg-[#4338ca]"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-[#1a1f2e] border-gray-800 shadow-lg lg:col-span-3">
                    <CardContent className="p-6">
                        <h3 className="text-white text-lg font-medium mb-6 flex items-center">
                            <Lock className="mr-2 h-5 w-5" />
                            Security Settings
                        </h3>

                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#252b3b] rounded-lg">
                                <div>
                                    <h4 className="text-white font-medium">Password</h4>
                                    <p className="text-gray-400 text-sm">Update your password</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="mt-3 md:mt-0 border-gray-700 text-white hover:bg-gray-800"
                                >
                                    Change Password
                                </Button>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#252b3b] rounded-lg">
                                <div>
                                    <h4 className="text-white font-medium">Two Factor Authentication</h4>
                                    <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="mt-3 md:mt-0 border-gray-700 text-white hover:bg-gray-800"
                                >
                                    Enable 2FA
                                </Button>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#252b3b] rounded-lg">
                                <div>
                                    <h4 className="text-white font-medium">Connected Accounts</h4>
                                    <p className="text-gray-400 text-sm">Manage your connected accounts and services</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="mt-3 md:mt-0 border-gray-700 text-white hover:bg-gray-800"
                                >
                                    Manage
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
