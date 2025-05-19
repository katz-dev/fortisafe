import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Password, PasswordDocument } from './entities/password.schema';
import { CreatePasswordDto } from './dto/create-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class PasswordsService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    @InjectModel(Password.name) private passwordModel: Model<PasswordDocument>,
    private configService: ConfigService,
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
    // Encrypt the password before storing
    const encryptedPassword = this.encrypt(createPasswordDto.password);

    const newPassword = new this.passwordModel({
      ...createPasswordDto,
      userId,
      userEmail, // Store the user's email
      password: encryptedPassword,
      lastUpdated: createPasswordDto.lastUpdated || new Date(),
    });

    console.log(
      `[PasswordsService] Creating password for user ID: ${userId}, Email: ${userEmail}`,
    );
    return newPassword.save();
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
    // First check if the password exists and belongs to the user
    await this.findOne(userId, id);

    // If password field is provided, encrypt it
    const updateData = { ...updatePasswordDto };
    if (updateData.password) {
      updateData.password = this.encrypt(updateData.password);
    }

    // Update the lastUpdated field
    updateData.lastUpdated = new Date();

    const updatedPassword = await this.passwordModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedPassword) {
      throw new NotFoundException(
        `Password with ID ${id} not found after update`,
      );
    }

    return updatedPassword;
  }

  async remove(userId: string, id: string): Promise<PasswordDocument> {
    // First check if the password exists and belongs to the user
    await this.findOne(userId, id);

    const deletedPassword = await this.passwordModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedPassword) {
      throw new NotFoundException(
        `Password with ID ${id} not found after deletion`,
      );
    }

    return deletedPassword;
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
}
