import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Password, PasswordDocument } from './entities/password.schema';
import { PasswordHistory, PasswordHistoryDocument } from './entities/password-history.schema';
import { CreatePasswordDto } from './dto/create-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PasswordHistoryResponseDto } from './dto/password-history.dto';
import { LogsService } from '../logs/logs.service';
import { SecurityUtilsService } from '../utils/security-utils.service';
import { LogLevel } from '../logs/entities/log.entity';

@Injectable()
export class PasswordsService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    @InjectModel(Password.name) private passwordModel: Model<PasswordDocument>,
    @InjectModel(PasswordHistory.name) private passwordHistoryModel: Model<PasswordHistoryDocument>,
    private configService: ConfigService,
    private logsService: LogsService,
    private securityUtilsService: SecurityUtilsService,
  ) {
    // Get encryption key from environment variables
    const key = this.configService.get<string>('PASSWORD_ENCRYPTION_KEY');
    if (!key) {
      throw new Error(
        'PASSWORD_ENCRYPTION_KEY is not defined in environment variables',
      );
    }
    // Create a fixed-length key using SHA-256
    this.encryptionKey = crypto.createHash('sha256').update(key).digest();
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    // Handle legacy format (without prefix)
    if (!encryptedText.startsWith('aes:') && encryptedText.includes(':')) {
      return this.decryptAES(encryptedText);
    }

    // Handle AES encrypted passwords with prefix
    if (encryptedText.startsWith('aes:')) {
      return this.decryptAES(encryptedText.substring(4));
    }

    // If we can't determine the format, try the default approach
    return this.decryptAES(encryptedText);
  }

  private decryptAES(encryptedText: string): string {
    const [ivHex, encryptedHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async create(
    userId: string,
    createPasswordDto: CreatePasswordDto,
    userEmail?: string,
  ): Promise<PasswordDocument> {
    // Check if the password is compromised
    const passwordCheck = await this.securityUtilsService.checkPasswordSecurity(
      createPasswordDto.password
    );
    
    // Check if the URL is safe (if provided)
    let urlCheck: { isSafe: boolean; threatTypes?: string[] } = { isSafe: true };
    if (createPasswordDto.url) {
      urlCheck = await this.securityUtilsService.checkUrlSafety(createPasswordDto.url);
    }
    
    // Check if the password is reused across other accounts
    const reusedCheck = await this.checkReusedPassword(
      userId,
      createPasswordDto.password
    );
    
    // Encrypt the password before storing
    const encryptedPassword = this.encrypt(createPasswordDto.password);

    // Create the new password with security information
    const newPassword = new this.passwordModel({
      ...createPasswordDto,
      userId,
      userEmail, // Store the user's email
      password: encryptedPassword,
      lastUpdated: createPasswordDto.lastUpdated || new Date(),
      // Add security information
      isCompromised: passwordCheck.isCompromised,
      breachCount: passwordCheck.breachCount,
      isUrlUnsafe: !urlCheck.isSafe,
      urlThreatTypes: urlCheck.threatTypes || [],
      isReused: reusedCheck.isReused,
      reusedIn: reusedCheck.usedIn,
      lastScanned: new Date()
    });

    console.log(
      `[PasswordsService] Creating password for user ID: ${userId}, Email: ${userEmail}`,
    );
    
    const savedPassword = await newPassword.save();
    
    // Create a log entry for the new password (without security information)
    await this.logsService.create({
      level: LogLevel.INFO,
      message: `New password created for ${createPasswordDto.website}`,
      source: 'passwords',
      userId,
      metadata: {
        website: createPasswordDto.website,
        username: createPasswordDto.username,
        url: createPasswordDto.url || 'Not provided',
        tags: createPasswordDto.tags || [],
        timestamp: new Date().toISOString(),
        action: 'create_password'
      }
    });
    
    return savedPassword;
  }

  async findAll(userId: string): Promise<PasswordDocument[]> {
    return this.passwordModel.find({ userId }).exec();
  }

  async findOne(userId: string, id: string): Promise<PasswordDocument> {
    const password = await this.passwordModel.findById(id).exec();

    if (!password) {
      throw new NotFoundException(`Password with ID ${id} not found`);
    }

    // Check if the password belongs to the user
    const passwordUserId = password.userId.toString();
    const requestUserId = userId.toString();
    console.log(`Comparing: "${passwordUserId}" === "${requestUserId}"`);
    if (passwordUserId !== requestUserId) {
      throw new UnauthorizedException(
        'You do not have permission to access this password',
      );
    }

    return password;
  }

  async update(
    userId: string,
    id: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<PasswordDocument> {
    // Get the original password before updating
    const originalPassword = await this.findOne(userId, id);
    
    // Track what fields are being updated for logging purposes
    const updatedFields: string[] = [];
    let shouldSaveHistory = false;
    
    // Security check flags
    let shouldCheckPassword = false;
    let shouldCheckUrl = false;
    let decryptedPassword: string | null = null;
    
    // If password is being updated, save the old one to history and check security
    if (updatePasswordDto.password) {
      updatedFields.push('password');
      shouldSaveHistory = true;
      shouldCheckPassword = true;
      // Save the original password to history before encrypting the new one
      await this.savePasswordToHistory(userId, originalPassword);
      // Keep the decrypted password for security checks
      decryptedPassword = updatePasswordDto.password;
      // Encrypt the new password
      updatePasswordDto.password = this.encrypt(updatePasswordDto.password);
    }
    
    // Check other fields for changes
    if (updatePasswordDto.website && updatePasswordDto.website !== originalPassword.website) {
      updatedFields.push('website');
      shouldSaveHistory = true;
    }
    if (updatePasswordDto.username && updatePasswordDto.username !== originalPassword.username) {
      updatedFields.push('username');
      shouldSaveHistory = true;
    }
    if (updatePasswordDto.url && updatePasswordDto.url !== originalPassword.url) {
      updatedFields.push('url');
      shouldCheckUrl = true;
    }
    if (updatePasswordDto.notes && updatePasswordDto.notes !== originalPassword.notes) {
      updatedFields.push('notes');
    }
    if (updatePasswordDto.tags && JSON.stringify(updatePasswordDto.tags) !== JSON.stringify(originalPassword.tags)) {
      updatedFields.push('tags');
    }

    // Update the lastUpdated field
    updatePasswordDto.lastUpdated = new Date();
    updatedFields.push('lastUpdated');
    
    // Perform security checks if needed
    if (shouldCheckPassword || shouldCheckUrl) {
      // For password security check
      if (shouldCheckPassword && decryptedPassword) {
        // Check if the password is compromised
        const passwordCheck = await this.securityUtilsService.checkPasswordSecurity(decryptedPassword);
        
        // Check if the password is reused across other accounts
        const reusedCheck = await this.checkReusedPassword(userId, decryptedPassword, id);
        
        // Update security information
        updatePasswordDto.isCompromised = passwordCheck.isCompromised;
        updatePasswordDto.breachCount = passwordCheck.breachCount;
        updatePasswordDto.isReused = reusedCheck.isReused;
        updatePasswordDto.reusedIn = reusedCheck.usedIn;
        
        // Add to updated fields
        updatedFields.push('isCompromised', 'breachCount', 'isReused', 'reusedIn');
        
        // Security logs removed
      }
      
      // For URL security check
      if (shouldCheckUrl && updatePasswordDto.url) {
        // Check if the URL is safe
        const urlCheck: { isSafe: boolean; threatTypes?: string[] } = 
          await this.securityUtilsService.checkUrlSafety(updatePasswordDto.url);
        
        // Update security information
        updatePasswordDto.isUrlUnsafe = !urlCheck.isSafe;
        updatePasswordDto.urlThreatTypes = urlCheck.threatTypes || [];
        
        // Add to updated fields
        updatedFields.push('isUrlUnsafe', 'urlThreatTypes');
      }
      
      // Update the last scanned timestamp
      updatePasswordDto.lastScanned = new Date();
      updatedFields.push('lastScanned');
    }

    // Apply the updates
    Object.assign(originalPassword, updatePasswordDto);
    const updatedPassword = await originalPassword.save();
    
    // Create a simplified log entry for the password update (without security information)
    await this.logsService.create({
      level: LogLevel.INFO,
      message: `Password entry updated for ${originalPassword.website}`,
      source: 'passwords',
      userId,
      metadata: {
        passwordId: id,
        website: originalPassword.website,
        username: originalPassword.username,
        updatedFields: updatedFields,
        oldWebsite: updatePasswordDto.website ? originalPassword.website : undefined,
        oldUsername: updatePasswordDto.username ? originalPassword.username : undefined,
        wasPasswordChanged: !!decryptedPassword,
        timestamp: new Date().toISOString(),
        action: 'update_password'
      }
    });
    
    return updatedPassword;
  }

  async remove(userId: string, id: string): Promise<void> {
    const password = await this.findOne(userId, id);
    
    // Save the password to history before deletion
    await this.savePasswordToHistory(userId, password);
    
    // Delete the password
    await password.deleteOne();
    
    // Create a log entry for the password deletion
    await this.logsService.create({
      level: LogLevel.INFO,
      message: `Password deleted for ${password.website}`,
      source: 'passwords',
      userId,
      metadata: {
        website: password.website,
        username: password.username,
        timestamp: new Date().toISOString(),
        action: 'delete_password'
      }
    });
  }
  
  /**
   * Save a password to the history collection
   */
  private async savePasswordToHistory(userId: string, password: PasswordDocument): Promise<PasswordHistoryDocument> {
    // Create a new history entry
    const historyEntry = new this.passwordHistoryModel({
      userId,
      passwordId: password._id,
      website: password.website,
      url: password.url,
      username: password.username,
      password: password.password, // Already encrypted
      createdAt: password.lastUpdated || new Date(), // Use lastUpdated or current date
      replacedAt: new Date(),
    });
    
    return historyEntry.save();
  }
  
  /**
   * Get password history for a specific password
   */
  async getPasswordHistory(userId: string, passwordId: string): Promise<PasswordHistoryResponseDto[]> {
    // Verify the password exists and belongs to the user
    await this.findOne(userId, passwordId);
    
    // Find all history entries for this password
    const historyEntries = await this.passwordHistoryModel
      .find({ 
        userId, 
        passwordId: new Types.ObjectId(passwordId) 
      })
      .sort({ replacedAt: -1 })
      .exec();
    
    // Map to DTOs and decrypt passwords
    return historyEntries.map(entry => {
      const dto = new PasswordHistoryResponseDto();
      dto.id = entry._id ? entry._id.toString() : '';
      dto.passwordId = entry.passwordId;
      dto.website = entry.website;
      dto.username = entry.username;
      dto.password = this.decrypt(entry.password);
      dto.createdAt = entry.createdAt;
      dto.replacedAt = entry.replacedAt;
      return dto;
    });
  }
  
  /**
   * Get all password history for a user
   */
  async getAllPasswordHistory(userId: string): Promise<Record<string, PasswordHistoryResponseDto[]>> {
    // Find all history entries for this user
    const historyEntries = await this.passwordHistoryModel
      .find({ userId })
      .sort({ replacedAt: -1 })
      .exec();
    
    // Group by passwordId
    const groupedEntries: Record<string, PasswordHistoryResponseDto[]> = {};
    
    historyEntries.forEach(entry => {
      const passwordId = entry.passwordId.toString();
      if (!groupedEntries[passwordId]) {
        groupedEntries[passwordId] = [];
      }
      
      const dto = new PasswordHistoryResponseDto();
      dto.id = entry._id ? entry._id.toString() : '';
      dto.passwordId = entry.passwordId;
      dto.website = entry.website;
      dto.username = entry.username;
      dto.password = this.decrypt(entry.password);
      dto.createdAt = entry.createdAt;
      dto.replacedAt = entry.replacedAt;
      
      groupedEntries[passwordId].push(dto);
    });
    
    return groupedEntries;
  }

  async decryptPassword(userId: string, id: string): Promise<string> {
    const password = await this.findOne(userId, id);
    return this.decrypt(password.password);
  }

  async checkDuplicate(
    userId: string,
    website: string,
    username: string,
  ): Promise<boolean> {
    const existingPassword = await this.passwordModel.findOne({
      userId,
      website,
      username,
    }).exec();

    return !!existingPassword;
  }

  async checkPasswordChange(
    userId: string,
    website: string,
    username: string,
    currentPassword?: string,
  ): Promise<{ hasChanged: boolean; lastUpdated: Date | null }> {
    const existingPassword = await this.passwordModel.findOne({
      userId,
      website,
      username,
    }).exec();

    if (!existingPassword) {
      return { hasChanged: false, lastUpdated: null };
    }

    // If current password is provided, compare with stored password
    if (currentPassword) {
      const storedDecryptedPassword = this.decrypt(existingPassword.password);
      const hasChanged = storedDecryptedPassword !== currentPassword;

      return {
        hasChanged,
        lastUpdated: existingPassword.lastUpdated,
      };
    }

    return {
      hasChanged: false,
      lastUpdated: existingPassword.lastUpdated,
    };
  }

  async updatePasswordByWebsiteAndUsername(
    userId: string,
    website: string,
    username: string,
    newPassword: string,
  ): Promise<PasswordDocument> {
    const existingPassword = await this.passwordModel.findOne({
      userId,
      website,
      username,
    }).exec();

    if (!existingPassword) {
      throw new NotFoundException(
        `Password not found for website ${website} and username ${username}`,
      );
    }

    // Encrypt the new password
    const encryptedPassword = this.encrypt(newPassword);

    // Update the password and lastUpdated timestamp
    const updatedPassword = await this.passwordModel
      .findByIdAndUpdate(
        existingPassword._id,
        {
          $set: {
            password: encryptedPassword,
            lastUpdated: new Date(),
          },
        },
        { new: true },
      )
      .exec();

    if (!updatedPassword) {
      throw new NotFoundException(
        `Password not found after update for website ${website} and username ${username}`,
      );
    }

    return updatedPassword;
  }

  /**
   * Check if a password is reused across multiple accounts
   * @param userId The user ID
   * @param password The password to check for reuse
   * @param currentPasswordId Optional ID to exclude from the check (useful when updating a password)
   * @returns Object containing whether the password is reused and sites where it's used
   */
  async checkReusedPassword(
    userId: string,
    password: string,
    currentPasswordId?: string,
  ): Promise<{ isReused: boolean; usedIn: { website: string; username: string }[] }> {
    // Get all passwords for the user
    const userPasswords = await this.passwordModel.find({ userId }).exec();
    
    const usedIn: { website: string; username: string }[] = [];
    
    // Check each password
    for (const storedPassword of userPasswords) {
      // Skip the current password if ID is provided
      if (currentPasswordId && storedPassword._id && storedPassword._id.toString() === currentPasswordId) {
        continue;
      }
      
      try {
        // Decrypt the stored password
        const decryptedPassword = this.decrypt(storedPassword.password);
        
        // If the password matches, add it to the list
        if (decryptedPassword === password) {
          usedIn.push({
            website: storedPassword.website,
            username: storedPassword.username,
          });
        }
      } catch (error) {
        console.error(`Error decrypting password: ${error.message}`);
        // Continue checking other passwords even if one fails
      }
    }
    
    return {
      isReused: usedIn.length > 0,
      usedIn,
    };
  }

  /**
   * Update security-related information for a password
   * @param securityInfo Object containing security information to update
   * @returns The updated password document
   */
  async updateSecurityInfo(securityInfo: {
    userId: string;
    passwordId: string;
    isCompromised?: boolean;
    breachCount?: number;
    isUrlUnsafe?: boolean;
    urlThreatTypes?: string[];
    isReused?: boolean;
    reusedIn?: { website: string; username: string }[];
    lastScanned?: Date;
  }): Promise<PasswordDocument> {
    // Find the password by ID and user ID
    const password = await this.findOne(securityInfo.userId, securityInfo.passwordId);
    
    // Update security-related fields if provided
    if (securityInfo.isCompromised !== undefined) {
      password.isCompromised = securityInfo.isCompromised;
    }
    
    if (securityInfo.breachCount !== undefined) {
      password.breachCount = securityInfo.breachCount;
    }
    
    if (securityInfo.isUrlUnsafe !== undefined) {
      password.isUrlUnsafe = securityInfo.isUrlUnsafe;
    }
    
    if (securityInfo.urlThreatTypes) {
      password.urlThreatTypes = securityInfo.urlThreatTypes;
    }
    
    if (securityInfo.isReused !== undefined) {
      password.isReused = securityInfo.isReused;
    }
    
    if (securityInfo.reusedIn) {
      password.reusedIn = securityInfo.reusedIn;
    }
    
    if (securityInfo.lastScanned) {
      password.lastScanned = securityInfo.lastScanned;
    }
    
    // Save and return the updated password
    return password.save();
  }
}
