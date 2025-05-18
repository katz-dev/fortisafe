'use client';

import { ReactNode } from 'react';
import NavBar from '@/components/NavBar';

interface PageLayoutProps {
    children: ReactNode;
    className?: string;
}

export default function PageLayout({ children, className = '' }: PageLayoutProps) {
    return (
        <div className={`min-h-screen bg-[#080b15] relative ${className}`}>
            {/* Advanced background with subtle gradient and grid */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#080b15] to-[#070a14] opacity-80 z-0"></div>

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 z-0 opacity-10"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(100, 116, 139, 0.1) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(100, 116, 139, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                }}
            ></div>

            {/* Radial gradient accent in corner */}
            <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-indigo-900/10 rounded-full filter blur-3xl opacity-20 z-0"></div>

            <NavBar />
            <div className="container mx-auto px-4 py-8 relative z-10">
                {children}
            </div>
        </div>
    );
}
