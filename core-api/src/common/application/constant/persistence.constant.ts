import { ENVIRONMENT } from '../../../configuration/orm.configuration';

export const databaseSafeDateType =
  process.env.NODE_ENV === ENVIRONMENT.AUTOMATED_TEST
    ? 'datetime'
    : 'timestamp';
