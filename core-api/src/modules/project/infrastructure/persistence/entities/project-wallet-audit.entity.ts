import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column } from 'typeorm';

import { UserEntity } from '../../../../iam/user/infrastructure/persistence/entities/user.entity';

@Entity('project_wallet_audit')
export class ProjectWalletAuditEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'integer' })
  projectId: number;

  @Column({ name: 'field_name', type: 'varchar', length: 100 })
  fieldName: string;

  @Column({ name: 'old_value', type: 'text', nullable: true })
  oldValue?: string | null;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue?: string | null;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason?: string | null;

  @Column({ name: 'change_type', type: 'varchar', length: 60 })
  changeType: string;

  @Column({ name: 'changed_by', type: 'integer', nullable: true })
  changedBy?: number | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedByUser?: UserEntity | null;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
