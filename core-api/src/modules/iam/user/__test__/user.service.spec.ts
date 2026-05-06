import { UserService } from '../application/service/user.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: { getOneByFilter: jest.Mock };
  let userResponseAdapter: { manyEntitiesResponse: jest.Mock };
  let projectRepository: { getOneByFilter: jest.Mock };
  let projectMapper: { fromProjectToProjectResponseDto: jest.Mock };
  let ownershipService: { getOwnershipByUser: jest.Mock };

  beforeEach(() => {
    userRepository = {
      getOneByFilter: jest.fn(),
    };
    userResponseAdapter = {
      manyEntitiesResponse: jest.fn((type, payload) => ({
        type,
        ...payload,
      })),
    };
    projectRepository = {
      getOneByFilter: jest.fn(),
    };
    projectMapper = {
      fromProjectToProjectResponseDto: jest.fn((project) => project),
    };
    ownershipService = {
      getOwnershipByUser: jest.fn(),
    };

    service = new UserService(
      userRepository as any,
      {} as any,
      userResponseAdapter as any,
      {} as any,
      projectRepository as any,
      projectMapper as any,
      ownershipService as any,
    );
  });

  it('returns an empty portfolio when the wallet is unknown', async () => {
    userRepository.getOneByFilter.mockResolvedValue(null);

    const result = await service.getUserPortfolio({
      userAddress: 'GUNKNOWNWALLET',
    });

    expect(result.data).toEqual([]);
    expect((result as any).itemCount).toBe(0);
    expect(ownershipService.getOwnershipByUser).not.toHaveBeenCalled();
  });

  it('builds the portfolio from settled ownership holdings', async () => {
    userRepository.getOneByFilter.mockResolvedValueOnce({
      id: 42,
      walletAddress: 'GUSERWALLET',
    });
    ownershipService.getOwnershipByUser.mockResolvedValue([
      {
        projectId: 7,
        seriesId: 3,
        projectName: 'Sunified Solar',
        tokenSymbol: 'SUN',
        assetCode: 'SUN',
        assetIssuer: 'GISSUER',
        totalTokens: 125,
        tokenPrice: 2.5,
        totalValue: 312.5,
        projectStatus: 'live',
        ownershipSource: 'ON_CHAIN',
        settlementStatus: 'SETTLED',
      },
    ]);
    projectRepository.getOneByFilter.mockResolvedValue({
      id: 7,
      uuid: 'project-7',
      name: 'Sunified Solar',
      tokenSymbol: 'SUN',
      tokenPrice: 2.5,
      status: 'live',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      generatesCarbonCredits: false,
    });

    const result = await service.getUserPortfolio({
      userAddress: 'GUSERWALLET',
    });

    expect(ownershipService.getOwnershipByUser).toHaveBeenCalledWith(42);
    expect(projectRepository.getOneByFilter).toHaveBeenCalledWith({ id: 7 });
    expect(projectMapper.fromProjectToProjectResponseDto).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        purchasedAmount: 125,
        tokenPrice: 2.5,
        totalValue: 312.5,
        settlementStatus: 'SETTLED',
      }),
    );
    expect(result.data).toHaveLength(1);
  });
});
