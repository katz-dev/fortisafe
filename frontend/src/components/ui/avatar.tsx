'use client';

import Image from 'next/image';

interface AvatarProps {
    src?: string;
    alt?: string;
    className?: string;
}

export function Avatar({ src, alt = 'Avatar', className = '' }: AvatarProps) {
    return (
        <div className={`rounded-full overflow-hidden w-12 h-12 bg-muted ${className}`}>
            {src ? (
                <Image
                    src={src}
                    alt={alt}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-medium">
                    {alt.slice(0, 2).toUpperCase()}
                </div>
            )}
        </div>
    );
}
