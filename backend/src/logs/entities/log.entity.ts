import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

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
  @Prop({ required: true, enum: LogLevel, default: LogLevel.INFO })
  level: LogLevel;

  @Prop({ required: true })
  message: string;

  @Prop()
  source?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const LogSchema = SchemaFactory.createForClass(Log);
