import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn({ nullable: true })
  updatedAt: string;

  @DeleteDateColumn({ nullable: true })
  deletedAt: string;
}
