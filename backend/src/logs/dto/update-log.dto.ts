import { PartialType } from '@nestjs/swagger';
import { CreateLogDto } from './create-log.dto';

// All fields are optional for updates
export class UpdateLogDto extends PartialType(CreateLogDto) {}
