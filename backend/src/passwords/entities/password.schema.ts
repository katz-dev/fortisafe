import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PasswordDocument = Password & Document;

@Schema({
  timestamps: true,
})
export class Password {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The user ID who owns this password',
  })
  @Prop({ required: true })
  userId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user who owns this password',
  })
  @Prop()
  userEmail: string;

  @ApiProperty({
    example: 'Google',
    description: 'The website or service name',
  })
  @Prop({ required: true })
  website: string;

  @ApiProperty({
    example: 'https://google.com',
    description: 'The URL of the website',
  })
  @Prop()
  url: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The username or email used for the account',
  })
  @Prop({ required: true })
  username: string;

  @ApiProperty({
    example: 'encrypted-password-string',
    description: 'The encrypted password',
  })
  @Prop({ required: true })
  password: string;

  @ApiProperty({
    example: 'Personal Google account',
    description: 'Notes about this password entry',
  })
  @Prop()
  notes: string;

  @ApiProperty({
    example: ['work', 'important'],
    description: 'Tags for categorizing passwords',
  })
  @Prop([String])
  tags: string[];

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'When the password was last updated',
  })
  @Prop({ default: Date.now })
  lastUpdated: Date;

  @ApiProperty({
    example: true,
    description: 'Whether the password has been found in data breaches',
  })
  @Prop({ default: false })
  isCompromised: boolean;

  @ApiProperty({
    example: 42,
    description: 'Number of times the password has been found in data breaches',
  })
  @Prop({ default: 0 })
  breachCount: number;

  @ApiProperty({
    example: false,
    description: 'Whether the URL is flagged as unsafe by security scanners',
  })
  @Prop({ default: false })
  isUrlUnsafe: boolean;

  @ApiProperty({
    example: ['MALWARE', 'SOCIAL_ENGINEERING'],
    description: 'Types of threats associated with the URL',
  })
  @Prop([String])
  urlThreatTypes: string[];

  @ApiProperty({
    example: true,
    description: 'Whether this password is reused across multiple accounts',
  })
  @Prop({ default: false })
  isReused: boolean;

  @ApiProperty({
    example: ['Google', 'Facebook'],
    description: 'List of other websites where this password is used',
  })
  @Prop({ type: [{ website: String, username: String }], default: [] })
  reusedIn: { website: string; username: string }[];

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'When the password was last scanned for security issues',
  })
  @Prop()
  lastScanned: Date;
}

export const PasswordSchema = SchemaFactory.createForClass(Password);
