import { Module } from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { ScannerController } from './scanner.controller';
import { ConfigModule } from '@nestjs/config';
import { PasswordsModule } from '../passwords/passwords.module';
import { UtilsModule } from '../utils/utils.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [ConfigModule, PasswordsModule, UtilsModule, LogsModule],
  controllers: [ScannerController],
  providers: [ScannerService],
  exports: [ScannerService],
})
export class ScannerModule { }
