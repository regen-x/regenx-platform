import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../../../iam/user/infrastructure/persistence/entities/user.entity';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'actor_user_id' })
  actor: UserEntity | null;

  @Column({ nullable: true })
  actorRole: string | null;

  @Column({ nullable: true })
  entityType: string | null;

  @Column({ nullable: true, type: 'integer' })
  entityId: number | null;

  @Column({ nullable: true })
  action: string | null;

  @Column({ type: 'jsonb', nullable: true })
  detailsJson?: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp without time zone' })
  createdAt: Date;
}
