import { IsBoolean } from 'class-validator';

export class UpdateMenuItemAvailabilityDto {
  @IsBoolean()
  isAvailable: boolean;
}