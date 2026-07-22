// app/accounts/page.tsx
'use client';

import { useLocale } from 'next-intl';
import { AccountsView } from '@/components/accounts/accounts-view';
import { RequireAuth } from '@/components/auth/require-auth';

export default function AccountsPage() {
  const locale = useLocale() as 'th' | 'en';
  return (
    <RequireAuth>
      <AccountsView locale={locale} />
    </RequireAuth>
  );
}

