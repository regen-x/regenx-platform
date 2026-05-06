export class Base {
  uuid?: string;
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  constructor(
    id?: number,
    uuid?: string,
    createdAt?: string,
    updatedAt?: string,
    deletedAt?: string,
  ) {
    this.id = id;
    this.uuid = uuid;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }
}
