import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 120 })
  customerName: string;

  @Column({ type: 'varchar', length: 150 })
  customerEmail: string;

  @Column({ type: 'text' })
  deliveryAddress: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  subtotal: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  total: string;

  @Column({ type: 'timestamp' })
  placedAt: Date;

  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: false,
  })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}