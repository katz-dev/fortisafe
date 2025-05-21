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
    // Security-related fields
    isCompromised?: boolean;
    breachCount?: number;
    isUrlUnsafe?: boolean;
    urlThreatTypes?: string[];
    isReused?: boolean;
    reusedIn?: { website: string; username: string }[];
    lastScanned?: Date;
    // UI-specific fields (not from API)
    securityRisk?: {
        isSafe: boolean;
        threatTypes?: string[];
    };
    compromiseInfo?: {
        isCompromised: boolean;
        breachCount: number;
    };
    // Optional field to store password history
    history?: PasswordHistoryItem[];
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
    // Security-related fields
    isCompromised?: boolean;
    breachCount?: number;
    isUrlUnsafe?: boolean;
    urlThreatTypes?: string[];
    isReused?: boolean;
    reusedIn?: { website: string; username: string }[];
    lastScanned?: string;
}

export interface PasswordHistoryItem {
    id: string;
    passwordId: string;
    website: string;
    username: string;
    password: string;
    createdAt: Date;
    replacedAt?: Date;
}

interface PasswordHistoryResponse {
    id: string;
    passwordId: string;
    website: string;
    username: string;
    password: string;
    createdAt: string;
    replacedAt?: string;
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
        // Security-related fields
        isCompromised: data.isCompromised,
        breachCount: data.breachCount,
        isUrlUnsafe: data.isUrlUnsafe,
        urlThreatTypes: data.urlThreatTypes,
        isReused: data.isReused,
        reusedIn: data.reusedIn,
        lastScanned: data.lastScanned ? new Date(data.lastScanned) : undefined,
        // We'll calculate strength later when we get the decrypted password
        strength: 'okay', // Default, will be updated when we get the real password
        // Map security data to UI-specific fields for backward compatibility
        securityRisk: data.isUrlUnsafe ? {
            isSafe: !data.isUrlUnsafe,
            threatTypes: data.urlThreatTypes
        } : undefined,
        compromiseInfo: data.isCompromised ? {
            isCompromised: data.isCompromised,
            breachCount: data.breachCount || 0
        } : undefined
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
  markedPasswords?: {
    id: string;
    isCompromised: boolean;
    isUrlUnsafe: boolean;
    website?: string;
    username?: string;
    breachCount?: number;
    urlThreatTypes?: string[];
    isReused?: boolean;
    reusedIn?: { website: string; username: string }[];
    lastScanned?: string;
  }[];
}

// Check security risks for a URL and password
export async function checkSecurityRisks(
  url?: string, 
  password?: string, 
  passwordId?: string
): Promise<SecurityScanResult> {
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
        password: password,
        passwordId: passwordId, // Include passwordId for the backend to update the database
        url: url // Include single URL for direct matching
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to check security risks');
    }

    const result = await response.json();
    return result;
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
      },
      markedPasswords: []
    };
  }
}

// Check if a password is reused across multiple accounts
export async function checkReusedPassword(
  password: string,
  currentPasswordId?: string
): Promise<ReusedPasswordResult> {
  const token = localStorage.getItem('access_token');

  if (!token) {
    throw new Error('No access token found');
  }

  try {
    const url = currentPasswordId
      ? `${backendUrl}/passwords/check-reused?currentPasswordId=${currentPasswordId}`
      : `${backendUrl}/passwords/check-reused`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      throw new Error(`Failed to check reused password: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking reused password:', error);
    throw error;
  }
}

// Get password history for a specific password
export async function getPasswordHistory(id: string): Promise<PasswordHistoryItem[]> {
  const token = localStorage.getItem('access_token');

  if (!token) {
    throw new Error('No access token found');
  }

  try {
    const response = await fetch(`${backendUrl}/passwords/${id}/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch password history: ${response.statusText}`);
    }

    const data: PasswordHistoryResponse[] = await response.json();
    
    // Transform the response data
    return data.map(item => ({
      id: item.id,
      passwordId: item.passwordId,
      website: item.website,
      username: item.username,
      password: item.password,
      createdAt: new Date(item.createdAt),
      replacedAt: item.replacedAt ? new Date(item.replacedAt) : undefined,
    }));
  } catch (error) {
    console.error('Error fetching password history:', error);
    throw error;
  }
}

// Get all password history for the user
export async function getAllPasswordHistory(): Promise<Record<string, PasswordHistoryItem[]>> {
  const token = localStorage.getItem('access_token');

  if (!token) {
    throw new Error('No access token found');
  }

  try {
    const response = await fetch(`${backendUrl}/passwords/history/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch all password history: ${response.statusText}`);
    }

    const data: Record<string, PasswordHistoryResponse[]> = await response.json();
    
    // Transform the response data
    const transformedData: Record<string, PasswordHistoryItem[]> = {};
    
    Object.keys(data).forEach(passwordId => {
      transformedData[passwordId] = data[passwordId].map(item => ({
        id: item.id,
        passwordId: item.passwordId,
        website: item.website,
        username: item.username,
        password: item.password,
        createdAt: new Date(item.createdAt),
        replacedAt: item.replacedAt ? new Date(item.replacedAt) : undefined,
      }));
    });
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching all password history:', error);
    throw error;
  }
}
