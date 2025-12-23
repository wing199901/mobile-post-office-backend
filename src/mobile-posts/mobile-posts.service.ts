import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { MobilePost } from './entities/mobile-post.entity';
import { District } from './entities/district.entity';
import { CreateMobilePostDto } from './dto/create-mobile-post.dto';
import { UpdateMobilePostDto } from './dto/update-mobile-post.dto';
import { QueryMobilePostsDto } from './dto/query-mobile-posts.dto';
import { ApiException } from '../common/exceptions/api.exception';
import { ERROR_CODES } from '../common/constants/error-codes';
import { MobilePostData } from './types/mobile-post-data.type';
import {
  MobilePostResponse,
  MobilePostResponseAll,
  MobilePostResponseSingle,
} from './types/mobile-post-response.type';

@Injectable()
export class MobilePostsService {
  constructor(
    @InjectRepository(MobilePost)
    private readonly mobilePostRepository: Repository<MobilePost>,
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
  ) {}

  async create(createDto: CreateMobilePostDto): Promise<MobilePost> {
    // Validate required fields
    const hasName = createDto.nameEN || createDto.nameTC || createDto.nameSC;
    const hasDistrict =
      createDto.districtEN || createDto.districtTC || createDto.districtSC;

    if (!hasName || !hasDistrict) {
      throw new ApiException(
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        'Missing required field: at least one of nameEN/nameTC/nameSC and one of districtEN/districtTC/districtSC',
        'invalid input',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Convert and validate coordinates
    const data = this.validateAndNormalizeData({ ...createDto });

    try {
      const mobilePost = this.mobilePostRepository.create(data);
      const saved = await this.mobilePostRepository.save(mobilePost);
      return Array.isArray(saved) ? saved[0] : saved;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ApiException(
          ERROR_CODES.DUPLICATE_RECORD,
          'Duplicate record',
          'conflict',
          HttpStatus.CONFLICT,
        );
      }
      throw new ApiException(
        ERROR_CODES.SERVER_ERROR,
        (error as Error).message,
        'server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(queryDto: QueryMobilePostsDto): Promise<{
    data: MobilePostResponse[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      lang: string;
    };
  }> {
    const {
      search,
      district,
      dayOfWeek,
      openAt,
      mobileCode,
      seq,
      page = 1,
      limit = 20,
      sortBy = 'id',
      sortDir = 'asc',
      lang = 'en',
    } = queryDto;

    // Validate openAt format if provided
    if (openAt && !/^([01]\d|2[0-3]):[0-5]\d$/.test(openAt)) {
      throw new ApiException(
        ERROR_CODES.INVALID_TIME_FORMAT,
        'openAt must be in HH:MM format with valid time (00:00-23:59)',
        'invalid input',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Build query
    const queryBuilder = this.mobilePostRepository.createQueryBuilder('mp');

    // Apply filters
    if (search) {
      this.applySearchFilter(queryBuilder, search);
    }

    if (district) {
      this.applyDistrictFilter(queryBuilder, district);
    }

    if (dayOfWeek) {
      queryBuilder.andWhere('mp.dayOfWeekCode = :dayOfWeek', { dayOfWeek });
    }

    if (openAt) {
      queryBuilder.andWhere('mp.openHour <= :openAt', { openAt });
      queryBuilder.andWhere('mp.closeHour > :openAt', { openAt });
    }

    if (mobileCode) {
      queryBuilder.andWhere('mp.mobileCode = :mobileCode', { mobileCode });
    }

    if (seq !== undefined) {
      queryBuilder.andWhere('mp.seq = :seq', { seq });
    }

    // Apply sorting
    this.applySorting(queryBuilder, sortBy, sortDir, lang);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get results
    const records = await queryBuilder.getMany();

    // Transform results based on language
    const result = records.map((record) => this.transformRecord(record, lang));

    return {
      data: result,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        lang,
      },
    };
  }

  async findOne(
    id: number,
    lang: 'en' | 'tc' | 'sc' | 'all' = 'en',
  ): Promise<MobilePostResponse> {
    const record = await this.mobilePostRepository.findOne({ where: { id } });

    if (!record) {
      throw new ApiException(
        ERROR_CODES.RECORD_NOT_FOUND,
        `record not found for id ${id}`,
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.transformRecord(record, lang);
  }

  async update(
    id: number,
    updateDto: UpdateMobilePostDto,
  ): Promise<MobilePost> {
    // Check if record exists
    const existing = await this.mobilePostRepository.findOne({
      where: { id },
    });

    if (!existing) {
      throw new ApiException(
        ERROR_CODES.RECORD_NOT_FOUND,
        `record not found for id ${id}`,
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if there are any updatable fields
    const updateKeys = Object.keys(updateDto);
    if (updateKeys.length === 0) {
      throw new ApiException(
        ERROR_CODES.NO_UPDATABLE_FIELDS,
        'No updatable fields provided',
        'invalid input',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate and normalize coordinates
    const data = this.validateAndNormalizeData({ ...updateDto });

    try {
      await this.mobilePostRepository.update(id, data);
      const updated = await this.mobilePostRepository.findOne({
        where: { id },
      });
      if (!updated) {
        throw new Error('Failed to retrieve updated record');
      }
      return updated;
    } catch (error) {
      throw new ApiException(
        ERROR_CODES.SERVER_ERROR,
        (error as Error).message,
        'server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: number): Promise<void> {
    const record = await this.mobilePostRepository.findOne({ where: { id } });

    if (!record) {
      throw new ApiException(
        ERROR_CODES.RECORD_NOT_FOUND,
        `record not found for id ${id}`,
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.mobilePostRepository.delete(id);
  }

  /**
   * Validates and normalizes mobile post data
   * Converts string coordinates to numbers and validates ranges
   */
  private validateAndNormalizeData(data: MobilePostData): Omit<
    MobilePostData,
    'latitude' | 'longitude'
  > & {
    latitude?: number;
    longitude?: number;
  } {
    const normalized = { ...data };

    // Validate and convert latitude
    if (normalized.latitude !== undefined) {
      const lat =
        typeof normalized.latitude === 'string'
          ? parseFloat(normalized.latitude)
          : normalized.latitude;

      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new ApiException(
          ERROR_CODES.INVALID_NUMERIC_VALUE,
          'latitude must be between -90 and 90',
          'invalid input',
          HttpStatus.BAD_REQUEST,
        );
      }
      normalized.latitude = lat;
    }

    // Validate and convert longitude
    if (normalized.longitude !== undefined) {
      const lng =
        typeof normalized.longitude === 'string'
          ? parseFloat(normalized.longitude)
          : normalized.longitude;

      if (isNaN(lng) || lng < -180 || lng > 180) {
        throw new ApiException(
          ERROR_CODES.INVALID_NUMERIC_VALUE,
          'longitude must be between -180 and 180',
          'invalid input',
          HttpStatus.BAD_REQUEST,
        );
      }
      normalized.longitude = lng;
    }

    return normalized as Omit<MobilePostData, 'latitude' | 'longitude'> & {
      latitude?: number;
      longitude?: number;
    };
  }

  private applySearchFilter(
    queryBuilder: SelectQueryBuilder<MobilePost>,
    search: string,
  ) {
    const searchPattern = `%${search}%`;

    // Search across all languages automatically
    queryBuilder.andWhere(
      `(mp.nameEN LIKE :search OR mp.nameTC LIKE :search OR mp.nameSC LIKE :search OR 
        mp.locationEN LIKE :search OR mp.locationTC LIKE :search OR mp.locationSC LIKE :search OR 
        mp.addressEN LIKE :search OR mp.addressTC LIKE :search OR mp.addressSC LIKE :search)`,
      { search: searchPattern },
    );
  }

  private applyDistrictFilter(
    queryBuilder: SelectQueryBuilder<MobilePost>,
    district: string,
  ) {
    const districtPattern = `%${district}%`;

    // Search district across all languages automatically
    queryBuilder.andWhere(
      `(mp.districtEN LIKE :district OR mp.districtTC LIKE :district OR mp.districtSC LIKE :district)`,
      { district: districtPattern },
    );
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<MobilePost>,
    sortBy: string,
    sortDir: 'asc' | 'desc',
    lang: string,
  ) {
    let sortColumn = 'mp.id';

    switch (sortBy) {
      case 'seq':
        sortColumn = 'mp.seq';
        break;
      case 'district':
        // Sort by district in the requested language
        if (lang === 'tc') {
          sortColumn = 'mp.districtTC';
        } else if (lang === 'sc') {
          sortColumn = 'mp.districtSC';
        } else {
          sortColumn = 'mp.districtEN';
        }
        break;
      case 'openHour':
        sortColumn = 'mp.openHour';
        break;
      case 'closeHour':
        sortColumn = 'mp.closeHour';
        break;
      case 'name':
        // Sort by name in the requested language
        if (lang === 'tc') {
          sortColumn = 'mp.nameTC';
        } else if (lang === 'sc') {
          sortColumn = 'mp.nameSC';
        } else {
          sortColumn = 'mp.nameEN';
        }
        break;
      case 'dayOfWeek':
        // Sort by day of week with Sunday (7) first
        // CASE WHEN dayOfWeekCode = 7 THEN 0 ELSE dayOfWeekCode END
        // This makes Sunday sort first, then Monday-Saturday (1-6)
        sortColumn =
          'CASE WHEN mp.dayOfWeekCode = 7 THEN 0 ELSE mp.dayOfWeekCode END';
        break;
      default:
        sortColumn = 'mp.id';
    }

    queryBuilder.orderBy(sortColumn, sortDir.toUpperCase() as 'ASC' | 'DESC');
  }

  private transformRecord(
    record: MobilePost,
    lang: 'en' | 'tc' | 'sc' | 'all',
  ): MobilePostResponse {
    if (lang === 'all') {
      // Return all fields including language-specific ones
      return {
        id: record.id,
        mobileCode: record.mobileCode,
        seq: record.seq,
        name: record.nameEN || record.nameTC || record.nameSC || '',
        nameEN: record.nameEN,
        nameTC: record.nameTC,
        nameSC: record.nameSC,
        district:
          record.districtEN || record.districtTC || record.districtSC || '',
        districtEN: record.districtEN,
        districtTC: record.districtTC,
        districtSC: record.districtSC,
        location:
          record.locationEN || record.locationTC || record.locationSC || '',
        locationEN: record.locationEN,
        locationTC: record.locationTC,
        locationSC: record.locationSC,
        address: record.addressEN || record.addressTC || record.addressSC || '',
        addressEN: record.addressEN,
        addressTC: record.addressTC,
        addressSC: record.addressSC,
        openHour: record.openHour,
        closeHour: record.closeHour,
        dayOfWeekCode: record.dayOfWeekCode,
        latitude: record.latitude ? record.latitude.toString() : null,
        longitude: record.longitude ? record.longitude.toString() : null,
      } as MobilePostResponseAll;
    } else {
      // Return language-neutral keys with fallback to English
      const suffix = lang.toUpperCase() as 'EN' | 'TC' | 'SC';
      const nameKey = `name${suffix}` as keyof MobilePost;
      const districtKey = `district${suffix}` as keyof MobilePost;
      const locationKey = `location${suffix}` as keyof MobilePost;
      const addressKey = `address${suffix}` as keyof MobilePost;

      return {
        id: record.id,
        mobileCode: record.mobileCode,
        seq: record.seq,
        name: record[nameKey] || record.nameEN || '',
        district: record[districtKey] || record.districtEN || '',
        location: record[locationKey] || record.locationEN || '',
        address: record[addressKey] || record.addressEN || '',
        openHour: record.openHour,
        closeHour: record.closeHour,
        dayOfWeekCode: record.dayOfWeekCode,
        latitude: record.latitude ? record.latitude.toString() : null,
        longitude: record.longitude ? record.longitude.toString() : null,
      } as MobilePostResponseSingle;
    }
  }

  async getAllDistricts(lang: 'en' | 'tc' | 'sc' | 'all' = 'en'): Promise<
    Array<{
      district: string;
      districtEN?: string;
      districtTC?: string;
      districtSC?: string;
    }>
  > {
    const districts = await this.districtRepository.find({
      order: { displayOrder: 'ASC' },
    });

    if (lang === 'all') {
      // Return all language fields
      return districts.map((item) => ({
        district: item.districtEN,
        districtEN: item.districtEN,
        districtTC: item.districtTC,
        districtSC: item.districtSC,
      }));
    } else {
      // Return specific language
      const suffix = lang.toUpperCase() as 'EN' | 'TC' | 'SC';
      const districtKey = `district${suffix}` as keyof District;

      return districts.map((item) => ({
        district: (item[districtKey] as string) || item.districtEN,
      }));
    }
  }
}
