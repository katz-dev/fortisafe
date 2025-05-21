import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { Log, LogDocument, LogLevel } from './entities/log.entity';

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(Log.name)
    private readonly logModel: Model<LogDocument>,
  ) {}

  async create(createLogDto: CreateLogDto): Promise<Log> {
    const newLog = new this.logModel(createLogDto);
    return newLog.save();
  }

  async findAll(query?: { level?: LogLevel; source?: string }): Promise<Log[]> {
    const filter: any = {};
    
    if (query?.level) {
      filter.level = query.level;
    }
    
    if (query?.source) {
      filter.source = query.source;
    }
    
    return this.logModel.find(filter).sort({ timestamp: -1 }).exec();
  }

  async findOne(id: string): Promise<Log> {
    const log = await this.logModel.findById(id).exec();
    if (!log) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }
    return log;
  }

  async update(id: string, updateLogDto: UpdateLogDto): Promise<Log> {
    const updatedLog = await this.logModel
      .findByIdAndUpdate(id, updateLogDto, { new: true })
      .exec();
      
    if (!updatedLog) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }
    
    return updatedLog;
  }

  async remove(id: string): Promise<void> {
    const result = await this.logModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }
  }
  
  async clearLogs(): Promise<void> {
    await this.logModel.deleteMany({}).exec();
  }
  
  async getLogsByLevel(level: LogLevel): Promise<Log[]> {
    return this.logModel.find({ level }).sort({ timestamp: -1 }).exec();
  }
  
  async getSystemLogs(): Promise<Log[]> {
    return this.logModel.find({ source: 'system' }).sort({ timestamp: -1 }).exec();
  }
  
  /**
   * Get logs for a specific user
   * @param userId The ID of the user to get logs for
   * @returns Array of logs for the specified user
   */
  async getUserLogs(userId: string): Promise<Log[]> {
    return this.logModel.find({ userId }).sort({ timestamp: -1 }).exec();
  }
}
