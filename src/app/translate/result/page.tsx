export const dynamic = 'force-dynamic'; // skip prerender

import { Suspense } from 'react';
import ClientResult from './ClientResult';

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6">Loading…</p>}>
      <ClientResult />
    </Suspense>
  );
}