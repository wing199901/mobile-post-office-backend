import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMobilePostsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  openAt?: string;

  @IsOptional()
  @IsString()
  mobileCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seq?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 20;

  @IsOptional()
  @IsIn(['id', 'seq', 'district', 'openHour', 'closeHour', 'name', 'dayOfWeek'])
  sortBy?: string = 'id';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @IsIn(['en', 'tc', 'sc', 'all'])
  lang?: 'en' | 'tc' | 'sc' | 'all' = 'en';
}
