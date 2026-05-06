import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsSelect, Repository } from 'typeorm';
import { IProjectRepository } from '../../application/repository/project.repository.interface';
import { Project } from '../../domain/project.domain';
import { ProjectNotFoundException } from './exception/project-not-found.exception';
import { ProjectEntity } from '../persistence/entities/project.entity';
import { Injectable } from '@nestjs/common';
import {
  FilterOptions,
  IGetAllOptions,
} from '../../../../common/application/interface/get-all-options.interface';
import { ICollection } from '../../../../common/application/dto/collection.interface';

@Injectable()
export class ProjectPostgresqlRepository implements IProjectRepository {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
  ) {}

  async getAll(
    options: IGetAllOptions<Project & { userUuid: string }>,
  ): Promise<ICollection<Project>> {
    const {
      filter: { userUuid, ...filter },
      page,
      sort,
      fields,
    } = options || {};

    const [items, itemCount] = await this.projectRepository.findAndCount({
      where: { ...filter, user: { uuid: userUuid } },
      order: sort,
      select: fields as FindOptionsSelect<Project>,
      take: page.size,
      skip: page.offset,
    });

    return {
      data: items,
      pageNumber: page.number,
      pageSize: page.size,
      pageCount: Math.ceil(itemCount / page.size),
      itemCount,
    };
  }

  async getOneByFilter(filter: FilterOptions<Project>): Promise<Project> {
    return this.projectRepository.findOne({
      where: filter,
    });
  }

  async saveOne(project: Project): Promise<Project> {
    return this.projectRepository.save(project);
  }

  async updateOneOrFail(
    id: number,
    updates: Partial<Omit<Project, 'id'>>,
  ): Promise<Project> {
    const projectToUpdate = await this.projectRepository.preload({
      id,
      ...updates,
    });

    if (!projectToUpdate) {
      throw new ProjectNotFoundException({
        message: `Project with ID ${id} not found`,
      });
    }

    return this.projectRepository.save(projectToUpdate);
  }
}
