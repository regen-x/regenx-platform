import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SpvEntity } from './spv.entity';
import { ProjectEntity } from '../../../../project/infrastructure/persistence/entities/project.entity';

@Entity('series')
export class SeriesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'token_symbol', type: 'varchar', length: 20 })
  tokenSymbol: string;

  @Column({ name: 'total_supply', type: 'numeric' })
  totalSupply: number;

  @Column({ name: 'price_per_token', type: 'numeric' })
  pricePerToken: number;

  @Column({ name: 'target_irr', type: 'numeric', nullable: true })
  targetIrr: number | null;

  @Column({ name: 'term_years', type: 'integer', nullable: true })
  termYears: number | null;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'draft' })
  status: string;

  @ManyToOne(() => SpvEntity, (spv) => spv.series, { nullable: false })
  @JoinColumn({ name: 'spv_id' })
  spv: SpvEntity;

  @OneToOne(() => ProjectEntity, { nullable: false })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;
}
