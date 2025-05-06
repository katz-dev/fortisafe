import { PartialType } from '@nestjs/swagger';
import { CreateScannerDto } from './create-scanner.dto';

export class UpdateScannerDto extends PartialType(CreateScannerDto) { }
