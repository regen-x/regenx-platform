import { Keypair } from '@stellar/stellar-sdk';
import axios from 'axios';

export const createAccount = async () => {
  const account = Keypair.random();

  const publicKey = account.publicKey();

  await axios.get(`http://localhost:8000/friendbot?addr=${publicKey}`);

  return account;
};
