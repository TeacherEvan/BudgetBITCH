// app/accounts/page.tsx
'use client';

import { useLocale } from 'next-intl';
import { AccountsView } from '@/components/accounts/accounts-view';

export default function AccountsPage() {
  const locale = useLocale() as 'th' | 'en';
  return <AccountsView locale={locale} />;
}
