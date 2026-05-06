import { ManySerializedResponseDto } from '../../../../common/application/dto/many-serialized-response.dto';
import { CreateProjectDto } from '../../application/dto/create-project.dto';
import { ProjectResponseDto } from '../../application/dto/project-response.dto';
import { PROJECT_ENTITY_NAME } from '../../domain/project.name';

export const createProjectDto: CreateProjectDto = {
  name: 'Project 1',
  description: 'Description 1',
  location: 'Location 1',
  fundingGoal: 1000,
  startDate: '2025-01-01T00:00:00.000Z',
  endDate: '2026-01-01T00:00:00.000Z',
  climateImpact: 'Climate impact 1',
  tokenSupply: 1000,
  tokenPrice: 1,
  tokenSymbol: 'TOKEN',
  generatesCarbonCredits: true,
  ownerAddress:
    'GAUPJCQQ7MKPZ375F7P5O2A5LXBBCQULAIIXA274LNZLTBXWVGZGEJFG',
};

export const genericProjectResponseDto: Omit<ProjectResponseDto, 'id'> = {
  name: expect.any(String),
  description: expect.any(String),
  location: expect.any(String),
  fundingGoal: expect.any(Number),
  startDate: expect.any(String),
  endDate: expect.any(String),
  climateImpact: expect.any(String),
  tokenSupply: expect.any(Number),
  tokenPrice: expect.any(Number),
  tokenSymbol: expect.any(String),
  tokenAddress: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
  deletedAt: null,
  generatesCarbonCredits: expect.any(Boolean),
  ownerAddress: expect.any(String),
  raisedAmount: expect.any(Number),
  percentFunded: expect.any(Number),
  remainingSupply: expect.any(Number),
};

export const getAllProjectsResponseDto: ManySerializedResponseDto<ProjectResponseDto> =
  {
    data: [
      {
        attributes: genericProjectResponseDto,
        type: PROJECT_ENTITY_NAME,
        id: expect.any(String),
      },
    ],
    links: expect.any(Object),
    meta: expect.objectContaining({
      pageNumber: expect.any(Number),
      pageSize: expect.any(Number),
      pageCount: expect.any(Number),
      itemCount: expect.any(Number),
    }),
  };
