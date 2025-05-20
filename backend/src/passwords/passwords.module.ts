import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PasswordsService } from './passwords.service';
import { PasswordsController } from './passwords.controller';
import { Password, PasswordSchema } from './entities/password.schema';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Password.name, schema: PasswordSchema },
    ]),
    ConfigModule,
    LogsModule,
  ],
  controllers: [PasswordsController],
  providers: [PasswordsService],
  exports: [PasswordsService],
})
export class PasswordsModule {}
