'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function TokenHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const idToken = searchParams.get('id_token');

    if (accessToken && idToken) {
      console.log('Storing tokens...'); // Optional: for debugging
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('id_token', idToken);

      // Redirect to the home page or dashboard after storing tokens
      router.push('/password');
    } else {
      // Handle the case where tokens are missing
      console.error('Authentication tokens not found in URL');
      // Optionally redirect to a login failed page or show an error message
      // router.push('/login'); // Redirect back to login for simplicity
    }
  }, [router, searchParams]); // Dependencies for the effect

  return null;
}

export default function AuthSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080b15]">
      <Suspense fallback={<p className="text-white">Processing authentication...</p>}>
        <TokenHandler />
      </Suspense>
      <p className="text-white">Processing authentication...</p>
    </div>
  );
} 