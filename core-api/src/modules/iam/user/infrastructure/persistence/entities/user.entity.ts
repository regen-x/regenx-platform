import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../../../common/infrastructure/persistence/entities/base.entity';
import { AppRole } from '../../../../authorization/domain/app-role.enum';
import { UserType } from '../../../domain/user-type.enum';
import { ProjectEntity } from '../../../../../project/infrastructure/persistence/entities/project.entity';
import { OfferEntity } from '../../../../../offer/infrastructure/persistence/entities/offer.entity';
import { TransactionEntity } from '../../../../../transaction/infrastructure/persistence/entities/transaction.entity';

@Entity('user')
export class UserEntity extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  externalId: string;

  @Column({ nullable: true })
  role: AppRole;

  @Column({ default: false })
  isVerified: boolean;

  @Column()
  fullname: string;

  @Column()
  birthdate: string;

  @Column()
  phoneNumber: string;

  @Column()
  type: UserType;

  @Column({ nullable: true, unique: true })
  walletAddress?: string;

  @OneToMany(() => ProjectEntity, (project) => project.user)
  projects?: ProjectEntity[];

  @ManyToOne(() => UserEntity, (usuario) => usuario.investors, {
    nullable: true,
  })
  @JoinColumn({ name: 'wallet_manager_id' })
  walletManager?: UserEntity;

  @OneToMany(() => UserEntity, (usuario) => usuario.walletManager)
  investors?: UserEntity[];

  @OneToMany(() => OfferEntity, (offer) => offer.user)
  offers?: OfferEntity[];

  @OneToMany(() => TransactionEntity, (transaction) => transaction.user)
  transactions: TransactionEntity[];
}
