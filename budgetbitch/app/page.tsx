'use client';

import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from 'convex/react';
import { api } from '../convex/_generated/api';
import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import type { User } from '@workos-inc/node';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        BudgetBITCH
        {user && (
          <UserMenu user={user} onSignOut={signOut} />
        )}
      </header>
      <main className="p-8 flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-center">BudgetBITCH</h1>
        <Authenticated>
          <Content userEmail={user?.email ?? ''} />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </>
  );
}

function SignInForm() {
  return (
    <div className="flex flex-col gap-8 w-96 mx-auto">
      <p>Log in to track your budget</p>
      <Link
        href="/sign-in"
        className="bg-foreground text-background px-4 py-2 rounded-md text-center"
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="bg-foreground text-background px-4 py-2 rounded-md text-center"
      >
        Sign up
      </Link>
    </div>
  );
}

function Content({ userEmail }: { userEmail: string }) {
  const accounts = useQuery(api.myFunctions.listAccounts);
  const categories = useQuery(api.myFunctions.listCategories);
  const { transactions } = useQuery(api.myFunctions.listTransactions, {
    count: 10,
  }) ?? { transactions: undefined };
  const budgets = useQuery(api.myFunctions.listBudgets, {
    month: new Date().toISOString().slice(0, 7),
  });
  const seed = useMutation(api.myFunctions.seedSampleData);

  if (
    accounts === undefined ||
    categories === undefined ||
    transactions === undefined ||
    budgets === undefined
  ) {
    return <div className="mx-auto"></div>;
  }

  const spent = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto">
      <p>Welcome {userEmail}!</p>
      <button
        className="bg-foreground text-background text-sm px-4 py-2 rounded-md"
        onClick={() => void seed({})}
      >
        Seed sample data
      </button>

      <Section title="Accounts" count={accounts.length} />
      <Section title="Categories" count={categories.length} />
      <Section title="Budgets" count={budgets.length} />

      <p>Total spent (this view): {spent.toFixed(2)}</p>
      <p>
        Transactions:{' '}
        {transactions.length === 0
          ? 'Click "Seed sample data"!'
          : `${transactions.length} row(s)`}
      </p>

      <p>
        Edit{' '}
        <code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
          convex/myFunctions.ts
        </code>{' '}
        to change your backend
      </p>
      <p>
        Edit{' '}
        <code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
          app/page.tsx
        </code>{' '}
        to change your frontend
      </p>
    </div>
  );
}

function Section({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex flex-col gap-2 bg-slate-200 dark:bg-slate-800 p-4 rounded-md">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm">{count} record(s)</p>
    </div>
  );
}

function UserMenu({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{user.email}</span>
      <button
        onClick={onSignOut}
        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
      >
        Sign out
      </button>
    </div>
  );
}
