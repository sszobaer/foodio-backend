import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);

    return {
      message: result.message,
      accessToken: result.accessToken,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);

    return {
      message: result.message,
      accessToken: result.accessToken,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: User) {
    return this.authService.getMe(user.id);
  }

  @Post('logout')
  logout() {
    return {
      message: 'Logout successful',
    };
  }
}