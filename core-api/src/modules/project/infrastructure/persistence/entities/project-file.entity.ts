import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';

export type ProjectFileCategory =
  | 'PROJECT_MEDIA'
  | 'PROJECT_DOCUMENT'
  | 'VERIFICATION_DOCUMENT';

export type ProjectFilePurpose =
  | 'PROJECT_THUMBNAIL'
  | 'PROJECT_SUPPORTING_IMAGE'
  | 'PROJECT_DOCUMENT'
  | 'VERIFICATION_DOCUMENT';

@Entity('project_file')
export class ProjectFileEntity extends BaseEntity {
  @Column({ name: 'project_id', type: 'integer', nullable: true })
  projectId: number | null;

  @Column({ name: 'category', type: 'varchar', length: 50 })
  category: ProjectFileCategory;

  @Column({ name: 'purpose', type: 'varchar', length: 50 })
  purpose: ProjectFilePurpose;

  @Column({ name: 'document_key', type: 'varchar', length: 100, nullable: true })
  documentKey: string | null;

  @Column({ name: 'storage_key', type: 'text' })
  storageKey: string;

  @Column({ name: 'original_filename', type: 'text' })
  originalFilename: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 255 })
  mimeType: string;

  @Column({ name: 'file_size', type: 'integer', nullable: true })
  fileSize: number | null;

  @Column({ name: 'uploaded_by', type: 'integer', nullable: true })
  uploadedBy: number | null;
}
