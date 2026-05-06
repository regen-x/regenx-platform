import { Base } from '../../domain/base.domain';
import { SortType } from '../enum/sort-type.enum';

type OnlyAttributes<Entity> = {
  // eslint-disable-next-line
  [P in keyof Entity]: Entity[P] extends Base[] | Base | Function ? never : P;
}[keyof Entity];

type PageOptions = {
  number?: number;
  size?: number;
  offset?: number;
};

export type FilterOptions<Entity> = Partial<{
  [P in OnlyAttributes<Entity>]: Entity[P];
}>;

type SortOptions<Entity> = Partial<{
  [P in OnlyAttributes<Entity>]: SortType;
}>;

type FieldOptions<Entity> = OnlyAttributes<Entity>[];

export interface IGetAllOptions<Entity extends object, Relations = []> {
  page?: PageOptions;
  filter?: FilterOptions<Entity>;
  sort?: SortOptions<Entity>;
  fields?: FieldOptions<Entity>;
  include?: Relations;
}
