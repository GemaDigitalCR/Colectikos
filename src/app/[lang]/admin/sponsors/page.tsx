import React from 'react';
import { getSponsors } from '../../../../actions/sponsors';
import { getDbLugares } from '../../../../actions/lugares';
import SponsorsAdminClient from './SponsorsAdminClient';

export default async function SponsorsAdminPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const [sponsors, lugares] = await Promise.all([
    getSponsors(),
    getDbLugares()
  ]);

  return <SponsorsAdminClient initialSponsors={sponsors} availableLugares={lugares} lang={lang} />;
}
