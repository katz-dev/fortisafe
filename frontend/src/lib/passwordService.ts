const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface LoginItem {
    id: string;
    site: string;
    username: string;
    password: string;
    strength: 'weak' | 'okay' | 'strong';
    website?: string;
    url?: string;
    notes?: string;
    lastUpdated?: Date;
    tags?: string[];
    securityRisk?: {
        isSafe: boolean;
        threatTypes?: string[];
    };
    compromiseInfo?: {
        isCompromised: boolean;
        breachCount: number;
    };
}

interface PasswordResponse {
    _id: string;
    userId: string;
    userEmail?: string;
    website: string;
    url?: string;
    username: string;
    password: string;
    notes?: string;
    tags?: string[];
    lastUpdated: string;
    createdAt: string;
    updatedAt: string;
}

// Helper function to calculate password strength
export const calculatePasswordStrength = (password: string): 'weak' | 'okay' | 'strong' => {
    const length = password.length;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const criteria = [
        length >= 8,
        hasUpperCase,
        hasLowerCase,
        hasDigit,
        hasSpecialChar
    ].filter(Boolean).length;

    if (criteria >= 4) return 'strong';
    if (criteria >= 2) return 'okay';
    return 'weak';
};

// Transform the API response to match our frontend model
const transformPasswordData = (data: PasswordResponse): LoginItem => {
    return {
        id: data._id,
        site: data.website,
        username: data.username,
        // We don't get the decrypted password directly from the list endpoint
        password: '********', // Placeholder, will need to be decrypted separately
        website: data.website,
        url: data.url,
        notes: data.notes,
        lastUpdated: new Date(data.lastUpdated),
        tags: data.tags,
        // We'll calculate strength later when we get the decrypted password
        strength: 'okay', // Default, will be updated when we get the real password
    };
};

// Get all passwords for the authenticated user
export async function getAllPasswords(): Promise<LoginItem[]> {
    const token = localStorage.getItem('access_token');

    if (!token) {
        throw new Error('No access token found');
    }

    try {
        const response = await fetch(`${backendUrl}/passwords`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch passwords: ${response.statusText}`);
        }

        const data: PasswordResponse[] = await response.json();
        return data.map(transformPasswordData);
    } catch (error) {
        console.error('Error fetching passwords:', error);
        throw error;
    }
}

// Get decrypted password for a specific password entry
export async function getDecryptedPassword(id: string): Promise<string> {
    const token = localStorage.getItem('access_token');

    if (!token) {
        throw new Error('No access token found');
    }

    try {
        const response = await fetch(`${backendUrl}/passwords/${id}/decrypt`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch decrypted password: ${response.statusText}`);
        }

        const data = await response.json();
        return data.password;
    } catch (error) {
        console.error('Error fetching decrypted password:', error);
        throw error;
    }
}

// Create a new password entry
export async function createPassword(passwordData: {
    website: string;
    url?: string;
    username: string;
    password: string;
    notes?: string;
    tags?: string[];
}): Promise<LoginItem> {
    const token = localStorage.getItem('access_token');

    if (!token) {
        throw new Error('No access token found');
    }

    try {
        const response = await fetch(`${backendUrl}/passwords`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(passwordData),
        });

        if (!response.ok) {
            throw new Error(`Failed to create password: ${response.statusText}`);
        }

        const data: PasswordResponse = await response.json();
        const transformedData = transformPasswordData(data);
        // We can set the real password and calculate strength since we just created it
        transformedData.password = passwordData.password;
        transformedData.strength = calculatePasswordStrength(passwordData.password);

        return transformedData;
    } catch (error) {
        console.error('Error creating password:', error);
        throw error;
    }
}

// Update an existing password entry
export async function updatePassword(id: string, passwordData: {
    website?: string;
    url?: string;
    username?: string;
    password?: string;
    notes?: string;
    tags?: string[];
}): Promise<LoginItem> {
    const token = localStorage.getItem('access_token');

    if (!token) {
        throw new Error('No access token found');
    }

    try {
        const response = await fetch(`${backendUrl}/passwords/${id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(passwordData),
        });

        if (!response.ok) {
            throw new Error(`Failed to update password: ${response.statusText}`);
        }

        const data: PasswordResponse = await response.json();
        return transformPasswordData(data);
    } catch (error) {
        console.error('Error updating password:', error);
        throw error;
    }
}

// Delete a password entry
export async function deletePassword(id: string): Promise<void> {
    const token = localStorage.getItem('access_token');

    if (!token) {
        throw new Error('No access token found');
    }

    try {
        const response = await fetch(`${backendUrl}/passwords/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to delete password: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error deleting password:', error);
        throw error;
    }
}

// Function to get the access token
function getAccessToken(): string | null {
    return localStorage.getItem('access_token');
}

// Check if a website and username combination already exists
export async function checkDuplicate(website: string, username: string): Promise<boolean> {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(
      `${backendUrl}/passwords/check-duplicate?website=${encodeURIComponent(
        website,
      )}&username=${encodeURIComponent(username)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to check for duplicate');
    }

    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking for duplicate:', error);
    return false;
  }
}

// Interface for the reused password check result
export interface ReusedPasswordResult {
  isReused: boolean;
  usedIn: { website: string; username: string }[];
}

export interface SecurityScanResult {
  urlResults: {
    url: string;
    isSafe: boolean;
    threatTypes?: string[];
  }[];
  passwordResult?: {
    isCompromised: boolean;
    breachCount: number;
  };
}

// Check security risks for a URL and password
export async function checkSecurityRisks(url?: string, password?: string): Promise<SecurityScanResult> {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${backendUrl}/scanner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        urls: url ? [url] : [],
        password: password
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to check security risks');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking security risks:', error);
    return { 
      urlResults: url ? [{
        url,
        isSafe: true // Default to safe if check fails
      }] : [],
      passwordResult: {
        isCompromised: false,
        breachCount: 0
      }
    };
  }
}

// Check if a password is reused across multiple accounts
export async function checkReusedPassword(
  password: string,
  currentPasswordId?: string
): Promise<ReusedPasswordResult> {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const url = currentPasswordId
      ? `${backendUrl}/passwords/check-reused?currentPasswordId=${encodeURIComponent(currentPasswordId)}`
      : `${backendUrl}/passwords/check-reused`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      throw new Error('Failed to check for reused password');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking for reused password:', error);
    return { isReused: false, usedIn: [] };
  }
}
