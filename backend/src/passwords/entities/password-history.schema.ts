import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PasswordHistoryDocument = PasswordHistory & Document;

@Schema({
  timestamps: true,
})
export class PasswordHistory {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The user ID who owns this password history entry',
  })
  @Prop({ required: true })
  userId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the password this history entry belongs to',
  })
  @Prop({ required: true, type: Types.ObjectId })
  passwordId: Types.ObjectId;

  @ApiProperty({
    example: 'Google',
    description:
      'The website or service name at the time of this password version',
  })
  @Prop({ required: true })
  website: string;

  @ApiProperty({
    example: 'https://google.com',
    description: 'The URL of the website at the time of this password version',
  })
  @Prop()
  url: string;

  @ApiProperty({
    example: 'user@example.com',
    description:
      'The username or email used for the account at the time of this password version',
  })
  @Prop({ required: true })
  username: string;

  @ApiProperty({
    example: 'encrypted-password-string',
    description: 'The encrypted password that was previously used',
  })
  @Prop({ required: true })
  password: string;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'When this password version was created',
  })
  @Prop({ required: true })
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-15T00:00:00.000Z',
    description: 'When this password version was replaced by a newer one',
  })
  @Prop()
  replacedAt: Date;
}

export const PasswordHistorySchema =
  SchemaFactory.createForClass(PasswordHistory);
