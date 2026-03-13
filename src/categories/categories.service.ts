import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
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

    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllForAdmin(): Promise<Category[]> {
    return this.categoriesRepository.find({
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
  ): Promise<Category> {
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

    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.findOne(id);

    await this.categoriesRepository.remove(category);

    return {
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