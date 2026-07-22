import { getDB } from '../local-db';

export const ACCOUNTS_DATA_STORE = 'accountsData';
export const LOCAL_ACCOUNTS_STORE = 'localAccounts';
export const CURRENT_ACCOUNT_KEY = 'bb:currentAccount';

export interface StashedAccount {
  accountId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot: any;
  stashedAt: number;
}

export async function getStashedAccount(accountId: string): Promise<StashedAccount | undefined> {
  const db = await getDB();
  return db.get(ACCOUNTS_DATA_STORE, accountId) as Promise<StashedAccount | undefined>;
}

export async function saveStashedAccount(stashed: StashedAccount): Promise<void> {
  const db = await getDB();
  await db.put(ACCOUNTS_DATA_STORE, stashed as never, stashed.accountId);
}

export async function removeStashedAccount(accountId: string): Promise<void> {
  const db = await getDB();
  await db.delete(ACCOUNTS_DATA_STORE, accountId);
}
