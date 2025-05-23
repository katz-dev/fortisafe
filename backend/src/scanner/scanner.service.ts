import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateScannerDto } from './dto/create-scanner.dto';
import { UpdateScannerDto } from './dto/update-scanner.dto';
import {
  ScanResultDto,
  UrlThreatInfo,
  PasswordCheckResult,
} from './dto/scan-result.dto';
import { PasswordsService } from '../passwords/passwords.service';
import { SecurityUtilsService } from '../utils/security-utils.service';
import { LogsService } from '../logs/logs.service';
import { LogLevel } from '../logs/entities/log.entity';
import * as crypto from 'crypto';
import axios from 'axios';
import { Password, PasswordDocument } from '../passwords/entities/password.schema';

@Injectable()
export class ScannerService {
  private readonly googleSafeBrowsingApiKey: string | undefined;
  private readonly googleSafeBrowsingApiUrl =
    'https://safebrowsing.googleapis.com/v4/threatMatches:find';
  private readonly haveibeenpwnedApiUrl =
    'https://api.pwnedpasswords.com/range/';

  constructor(
    private configService: ConfigService,
    private passwordsService: PasswordsService,
    private securityUtilsService: SecurityUtilsService,
    private logsService: LogsService,
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

  async create(createScannerDto: CreateScannerDto): Promise<ScanResultDto> {
    const result: ScanResultDto = {
      urlResults: [],
      passwordResult: {
        isCompromised: false,
        breachCount: 0
      },
      isEmailCompromised: false,
      markedPasswords: [],
      weakPasswords: 0,
      reusedPasswords: 0,
      strongPasswords: 0,
      compromisedPasswords: 0
    };
    const userId = createScannerDto.userId;

    // Process URLs if provided
    if (createScannerDto.urls && createScannerDto.urls.length > 0) {
      result.urlResults = await this.scanUrls(createScannerDto.urls);

      // If userId is provided, update the password entries with URL safety information
      if (userId && createScannerDto.passwordId) {
        for (const urlResult of result.urlResults) {
          // Only update if the URL matches the one in the request
          if (createScannerDto.url === urlResult.url) {
            await this.passwordsService.updateSecurityInfo({
              userId,
              passwordId: createScannerDto.passwordId,
              isUrlUnsafe: !urlResult.isSafe,
              urlThreatTypes: urlResult.threatTypes || [],
              lastScanned: new Date()
            });
          }
        }
      }
    }

    // Process password if provided
    if (createScannerDto.password) {
      result.passwordResult = await this.checkPasswordSecurity(
        createScannerDto.password,
      );

      // If userId is provided, update the password entry with security information
      if (userId && createScannerDto.passwordId) {
        // Check if password is reused (if userId is provided)
        let reusedCheck: { isReused: boolean; usedIn: { website: string; username: string }[] } = {
          isReused: false,
          usedIn: []
        };
        if (userId) {
          reusedCheck = await this.passwordsService.checkReusedPassword(
            userId,
            createScannerDto.password,
            createScannerDto.passwordId
          );
        }

        await this.passwordsService.updateSecurityInfo({
          userId,
          passwordId: createScannerDto.passwordId,
          isCompromised: result.passwordResult.isCompromised,
          breachCount: result.passwordResult.breachCount || 0,
          isReused: reusedCheck.isReused,
          reusedIn: reusedCheck.usedIn,
          lastScanned: new Date()
        });
      }
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
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      // Process each URL individually using the SecurityUtilsService
      const results: UrlThreatInfo[] = [];

      for (const url of urls) {
        const urlCheck = await this.securityUtilsService.checkUrlSafety(url);
        results.push({
          url,
          isSafe: urlCheck.isSafe,
          threatTypes: urlCheck.threatTypes
        });
      }

      return results;
    } catch (error) {
      console.error('Error scanning URLs:', error);
      throw new HttpException(
        'Failed to scan URLs with Google Safe Browsing API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkPasswordSecurity(password: string): Promise<PasswordCheckResult> {
    try {
      // Use the SecurityUtilsService to check password security
      const result = await this.securityUtilsService.checkPasswordSecurity(password);
      return result;
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
        breachCount: 0,
      },
      markedPasswords: [],
      weakPasswords: 0,
      reusedPasswords: 0,
      strongPasswords: 0,
      compromisedPasswords: 0,
      isEmailCompromised: false
    };

    try {
      // Get all passwords for the user
      const passwords = await this.passwordsService.findAll(userId);

      // Collect all URLs to scan
      const urls = passwords.filter((p) => p.url).map((p) => p.url);
      const urlToPasswordMap = new Map<string, PasswordDocument[]>();

      // Create a mapping of URLs to password entries
      passwords.forEach(password => {
        if (password.url) {
          if (!urlToPasswordMap.has(password.url)) {
            urlToPasswordMap.set(password.url, []);
          }
          const entries = urlToPasswordMap.get(password.url);
          if (entries) {
            entries.push(password);
          }
        }
      });

      // Scan URLs if any exist
      if (urls.length > 0) {
        result.urlResults = await this.scanUrls(urls);

        // Update URL safety status in the database
        for (const urlResult of result.urlResults) {
          const passwordsWithUrl = urlToPasswordMap.get(urlResult.url) || [];

          for (const passwordEntry of passwordsWithUrl) {
            // Ensure the password entry has an _id before updating
            if (passwordEntry._id) {
              await this.passwordsService.updateSecurityInfo({
                userId,
                passwordId: passwordEntry._id.toString(),
                isUrlUnsafe: !urlResult.isSafe,
                urlThreatTypes: urlResult.threatTypes || [],
                lastScanned: new Date()
              });
            }
          }
        }
      }

      // Scan each password
      for (const password of passwords) {
        if (!password._id) continue;

        const decryptedPassword = await this.passwordsService.decryptPassword(userId, password._id.toString());
        const passwordCheck = await this.checkPasswordSecurity(decryptedPassword);
        const isWeak = !this.isStrongPassword(decryptedPassword);
        const reusedCheck = await this.passwordsService.checkReusedPassword(userId, decryptedPassword, password._id.toString());

        // Update password security info
        await this.passwordsService.updateSecurityInfo({
          userId,
          passwordId: password._id.toString(),
          isCompromised: passwordCheck.isCompromised,
          breachCount: passwordCheck.breachCount || 0,
          isReused: reusedCheck.isReused,
          reusedIn: reusedCheck.usedIn,
          lastScanned: new Date()
        });

        // Update result statistics
        if (passwordCheck.isCompromised) {
          result.compromisedPasswords++;
          result.markedPasswords.push({
            id: password._id.toString(),
            website: password.website,
            username: password.username,
            reason: 'compromised',
            isCompromised: true,
            breachCount: passwordCheck.breachCount || 0,
            isUrlUnsafe: password.isUrlUnsafe || false,
            urlThreatTypes: password.urlThreatTypes || [],
            isReused: password.isReused || false,
            reusedIn: password.reusedIn || [],
            lastScanned: new Date()
          });
        }
        if (isWeak) {
          result.weakPasswords++;
          if (!result.markedPasswords.some(p => p.website === password.website && p.username === password.username)) {
            result.markedPasswords.push({
              id: password._id.toString(),
              website: password.website,
              username: password.username,
              reason: 'weak',
              isCompromised: password.isCompromised || false,
              breachCount: password.breachCount || 0,
              isUrlUnsafe: password.isUrlUnsafe || false,
              urlThreatTypes: password.urlThreatTypes || [],
              isReused: password.isReused || false,
              reusedIn: password.reusedIn || [],
              lastScanned: new Date()
            });
          }
        }
        if (reusedCheck.isReused) {
          result.reusedPasswords++;
          if (!result.markedPasswords.some(p => p.website === password.website && p.username === password.username)) {
            result.markedPasswords.push({
              id: password._id.toString(),
              website: password.website,
              username: password.username,
              reason: 'reused',
              isCompromised: password.isCompromised || false,
              breachCount: password.breachCount || 0,
              isUrlUnsafe: password.isUrlUnsafe || false,
              urlThreatTypes: password.urlThreatTypes || [],
              isReused: true,
              reusedIn: reusedCheck.usedIn,
              lastScanned: new Date()
            });
          }
        }
        if (!isWeak && !passwordCheck.isCompromised && !reusedCheck.isReused) {
          result.strongPasswords++;
        }
      }

      return result;
    } catch (error) {
      console.error('Error scanning saved passwords:', error);
      throw new HttpException(
        'Failed to scan saved passwords',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Simple password strength check
   * @param password The password to check
   * @returns Whether the password is considered strong
   */
  private isStrongPassword(password: string): boolean {
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
