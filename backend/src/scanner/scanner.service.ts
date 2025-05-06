import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateScannerDto } from './dto/create-scanner.dto';
import { UpdateScannerDto } from './dto/update-scanner.dto';
import { ScanResultDto, UrlThreatInfo, PasswordCheckResult } from './dto/scan-result.dto';
import { PasswordsService } from '../passwords/passwords.service';
import * as crypto from 'crypto';
import axios from 'axios';
import { Password } from '../passwords/entities/password.schema';

@Injectable()
export class ScannerService {
  private readonly googleSafeBrowsingApiKey: string | undefined;
  private readonly googleSafeBrowsingApiUrl = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
  private readonly haveibeenpwnedApiUrl = 'https://api.pwnedpasswords.com/range/';

  constructor(
    private configService: ConfigService,
    private passwordsService: PasswordsService
  ) {
    this.googleSafeBrowsingApiKey = this.configService.get<string>('GOOGLE_SAFE_BROWSING_API_KEY');
    if (!this.googleSafeBrowsingApiKey) {
      console.warn('GOOGLE_SAFE_BROWSING_API_KEY is not defined in environment variables');
    }
  }

  async create(createScannerDto: CreateScannerDto): Promise<ScanResultDto> {
    const result: ScanResultDto = {};

    // Process URLs if provided
    if (createScannerDto.urls && createScannerDto.urls.length > 0) {
      result.urlResults = await this.scanUrls(createScannerDto.urls);
    }

    // Process password if provided
    if (createScannerDto.password) {
      result.passwordResult = await this.checkPasswordSecurity(createScannerDto.password);
    }

    // Process email if provided
    if (createScannerDto.email) {
      // For email checking, we would typically use a service like HaveIBeenPwned
      // This is a placeholder for future implementation
      result.isEmailCompromised = false;
    }

    return result;
  }

  async scanUrls(urls: string[]): Promise<UrlThreatInfo[]> {
    if (!this.googleSafeBrowsingApiKey) {
      throw new HttpException(
        'Google Safe Browsing API key is not configured',
        HttpStatus.SERVICE_UNAVAILABLE
      );
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
          threatEntries: urls.map(url => ({ url: url.trim() })),
        },
      };

      const response = await axios.post(apiUrl, requestBody);

      // Process response and create result objects
      const matches = response.data.matches || [];

      return urls.map(url => {
        const threatMatch = matches.find(match => match.threat.url === url);
        if (threatMatch) {
          return {
            url,
            isSafe: false,
            threatTypes: [threatMatch.threatType],
          };
        } else {
          return {
            url,
            isSafe: true,
          };
        }
      });
    } catch (error) {
      console.error('Error scanning URLs:', error);
      throw new HttpException(
        'Failed to scan URLs with Google Safe Browsing API',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async checkPasswordSecurity(password: string): Promise<PasswordCheckResult> {
    try {
      // Use k-anonymity model from HaveIBeenPwned API
      // We only send the first 5 characters of the SHA-1 hash
      const sha1Password = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = sha1Password.substring(0, 5);
      const suffix = sha1Password.substring(5);

      const response = await axios.get(`${this.haveibeenpwnedApiUrl}${prefix}`);

      // Parse the response which is a list of hash suffixes and counts
      const hashList = response.data.split('\r\n');
      const foundHash = hashList.find(line => line.startsWith(suffix));

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

  async scanSavedPasswords(userId: string): Promise<ScanResultDto> {
    const result: ScanResultDto = {
      urlResults: [],
      passwordResult: {
        isCompromised: false,
        breachCount: 0
      }
    };

    try {
      // Get all passwords for the user
      const passwords = await this.passwordsService.findAll(userId);

      // Collect all URLs to scan
      const urls = passwords
        .filter(p => p.url)
        .map(p => p.url);

      if (urls.length > 0) {
        result.urlResults = await this.scanUrls(urls);
      }

      // Check each password for compromise
      for (const passwordEntry of passwords) {
        // Ensure _id is properly typed and converted to string
        const passwordId = passwordEntry._id ? passwordEntry._id.toString() : '';

        // Decrypt the password
        const decryptedPassword = await this.passwordsService.decryptPassword(userId, passwordId);

        // Check if password is compromised
        const passwordCheck = await this.checkPasswordSecurity(decryptedPassword);

        // If any password is compromised, mark the overall result as compromised
        if (passwordCheck.isCompromised) {
          if (!result.passwordResult) {
            result.passwordResult = {
              isCompromised: false,
              breachCount: 0
            };
          }

          result.passwordResult.isCompromised = true;
          result.passwordResult.breachCount = (result.passwordResult.breachCount || 0) + (passwordCheck.breachCount || 0);
        }
      }

      return result;
    } catch (error) {
      console.error('Error scanning saved passwords:', error);
      throw new HttpException(
        'Failed to scan saved passwords',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  findAll() {
    return `This action returns all scanner`;
  }

  findOne(id: number) {
    return `This action returns a #${id} scanner`;
  }

  update(id: number, updateScannerDto: UpdateScannerDto) {
    return `This action updates a #${id} scanner`;
  }

  remove(id: number) {
    return `This action removes a #${id} scanner`;
  }
}
