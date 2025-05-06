import { Module } from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { ScannerController } from './scanner.controller';
import { ConfigModule } from '@nestjs/config';
import { PasswordsModule } from '../passwords/passwords.module';

@Module({
  imports: [
    ConfigModule,
    PasswordsModule
  ],
  controllers: [ScannerController],
  providers: [ScannerService],
  exports: [ScannerService]
})
export class ScannerModule { }
