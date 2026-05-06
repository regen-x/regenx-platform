import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';
import { ProjectEntity } from './project.entity';
import { UserEntity } from '../../../../iam/user/infrastructure/persistence/entities/user.entity';

@Entity('project_versions')
export class ProjectVersionEntity extends BaseEntity {
  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column()
  versionNumber: number;

  @Column({ default: 'draft' })
  status: string;

  @Column({ type: 'jsonb' })
  payloadJson: any;

  @Column({ nullable: true })
  changeSummary?: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: UserEntity;

  @Column({ nullable: true })
  submittedAt?: Date;

  @Column({ nullable: true })
  approvedAt?: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'approved_by_user_id' })
  approvedBy?: UserEntity;
}
