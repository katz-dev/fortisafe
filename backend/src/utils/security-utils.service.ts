import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class SecurityUtilsService {
  private readonly googleSafeBrowsingApiKey: string | undefined;
  private readonly googleSafeBrowsingApiUrl =
    'https://safebrowsing.googleapis.com/v4/threatMatches:find';
  private readonly haveibeenpwnedApiUrl =
    'https://api.pwnedpasswords.com/range/';

  constructor(
    private configService: ConfigService,
  ) {
    this.googleSafeBrowsingApiKey = this.configService.get<string>(
      'GOOGLE_SAFE_BROWSING_API_KEY',
    );
    if (!this.googleSafeBrowsingApiKey) {
      console.warn(
        'GOOGLE_SAFE_BROWSING_API_KEY is not defined in environment variables',
      );
    }
  }

  /**
   * Check if a password has been compromised in known data breaches
   * @param password The password to check
   * @returns Object containing whether the password is compromised and breach count
   */
  async checkPasswordSecurity(password: string): Promise<{ isCompromised: boolean; breachCount: number }> {
    try {
      // Use k-anonymity model from HaveIBeenPwned API
      // We only send the first 5 characters of the SHA-1 hash
      const sha1Password = crypto
        .createHash('sha1')
        .update(password)
        .digest('hex')
        .toUpperCase();
      const prefix = sha1Password.substring(0, 5);
      const suffix = sha1Password.substring(5);

      const response = await axios.get(`${this.haveibeenpwnedApiUrl}${prefix}`);

      // Parse the response which is a list of hash suffixes and counts
      const hashList = response.data.split('\r\n');
      const foundHash = hashList.find((line) => line.startsWith(suffix));

      if (foundHash) {
        const breachCount = parseInt(foundHash.split(':')[1], 10);
        return {
          isCompromised: true,
          breachCount,
        };
      }

      return {
        isCompromised: false,
        breachCount: 0,
      };
    } catch (error) {
      console.error('Error checking password security:', error);
      return {
        isCompromised: false,
        breachCount: 0,
      };
    }
  }

  /**
   * Check if a URL is safe using Google Safe Browsing API
   * @param url The URL to check
   * @returns Object containing whether the URL is safe and threat types if any
   */
  async checkUrlSafety(url: string): Promise<{ isSafe: boolean; threatTypes?: string[] }> {
    if (!this.googleSafeBrowsingApiKey) {
      console.warn('Google Safe Browsing API key is not configured');
      return { isSafe: true }; // Default to safe if API key is not available
    }

    try {
      const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${this.googleSafeBrowsingApiKey}`;

      const requestBody = {
        client: {
          clientId: 'fortisafe',
          clientVersion: '1.0.0',
        },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION',
          ],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: url.trim() }],
        },
      };

      const response = await axios.post(apiUrl, requestBody);

      // Process response and check if the URL is in the matches
      const matches = response.data.matches || [];
      const threatMatch = matches.find((match) => match.threat.url === url);

      if (threatMatch) {
        return {
          isSafe: false,
          threatTypes: [threatMatch.threatType],
        };
      } else {
        return {
          isSafe: true,
        };
      }
    } catch (error) {
      console.error('Error checking URL safety:', error);
      return { isSafe: true }; // Default to safe on error
    }
  }

  /**
   * Simple password strength check
   * @param password The password to check
   * @returns Whether the password is considered strong
   */
  isStrongPassword(password: string): boolean {
    // Password should be at least 8 characters long
    if (password.length < 8) return false;
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) return false;
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) return false;
    
    // Check for at least one number
    if (!/[0-9]/.test(password)) return false;
    
    // Check for at least one special character
    if (!/[^A-Za-z0-9]/.test(password)) return false;
    
    return true;
  }
}
