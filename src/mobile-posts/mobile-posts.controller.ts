import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import { MobilePostsService } from './mobile-posts.service';
import { CreateMobilePostDto } from './dto/create-mobile-post.dto';
import { UpdateMobilePostDto } from './dto/update-mobile-post.dto';
import { QueryMobilePostsDto } from './dto/query-mobile-posts.dto';
import { ApiResponse } from '../common/dto/api-response.dto';
import { ApiException } from '../common/exceptions/api.exception';
import { ERROR_CODES } from '../common/constants/error-codes';

@Controller('api/mobileposts')
export class MobilePostsController {
  constructor(private readonly mobilePostsService: MobilePostsService) {}

  @Get()
  async findAll(
    @Query(new ValidationPipe({ transform: true }))
    queryDto: QueryMobilePostsDto,
  ) {
    // Validate lang parameter
    const validLangs = ['en', 'tc', 'sc', 'all'];
    if (queryDto.lang && !validLangs.includes(queryDto.lang)) {
      throw new ApiException(
        ERROR_CODES.INVALID_LANG_VALUE,
        'lang must be one of: en, tc, sc, all',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate page and limit
    if (
      queryDto.page &&
      (queryDto.page < 1 || !Number.isInteger(queryDto.page))
    ) {
      throw new ApiException(
        ERROR_CODES.INVALID_PARAMETER_FORMAT,
        'page must be a positive integer',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      queryDto.limit &&
      (queryDto.limit < 1 ||
        queryDto.limit > 200 ||
        !Number.isInteger(queryDto.limit))
    ) {
      throw new ApiException(
        ERROR_CODES.INVALID_PARAMETER_FORMAT,
        'limit must be between 1 and 200',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { data, meta } = await this.mobilePostsService.findAll(queryDto);

    return ApiResponse.success(`${meta.total} records retrieved`, data, meta);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('lang') lang?: 'en' | 'tc' | 'sc' | 'all',
  ) {
    // Validate lang parameter
    const validLangs = ['en', 'tc', 'sc', 'all'];
    const selectedLang = lang || 'en';
    if (!validLangs.includes(selectedLang)) {
      throw new ApiException(
        ERROR_CODES.INVALID_LANG_VALUE,
        'lang must be one of: en, tc, sc, all',
        HttpStatus.BAD_REQUEST,
      );
    }

    const record = await this.mobilePostsService.findOne(id, selectedLang);
    return ApiResponse.success('record found', record);
  }

  @Post()
  async create(
    @Body(new ValidationPipe({ transform: true }))
    createDto: CreateMobilePostDto,
  ) {
    const record = await this.mobilePostsService.create(createDto);
    return ApiResponse.success('created', { id: record.id });
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true }))
    updateDto: UpdateMobilePostDto,
  ) {
    await this.mobilePostsService.update(id, updateDto);
    return ApiResponse.success('updated', { id });
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.mobilePostsService.remove(id);
    return ApiResponse.success('deleted', null);
  }

  @Get('districts/all')
  async getAllDistricts(@Query('lang') lang?: 'en' | 'tc' | 'sc' | 'all') {
    // Validate lang parameter
    const validLangs = ['en', 'tc', 'sc', 'all'];
    const selectedLang = lang || 'en';
    if (!validLangs.includes(selectedLang)) {
      throw new ApiException(
        ERROR_CODES.INVALID_LANG_VALUE,
        'lang must be one of: en, tc, sc, all',
        HttpStatus.BAD_REQUEST,
      );
    }

    const districts =
      await this.mobilePostsService.getAllDistricts(selectedLang);
    return ApiResponse.success(
      `${districts.length} districts retrieved`,
      districts,
    );
  }
}
