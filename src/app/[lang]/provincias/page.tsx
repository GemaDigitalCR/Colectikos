import React from 'react';
import ProvinciasClient from './ProvinciasClient';
import { getSponsorsWithNearby } from '../../../actions/sponsors';

export default async function ProvinciasPage() {
  const sponsors = await getSponsorsWithNearby();
  return <ProvinciasClient sponsors={sponsors} />;
}
