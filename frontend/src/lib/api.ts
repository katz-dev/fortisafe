const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL; // Fallback for safety

export async function getUserProfile() {
  const token = localStorage.getItem('access_token');

  if (!token) {
    console.error('No access token found in localStorage.');
    throw new Error('No access token found');
  }

  const response = await fetch(`${backendUrl}/auth/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });


  if (!response.ok) {
    // If response is 401 Unauthorized, the token might be invalid/expired
    if (response.status === 401) {
      console.error('Unauthorized: Token might be invalid or expired.');
      // Consider clearing the token here
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
    }
    console.error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to fetch profile: ${response.statusText}`);
  }

  const profileData = await response.json();
  return profileData;
}

export function logout() {
  // Clear tokens from localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('id_token');

  // Redirect to the login page
  window.location.href = '/login';
}