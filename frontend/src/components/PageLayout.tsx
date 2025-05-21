'use client';

import { ReactNode } from 'react';
import NavBar from '@/components/NavBar';

interface PageLayoutProps {
    children: ReactNode;
    className?: string;
}

export default function PageLayout({ children, className = '' }: PageLayoutProps) {
    return (
        <div className={`min-h-screen bg-[#040510] relative ${className}`}>
            {/* Advanced background with subtle gradient and grid */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#050818] via-[#040510] to-[#030408] opacity-100 z-0"></div>

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 z-0 opacity-15"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(100, 116, 139, 0.12) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(100, 116, 139, 0.12) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                }}
            ></div>            {/* Radial gradient accent in corner */}
            <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-indigo-900/10 rounded-full filter blur-3xl opacity-25 z-0"></div>

            {/* Additional gradients for visual depth */}
            <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-blue-900/5 rounded-full filter blur-3xl opacity-20 z-0"></div>

            <NavBar />
            <div className="container mx-auto px-4 py-8 relative z-10">
                {children}
            </div>
        </div>
    );
}
