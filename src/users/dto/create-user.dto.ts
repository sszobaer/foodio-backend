import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  address: string;

  @IsString()
  @MinLength(6)
  passwordHash: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}