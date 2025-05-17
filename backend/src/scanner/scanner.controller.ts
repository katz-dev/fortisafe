import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { CreateScannerDto } from './dto/create-scanner.dto';
import { UpdateScannerDto } from './dto/update-scanner.dto';
import { ScanResultDto } from './dto/scan-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('scanner')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('scanner')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Post()
  @ApiOperation({
    summary: 'Scan URLs, passwords, or emails for security threats',
  })
  @ApiResponse({
    status: 201,
    description: 'The scan has been successfully performed.',
    type: ScanResultDto,
  })
  @ApiBody({ type: CreateScannerDto })
  create(@Body() createScannerDto: CreateScannerDto): Promise<ScanResultDto> {
    return this.scannerService.create(createScannerDto);
  }

  @Post('scan-saved-passwords')
  @ApiOperation({
    summary: 'Scan all saved passwords for the authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'The scan has been successfully performed.',
    type: ScanResultDto,
  })
  async scanSavedPasswords(@Request() req): Promise<ScanResultDto> {
    return this.scannerService.scanSavedPasswords(req.user.userId);
  }

  @Get()
  findAll() {
    return this.scannerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scannerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScannerDto: UpdateScannerDto) {
    return this.scannerService.update(+id, updateScannerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scannerService.remove(+id);
  }
}
