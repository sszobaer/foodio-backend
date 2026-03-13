import { IsIn, IsOptional, IsString } from 'class-validator';

export class QueryMenuItemDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'])
  isAvailable?: string;

  @IsOptional()
  @IsString()
  @IsIn(['latest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'])
  sortBy?: string;
}