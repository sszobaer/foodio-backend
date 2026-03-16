import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MenuItem } from 'src/menu-items/entities/menu-item.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,

    @InjectRepository(MenuItem)
    private readonly menuItemsRepository: Repository<MenuItem>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<{ id: string; message: string }> {
    const normalizedName = createCategoryDto.name.trim();
    const slug = await this.generateUniqueSlug(normalizedName);

    const existingCategory = await this.categoriesRepository.findOne({
      where: { name: normalizedName },
    });

    if (existingCategory) {
      throw new ConflictException('Category name already exists');
    }

    const category = this.categoriesRepository.create({
      name: normalizedName,
      slug,
      isActive: createCategoryDto.isActive ?? true,
    });

    const savedCategory = await this.categoriesRepository.save(category);

    return {
      id: savedCategory.id,
      message: 'Category created successfully',
    };
  }

  async findAll(): Promise<{ id: string; name: string; slug: string }[]> {
    return this.categoriesRepository.find({
      select: ['id', 'name', 'slug'],
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllForAdmin(): Promise<{ id: string; name: string }[]> {
    return this.categoriesRepository.find({
      select: ['id', 'name'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<{ id: string; message: string }> {
    const category = await this.findOne(id);

    if (updateCategoryDto.name) {
      const normalizedName = updateCategoryDto.name.trim();

      const existingCategory = await this.categoriesRepository.findOne({
        where: { name: normalizedName },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException('Category name already exists');
      }

      category.name = normalizedName;
      category.slug = await this.generateUniqueSlug(normalizedName, id);
    }

    if (typeof updateCategoryDto.isActive === 'boolean') {
      category.isActive = updateCategoryDto.isActive;
    }

    await this.categoriesRepository.save(category);

    return {
      id: category.id,
      message: 'Category updated successfully',
    };
  }

  async remove(id: string): Promise<{ id: string; message: string }> {
    await this.findOne(id);

    const menuItemCount = await this.menuItemsRepository.count({
      where: { categoryId: id },
    });

    if (menuItemCount > 0) {
      throw new BadRequestException(
        'Cannot delete category because it is assigned to existing menu items.',
      );
    }

    await this.categoriesRepository.delete(id);

    return {
      id,
      message: 'Category deleted successfully',
    };
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
      const existingCategory = await this.categoriesRepository.findOne({
        where: { slug },
      });

      if (!existingCategory) {
        return slug;
      }

      if (excludeId && existingCategory.id === excludeId) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}