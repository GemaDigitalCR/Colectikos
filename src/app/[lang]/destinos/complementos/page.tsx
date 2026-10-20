import React from 'react';
import ComplementosClient from './ComplementosClient';
import { getSponsorsWithNearby } from '../../../../actions/sponsors';

export default async function Page() {
  const sponsorsWithNearby = await getSponsorsWithNearby();
  return <ComplementosClient sponsors={sponsorsWithNearby} />;
}

