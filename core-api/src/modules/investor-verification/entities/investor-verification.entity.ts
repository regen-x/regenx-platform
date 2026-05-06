import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('investor_verification')
export class InvestorVerificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: string;

  @Column({ nullable: true })
  sumsubApplicantId: string | null;

  @Column({ default: 'not_started' })
  sumsubStatus:
    | 'not_started'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'review_required';

  @Column({ default: 'pending' })
  adminReviewStatus:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'more_info_required';

  @Column({ default: 'blocked' })
  investorEligibilityStatus: 'blocked' | 'approved' | 'suspended';

  @Column({ default: 'pending' })
  wholesaleStatus: 'pending' | 'approved' | 'rejected' | 'requires_more_info';

  @Column({ nullable: true })
  verificationSource: string | null;

  @Column({ nullable: true })
  wholesaleVerificationSource: string | null;

  @Column({ default: false })
  isTestVerification: boolean;

  @Column({ default: false })
  testIdentityVerified: boolean;

  @Column({ default: false })
  testAmlApproved: boolean;

  @Column({ default: false })
  testWholesaleApproved: boolean;

  @Column({ default: false })
  testInvestmentOverride: boolean;

  @Column({ default: 'none' })
  verificationOverrideMode: 'none' | 'testnet';

  @Column({ type: 'timestamptz', nullable: true })
  testInvestmentOverrideSetAt: Date | null;

  @Column({ nullable: true })
  testInvestmentOverrideSetBy: string | null;

  @Column({ type: 'text', nullable: true })
  testInvestmentOverrideNote: string | null;

  @Column({ nullable: true })
  wholesaleCertificateKey: string | null;

  @Column({ nullable: true })
  wholesaleCertificateOriginalName: string | null;

  @Column({ type: 'date', nullable: true })
  wholesaleCertificateExpiryDate: string | null;

  @Column({ type: 'jsonb', nullable: true })
  amlAnswers: Record<string, any> | null;

  @Column({ nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  testVerificationAppliedAt: Date | null;

  @Column({ nullable: true })
  testVerificationAppliedBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
