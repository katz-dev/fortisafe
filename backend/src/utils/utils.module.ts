import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityUtilsService } from './security-utils.service';

@Module({
  imports: [ConfigModule],
  providers: [SecurityUtilsService],
  exports: [SecurityUtilsService],
})
export class UtilsModule {}
