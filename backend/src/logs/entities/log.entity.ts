import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export type LogDocument = Log & Document;

@Schema({ timestamps: true })
export class Log {
  @ApiProperty({ enum: LogLevel, default: LogLevel.INFO })
  @Prop({ required: true, enum: LogLevel, default: LogLevel.INFO })
  level: LogLevel;

  @ApiProperty()
  @Prop({ required: true })
  message: string;

  @ApiProperty({ required: false })
  @Prop()
  source?: string;

  @ApiProperty({ required: false })
  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  @ApiProperty()
  @Prop({ default: Date.now })
  timestamp: Date;
  
  @ApiProperty({ required: false })
  @Prop()
  userId?: string;
}

export const LogSchema = SchemaFactory.createForClass(Log);
