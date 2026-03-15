import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { MenuItem } from '../menu-items/entities/menu-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,

    @InjectRepository(MenuItem)
    private readonly menuItemsRepository: Repository<MenuItem>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User): Promise<{ id: string; message: string }> {

  const uniqueMenuItemIds = [
    ...new Set(createOrderDto.items.map((item) => item.menuItemId)),
  ];

  const menuItems = await this.menuItemsRepository.find({
    where: {
      id: In(uniqueMenuItemIds),
      isActive: true,
      isAvailable: true,
    },
  });

  if (menuItems.length !== uniqueMenuItemIds.length) {
    throw new NotFoundException(
      'One or more menu items were not found or unavailable',
    );
  }

  const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));

  let subtotal = 0;

  const preparedItems = createOrderDto.items.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId);

    if (!menuItem) {
      throw new NotFoundException(
        `Menu item with ID ${item.menuItemId} not found`,
      );
    }

    const itemPrice = Number(menuItem.price);
    const lineTotal = itemPrice * item.quantity;

    subtotal += lineTotal;

    return {
      menuItemId: menuItem.id,
      itemName: menuItem.name,
      itemPrice: itemPrice.toFixed(2),
      quantity: item.quantity,
      lineTotal: lineTotal.toFixed(2),
    };
  });

  const result = await this.dataSource.transaction(async (manager) => {

    const orderRepository = manager.getRepository(Order);
    const orderItemRepository = manager.getRepository(OrderItem);

    const order = orderRepository.create({
      orderNumber: this.generateOrderNumber(),
      userId: user.id,
      customerName: user.fullName,
      customerEmail: user.email,
      deliveryAddress: createOrderDto.deliveryAddress?.trim() || user.address,
      subtotal: subtotal.toFixed(2),
      total: subtotal.toFixed(2),
      placedAt: new Date(),
    });

    const savedOrder = await orderRepository.save(order);

    const orderItems = preparedItems.map((item) =>
      orderItemRepository.create({
        orderId: savedOrder.id,
        menuItemId: item.menuItemId,
        itemName: item.itemName,
        itemPrice: item.itemPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      }),
    );

    await orderItemRepository.save(orderItems);

    return savedOrder.id;
  });

  return {
    id: result,
    message: 'Order created successfully',
  };
}

  async findMyOrders(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMyOrderById(id: string, userId: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  async findAll() {
  return this.ordersRepository
    .createQueryBuilder('order')
    .select([
      'order.id',
      'order.createdAt',
      'order.customerName',
      'order.total',
      'order.status',
    ])
    .orderBy('order.createdAt', 'DESC')
    .getMany();
}

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(
  id: string,
  updateOrderStatusDto: UpdateOrderStatusDto,
): Promise<{ id: string; message: string }> {

  const order = await this.findOne(id);

  order.status = updateOrderStatusDto.status;

  await this.ordersRepository.save(order);

  return {
    id: order.id,
    message: 'Order status updated successfully',
  };
}

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `FD-${timestamp}-${randomPart}`;
  }
}