'use client';

import { ReactNode } from 'react';
import NavBar from '@/components/NavBar';

interface PageLayoutProps {
    children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
    return (
        <div className="min-h-screen bg-[#080b15]">
            <NavBar />
            <div className="container mx-auto px-4 py-8">
                {children}
            </div>
        </div>
    );
}
