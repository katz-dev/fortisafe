'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';

function TokenHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    async function handleAuth() {
      const accessToken = searchParams.get('access_token');
      const idToken = searchParams.get('id_token');

      if (accessToken && idToken) {
        console.log('Storing tokens...');
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('id_token', idToken);

        try {
          // Use the refreshProfile function from auth context
          await refreshProfile();
          console.log('Profile loaded successfully');
          router.push('/password');
        } catch (error) {
          console.error('Failed to load profile:', error);
          router.push('/login');
        }
      } else {
        console.error('Authentication tokens not found in URL');
        router.push('/login');
      }
    }

    void handleAuth();
  }, [router, searchParams, refreshProfile]);

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