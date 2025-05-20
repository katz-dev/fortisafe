'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X, Shield, Lock, Activity, Settings, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/app/contexts/auth-context';

export default function NavBar() {
    const { user, isLoading, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const pathname = usePathname();
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Define navigation items
    const navItems = [
        { name: 'Passwords', href: '/password', icon: Lock },
        { name: 'Security', href: '/security', icon: Activity },
    ];

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(!isProfileMenuOpen);
    };
    
    // Close profile menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        }
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Get display name from profile
    const displayName = user?.auth0Profile?.name ||
        user?.auth0Profile?.nickname ||
        (user?.firstName && user?.lastName ?
            `${user.firstName} ${user.lastName}` :
            user?.email?.split('@')[0] || 'User');

    const profilePicture = user?.auth0Profile?.picture || user?.picture;

    return (
        <nav className="bg-[#0a0f1a]/90 backdrop-blur-md border-b border-gray-800/60 relative z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo and Brand */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Link href="/" className="text-white text-xl font-bold">
                                Fortisafe
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:block ml-10">
                            <div className="flex space-x-4">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive
                                                ? 'bg-[#4f46e5] text-white'
                                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5 mr-2" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* User Profile and Mobile Menu Button */}
                    <div className="flex items-center">
                        {isLoading ? (
                            <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
                        ) : user ? (
                            <div className="relative ml-3" ref={profileMenuRef}>
                                <div>
                                    <button
                                        onClick={toggleProfileMenu}
                                        className="flex items-center text-sm focus:outline-none"
                                        id="user-menu"
                                        aria-haspopup="true"
                                    >
                                        <span className="sr-only">Open user menu</span>
                                        <div className="flex items-center gap-2">
                                            <span className="hidden md:block text-gray-300 mr-2">{displayName}</span>
                                            {profilePicture ? (
                                                <Image
                                                    className="h-8 w-8 rounded-full"
                                                    src={profilePicture}
                                                    alt={`${displayName}'s profile picture`}
                                                    width={32}
                                                    height={32}
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-[#4f46e5] flex items-center justify-center text-white">
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                </div>

                                {/* Profile dropdown */}
                                {isProfileMenuOpen && (
                                    <div
                                        className="fixed right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-[#1a1f2e] ring-1 ring-black ring-opacity-5 z-[9999] origin-top-right"
                                        style={{
                                            top: 'auto',
                                            position: 'absolute',
                                            right: '0',
                                            marginTop: '0.5rem'
                                        }}
                                        role="menu"
                                        aria-orientation="vertical"
                                        aria-labelledby="user-menu"
                                    >
                                        <div className="px-4 py-2 text-sm text-gray-200 border-b border-gray-800">
                                            <div className="font-semibold">{displayName}</div>
                                            <div className="text-gray-400 text-xs truncate">{user.auth0Profile?.email}</div>
                                        </div>
                                        <Link
                                            href="/profile"
                                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                                            role="menuitem"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            <UserIcon className="mr-3 h-4 w-4" />
                                            Your Profile
                                        </Link>
                                        <Link
                                            href="/settings"
                                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                                            role="menuitem"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            <Settings className="mr-3 h-4 w-4" />
                                            Settings
                                        </Link>
                                        <button
                                            onClick={signOut}
                                            className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
                                            role="menuitem"
                                        >
                                            <LogOut className="mr-3 h-4 w-4" />
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <Link href="/login">
                                    <Button variant="default" className="bg-[#4f46e5] hover:bg-[#4338ca]">
                                        Sign In
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile menu button */}
                        <div className="ml-4 flex md:hidden">
                            <button
                                onClick={toggleMenu}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
                                aria-controls="mobile-menu"
                                aria-expanded="false"
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMenuOpen ? (
                                    <X className="block h-6 w-6" />
                                ) : (
                                    <Menu className="block h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="md:hidden" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive
                                        ? 'bg-[#4f46e5] text-white'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                        }`}
                                    onClick={toggleMenu}
                                >
                                    <Icon className="w-5 h-5 mr-2" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
}
