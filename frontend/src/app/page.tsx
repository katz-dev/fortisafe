'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile } from '@/lib/api'; // Import the API function

// Define a type for the user profile data (adjust based on actual data structure)
type UserProfile = {
  auth0Profile: {
    email?: string;
    name?: string;
    picture?: string;
  };
};

export default function Home() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        // If fetching fails (e.g., no token, 401 error), redirect to login
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b15]">
        <p className="text-white">Loading user profile...</p>
        {/* Add a spinner maybe */}
      </div>
    );
  }

  // Error state is handled by redirecting, but you could show a message too
  // if (error) {
  //   return <div className="flex min-h-screen items-center justify-center bg-[#080b15]"><p className="text-red-500">Error: {error}</p></div>;
  // }

  // Only render profile if loading is complete and no error occurred (which would have redirected)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[#080b15] text-white">
      <h1 className="text-2xl mb-4">Welcome!</h1>
      {userProfile ? (
        <div>
          <p>Email: {userProfile.auth0Profile.email || 'N/A'}</p>
          <p>Name: {userProfile.auth0Profile.name || 'N/A'}</p>
          {userProfile.auth0Profile.picture && (
            <img src={userProfile.auth0Profile.picture} alt="User profile" className="rounded-full w-16 h-16 mt-2" />
          )}
          {/* Display other profile information here */}
        </div>
      ) : (
        <p>No profile data loaded.</p> // Should ideally not be reached due to redirect
      )}
    </main>
  );
}