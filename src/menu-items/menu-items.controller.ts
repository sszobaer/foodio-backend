import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { MenuItemsService } from './menu-items.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { QueryMenuItemDto } from './dto/query-menu-item.dto';
import { UpdateMenuItemAvailabilityDto } from './dto/update-menu-item-availability.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('menu-items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) { }

  @Get()
  findAll(@Query() queryDto: QueryMenuItemDto) {
    return this.menuItemsService.findAll(queryDto);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllForAdmin(@Query() queryDto: QueryMenuItemDto) {
    return this.menuItemsService.findAllForAdmin(queryDto);
  }

  @Get(':slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.menuItemsService.findOneBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createMenuItemDto: CreateMenuItemDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.menuItemsService.create(createMenuItemDto, image);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.menuItemsService.update(id, updateMenuItemDto, image);
  }

  @Patch(':id/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateAvailability(
    @Param('id') id: string,
    @Body() updateMenuItemAvailabilityDto: UpdateMenuItemAvailabilityDto,
  ) {
    return this.menuItemsService.updateAvailability(
      id,
      updateMenuItemAvailabilityDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.menuItemsService.remove(id);
  }
}