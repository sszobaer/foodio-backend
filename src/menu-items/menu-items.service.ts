import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { MenuItem } from './entities/menu-item.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { QueryMenuItemDto } from './dto/query-menu-item.dto';
import { UpdateMenuItemAvailabilityDto } from './dto/update-menu-item-availability.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class MenuItemsService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemsRepository: Repository<MenuItem>,

    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createMenuItemDto: CreateMenuItemDto,
    image?: Express.Multer.File,
  ): Promise<MenuItem> {
    const category = await this.categoriesRepository.findOne({
      where: {
        id: createMenuItemDto.categoryId,
        isActive: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const normalizedName = createMenuItemDto.name.trim();

    const existingMenuItem = await this.menuItemsRepository.findOne({
      where: { name: normalizedName },
    });

    if (existingMenuItem) {
      throw new ConflictException('Menu item name already exists');
    }

    const slug = await this.generateUniqueSlug(normalizedName);

    let imageUrl: string | null = null;

    if (image) {
      imageUrl = await this.cloudinaryService.uploadImage(image);
    }

    const menuItem = this.menuItemsRepository.create({
      categoryId: createMenuItemDto.categoryId,
      name: normalizedName,
      slug,
      description: createMenuItemDto.description.trim(),
      price: createMenuItemDto.price,
      imageUrl,
      isAvailable: createMenuItemDto.isAvailable ?? true,
      isActive: createMenuItemDto.isActive ?? true,
    });

    return this.menuItemsRepository.save(menuItem);
  }

  async findAll(queryDto: QueryMenuItemDto): Promise<MenuItem[]> {
    const queryBuilder = this.menuItemsRepository
      .createQueryBuilder('menuItem')
      .leftJoinAndSelect('menuItem.category', 'category')
      .where('menuItem.isActive = :isActive', { isActive: true })
      .andWhere('category.isActive = :categoryIsActive', {
        categoryIsActive: true,
      });

    this.applyPublicFilters(queryBuilder, queryDto);
    this.applySorting(queryBuilder, queryDto.sortBy);

    return queryBuilder.getMany();
  }

  async findAllForAdmin(queryDto: QueryMenuItemDto): Promise<MenuItem[]> {
    const queryBuilder = this.menuItemsRepository
      .createQueryBuilder('menuItem')
      .leftJoinAndSelect('menuItem.category', 'category');

    if (queryDto.search?.trim()) {
      queryBuilder.andWhere('LOWER(menuItem.name) LIKE :search', {
        search: `%${queryDto.search.trim().toLowerCase()}%`,
      });
    }

    if (queryDto.category?.trim()) {
      queryBuilder.andWhere('category.slug = :categorySlug', {
        categorySlug: queryDto.category.trim().toLowerCase(),
      });
    }

    if (queryDto.isAvailable === 'true') {
      queryBuilder.andWhere('menuItem.isAvailable = true');
    }

    if (queryDto.isAvailable === 'false') {
      queryBuilder.andWhere('menuItem.isAvailable = false');
    }

    this.applySorting(queryBuilder, queryDto.sortBy);

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<MenuItem> {
    const menuItem = await this.menuItemsRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return menuItem;
  }

  async findOneBySlug(slug: string): Promise<MenuItem> {
    const menuItem = await this.menuItemsRepository.findOne({
      where: {
        slug: slug.trim().toLowerCase(),
        isActive: true,
      },
      relations: ['category'],
    });

    if (!menuItem || !menuItem.category?.isActive) {
      throw new NotFoundException('Menu item not found');
    }

    return menuItem;
  }

  async update(
    id: string,
    updateMenuItemDto: UpdateMenuItemDto,
    image?: Express.Multer.File,
  ): Promise<MenuItem> {
    const menuItem = await this.findOne(id);

    if (updateMenuItemDto.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: {
          id: updateMenuItemDto.categoryId,
          isActive: true,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      menuItem.categoryId = updateMenuItemDto.categoryId;
    }

    if (updateMenuItemDto.name) {
      const normalizedName = updateMenuItemDto.name.trim();

      const existingMenuItem = await this.menuItemsRepository.findOne({
        where: { name: normalizedName },
      });

      if (existingMenuItem && existingMenuItem.id !== id) {
        throw new ConflictException('Menu item name already exists');
      }

      menuItem.name = normalizedName;
      menuItem.slug = await this.generateUniqueSlug(normalizedName, id);
    }

    if (typeof updateMenuItemDto.description === 'string') {
      menuItem.description = updateMenuItemDto.description.trim();
    }

    if (typeof updateMenuItemDto.price === 'string') {
      menuItem.price = updateMenuItemDto.price;
    }

    if (typeof updateMenuItemDto.isAvailable === 'boolean') {
      menuItem.isAvailable = updateMenuItemDto.isAvailable;
    }

    if (typeof updateMenuItemDto.isActive === 'boolean') {
      menuItem.isActive = updateMenuItemDto.isActive;
    }

    if (image) {
      menuItem.imageUrl = await this.cloudinaryService.uploadImage(image);
    }

    return this.menuItemsRepository.save(menuItem);
  }

  async updateAvailability(
    id: string,
    updateMenuItemAvailabilityDto: UpdateMenuItemAvailabilityDto,
  ): Promise<MenuItem> {
    const menuItem = await this.findOne(id);

    menuItem.isAvailable = updateMenuItemAvailabilityDto.isAvailable;

    return this.menuItemsRepository.save(menuItem);
  }

  async remove(id: string): Promise<{ message: string }> {
    const menuItem = await this.findOne(id);

    await this.menuItemsRepository.remove(menuItem);

    return {
      message: 'Menu item deleted successfully',
    };
  }

  private applyPublicFilters(
    queryBuilder: SelectQueryBuilder<MenuItem>,
    queryDto: QueryMenuItemDto,
  ): void {
    if (queryDto.search?.trim()) {
      queryBuilder.andWhere('LOWER(menuItem.name) LIKE :search', {
        search: `%${queryDto.search.trim().toLowerCase()}%`,
      });
    }

    if (queryDto.category?.trim()) {
      queryBuilder.andWhere('category.slug = :categorySlug', {
        categorySlug: queryDto.category.trim().toLowerCase(),
      });
    }

    if (queryDto.isAvailable === 'true') {
      queryBuilder.andWhere('menuItem.isAvailable = true');
    }

    if (queryDto.isAvailable === 'false') {
      queryBuilder.andWhere('menuItem.isAvailable = false');
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<MenuItem>,
    sortBy?: string,
  ): void {
    switch (sortBy) {
      case 'oldest':
        queryBuilder.orderBy('menuItem.createdAt', 'ASC');
        break;
      case 'price_asc':
        queryBuilder.orderBy('menuItem.price', 'ASC');
        break;
      case 'price_desc':
        queryBuilder.orderBy('menuItem.price', 'DESC');
        break;
      case 'name_asc':
        queryBuilder.orderBy('menuItem.name', 'ASC');
        break;
      case 'name_desc':
        queryBuilder.orderBy('menuItem.name', 'DESC');
        break;
      case 'latest':
      default:
        queryBuilder.orderBy('menuItem.createdAt', 'DESC');
        break;
    }
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = this.slugify(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingMenuItem = await this.menuItemsRepository.findOne({
        where: { slug },
      });

      if (!existingMenuItem) {
        return slug;
      }

      if (excludeId && existingMenuItem.id === excludeId) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}