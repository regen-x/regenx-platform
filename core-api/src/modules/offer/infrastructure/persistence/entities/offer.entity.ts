import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';
import { ProjectEntity } from '../../../../project/infrastructure/persistence/entities/project.entity';
import { UserEntity } from '../../../../iam/user/infrastructure/persistence/entities/user.entity';

@Entity('offer')
export class OfferEntity extends BaseEntity {
  @Column()
  amount: number;

  @Column()
  price: number;

  @Column()
  externalId: number;

  @ManyToOne(() => UserEntity, (user) => user.offers)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => ProjectEntity, (project) => project.offers)
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;
}
