import { ICollection } from '../../../../common/application/dto/collection.interface';
import {
  FilterOptions,
  IGetAllOptions,
} from '../../../../common/application/interface/get-all-options.interface';
import { Project } from '../../domain/project.domain';

export const PROJECT_REPOSITORY_KEY = 'project_repository';

export interface IProjectRepository {
  getAll(options: IGetAllOptions<Project>): Promise<ICollection<Project>>;
  getOneByFilter(filter: FilterOptions<Project>): Promise<Project>;
  saveOne(project: Project): Promise<Project>;
  updateOneOrFail(
    id: number,
    updates: Partial<Omit<Project, 'id'>>,
  ): Promise<Project>;
}
