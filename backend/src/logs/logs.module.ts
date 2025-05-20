import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { Log, LogSchema } from './entities/log.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
    AuthModule,
  ],
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService] // Export the service so other modules can use it for logging
})
export class LogsModule {}
