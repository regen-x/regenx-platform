import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('stellar_asset')
export class StellarAssetEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  assetCode: string;

  @Column({ type: 'varchar', length: 255 })
  issuerPublicKey: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  distributionAccount: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  issuanceTxHash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  issuedAt: Date | null;
}
