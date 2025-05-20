import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogsService } from './logs.service';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { Log, LogLevel } from './entities/log.entity';

@ApiTags('logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new log entry' })
  @ApiResponse({ status: 201, description: 'Log created successfully', type: Log })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createLogDto: CreateLogDto) {
    return this.logsService.create(createLogDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all logs with optional filtering' })
  @ApiQuery({ name: 'level', enum: LogLevel, required: false })
  @ApiQuery({ name: 'source', required: false })
  @ApiResponse({ status: 200, description: 'Returns all logs', type: [Log] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('level') level?: LogLevel,
    @Query('source') source?: string,
  ) {
    return this.logsService.findAll({ level, source });
  }

  @Get('system')
  @ApiOperation({ summary: 'Get all system logs' })
  @ApiResponse({ status: 200, description: 'Returns all system logs', type: [Log] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSystemLogs() {
    return this.logsService.getSystemLogs();
  }

  @Get('level/:level')
  @ApiOperation({ summary: 'Get logs by level' })
  @ApiParam({ name: 'level', enum: LogLevel })
  @ApiResponse({ status: 200, description: 'Returns logs filtered by level', type: [Log] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getLogsByLevel(@Param('level') level: LogLevel) {
    return this.logsService.getLogsByLevel(level);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific log by ID' })
  @ApiParam({ name: 'id', description: 'Log ID' })
  @ApiResponse({ status: 200, description: 'Returns the log', type: Log })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Log not found' })
  findOne(@Param('id') id: string) {
    return this.logsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a log' })
  @ApiParam({ name: 'id', description: 'Log ID' })
  @ApiResponse({ status: 200, description: 'Log updated successfully', type: Log })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Log not found' })
  update(@Param('id') id: string, @Body() updateLogDto: UpdateLogDto) {
    return this.logsService.update(id, updateLogDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a log' })
  @ApiParam({ name: 'id', description: 'Log ID' })
  @ApiResponse({ status: 204, description: 'Log deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Log not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.logsService.remove(id);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all logs' })
  @ApiResponse({ status: 204, description: 'All logs cleared successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.NO_CONTENT)
  clearLogs() {
    return this.logsService.clearLogs();
  }
}
