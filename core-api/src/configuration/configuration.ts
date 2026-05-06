import { ENVIRONMENT } from './orm.configuration';

export const configuration = () => ({
  server: {
    port: Number(process.env.PORT),
    baseUrl: process.env.BASE_URL,
  },
  frontend: {
    url: process.env.FRONTEND_URL,
  },
  auth0: {
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    audience: process.env.AUTH0_AUDIENCE,
  },
  jwt: {
    providerPrefix: process.env.JWT_PROVIDER_PREFIX,
  },
  stellar: {
    networkPassphrase:
      process.env.NODE_ENV === ENVIRONMENT.AUTOMATED_TEST
        ? process.env.STELLAR_LOCAL_NETWORK_PASSPHRASE
        : process.env.STELLAR_NETWORK_PASSPHRASE,
    serverUrl:
      process.env.NODE_ENV === ENVIRONMENT.AUTOMATED_TEST
        ? process.env.STELLAR_LOCAL_URL
        : process.env.STELLAR_SERVER_URL,
    issuerPublicKey: process.env.STELLAR_ISSUER_PUBLIC_KEY,
    issuerSecretKey: process.env.STELLAR_ISSUER_SECRET_KEY,
    distributorPublicKey: process.env.STELLAR_DISTRIBUTOR_PUBLIC_KEY,
    distributorSecretKey: process.env.STELLAR_DISTRIBUTOR_SECRET_KEY,
  },
  soroban: {
    serverUrl:
      process.env.NODE_ENV === ENVIRONMENT.AUTOMATED_TEST
        ? process.env.SOROBAN_LOCAL_SERVER_URL
        : process.env.SOROBAN_SERVER_URL,
    contractAddress: process.env.SOROBAN_CONTRACT_ADDRESS,
  },
});
