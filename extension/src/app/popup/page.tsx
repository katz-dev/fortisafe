'use client';

import React from 'react';

export default function Popup() {
    return (
        <div className="p-4 max-w-sm bg-white rounded-lg border shadow-md">
            <h1 className="text-xl font-bold">My Extension</h1>
            <p className="mt-2">This is a browser extension built with Next.js and Tailwind CSS!</p>
            <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => alert('Button clicked!')}
            >
                Click Me
            </button>
        </div>
    );
} 