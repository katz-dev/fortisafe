const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL; // Fallback for safety

export async function getUserProfile() {
  const token = localStorage.getItem('access_token');

  if (!token) {
    console.error('No access token found in localStorage.');
    throw new Error('No access token found');
  }

  try {
    const response = await fetch(`${backendUrl}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      // If response is 401 Unauthorized, the token might be invalid/expired
      if (response.status === 401) {
        console.error('Unauthorized: Token might be invalid or expired.');
        // Clear the tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        throw new Error('Session expired. Please login again.');
      }

      // Try to parse error response as JSON
      let errorMessage = `Failed to fetch profile: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If we can't parse JSON, use the status text
        console.error('Failed to parse error response:', e);
      }

      throw new Error(errorMessage);
    }

    const profileData = await response.json();
    return profileData;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

export function logout() {
  // Show confirmation dialog
  if (window.confirm('Are you sure you want to log out?')) {
    // Redirect to backend logout endpoint which will handle Auth0 logout
    window.location.href = `${backendUrl}/auth/logout`;
  }
}