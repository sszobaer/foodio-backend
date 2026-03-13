import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMenuItemDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  description: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'price must be a valid amount with up to 2 decimal places',
  })
  price: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}