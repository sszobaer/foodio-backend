import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  orderId: string;

  @Index()
  @Column({ type: 'uuid' })
  menuItemId: string;

  @Column({ type: 'varchar', length: 150 })
  itemName: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  itemPrice: string;

  @Column({ type: 'int', unsigned: true })
  quantity: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  lineTotal: string;

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.orderItems, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  @CreateDateColumn()
  createdAt: Date;
}