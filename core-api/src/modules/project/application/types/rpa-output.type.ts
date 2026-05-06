export type RpaOutput = {
  dealOverview: {
    projectName: string;
    assetType: string | null;
    location: string | null;
    capacityKwMw: number;
    storageCapacityKwhMwh: number;
    totalProjectCapex: number;
    totalCapitalRaise: number;
    investmentTermYears: number;
  };
  counterparty: {
    hostSiteName: string | null;
    counterpartyType: string | null;
    industry: string | null;
    creditQuality: string | null;
    primaryOfftaker: string | null;
  };
  agreement: {
    agreementType: string | null;
    contractLengthYears: number;
    extensionOption: boolean;
    paymentFrequency: string | null;
    paymentDelayDays: number;
    baselineMethod: string | null;
    escalationPct: number;
    returnType: string | null;
    targetReturnMultiple: number;
    terminationTrigger: string | null;
  };
  revenue: {
    estimatedAnnualSavings: number;
    spvSharePct: number;
    hostSharePct: number;
    contractedAnnualRevenue: number;
    expectedAnnualMerchantRevenue: number;
    aggregatorName: string | null;
    aggregatorFeePct: number;
    aggregatorFeeAmount: number;
    merchantAnnualRevenueNet: number;
    contractedRevenuePct: number;
    merchantRevenuePct: number;
  };
  cashflow: {
    grossAnnualRevenueToSpv: number;
    netAnnualCashflowToSpv: number;
    monthlyDistribution: number;
    targetCashReturn: number;
    estimatedDurationYears: number;
    impliedIrrPct: number;
  };
  riskFlags: string[];
};
