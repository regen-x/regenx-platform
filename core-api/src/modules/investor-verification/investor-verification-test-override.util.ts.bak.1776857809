export const TEST_VERIFICATION_SOURCE = 'test_override';
export const REAL_COMPLIANCE_SOURCE = 'real_compliance';
export const NO_ELIGIBILITY_SOURCE = 'none';

export const isProductionNodeEnvironment = (
  env: NodeJS.ProcessEnv = process.env,
) => String(env.NODE_ENV ?? '').trim().toLowerCase() === 'production';

export const isTestVerificationOverrideEnabled = (
  env: NodeJS.ProcessEnv = process.env,
) =>
  String(env.ENABLE_TEST_VERIFICATION_OVERRIDE ?? '')
    .trim()
    .toLowerCase() === 'true';

export const isAdminTestOverrideEnabled = (
  env: NodeJS.ProcessEnv = process.env,
) =>
  String(env.ENABLE_ADMIN_TEST_OVERRIDE ?? '')
    .trim()
    .toLowerCase() === 'true';

export const getDefaultTestVerificationExpiryDate = (baseDate = new Date()) => {
  const expiryDate = new Date(baseDate);
  expiryDate.setUTCFullYear(expiryDate.getUTCFullYear() + 1);
  return expiryDate.toISOString().slice(0, 10);
};

export const isVerificationExpiryActive = (
  expiryDate?: string | null,
  now = new Date(),
) => {
  if (!expiryDate) {
    return true;
  }

  const currentDate = now.toISOString().slice(0, 10);
  return expiryDate >= currentDate;
};
