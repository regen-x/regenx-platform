import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';
import { UserEntity } from '../../../../iam/user/infrastructure/persistence/entities/user.entity';
import { ProjectEntity } from '../../../../project/infrastructure/persistence/entities/project.entity';
import { TRANSACTION_TYPE } from '../../../domain/transaction-type.enum';
import { TRANSACTION_STATUS } from '../../../domain/transaction-status.enum';

@Entity('transactions')
export class TransactionEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (user) => user.transactions, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity | null;

  @ManyToOne(() => ProjectEntity, (project) => project.transactions, {
    nullable: true,
  })
  @JoinColumn({ name: 'project_id' })
  project?: ProjectEntity | null;

  @Column({ type: 'numeric' })
  amount: number;

  @Column({ type: 'varchar', default: 'AUD' })
  currency: string;

  @Column({ name: 'token_amount', type: 'numeric', nullable: true })
  tokenAmount?: number | null;

  @Column({ type: 'varchar' })
  type: TRANSACTION_TYPE;

  @Column({ type: 'varchar', default: TRANSACTION_STATUS.PENDING })
  status: TRANSACTION_STATUS;

  @Column({ type: 'text', nullable: true })
  reference?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'settled_at', type: 'timestamp', nullable: true })
  settledAt?: Date | null;
}
