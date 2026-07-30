import HeaderClient from './HeaderClient';
import { getCohortNavigationState } from '@/lib/data-cohorts';
import { getCurrentUser } from '@/lib/pocketbase-server';

export default async function Header() {
  const user = await getCurrentUser();
  let cohorts: Array<{ id: string; name: string; status: string }> = [];
  let activeCohortId: string | null = null;

  if (user) {
    try {
      const navigation = await getCohortNavigationState();
      cohorts = navigation.cohorts.map(({ id, name, status }) => ({ id, name, status }));
      activeCohortId = navigation.activeCohort?.id ?? null;
    } catch (error) {
      console.error('Failed to resolve cohort navigation', error);
    }
  }

  return (
    <HeaderClient
      initialUser={user}
      cohorts={cohorts}
      initialActiveCohortId={activeCohortId}
    />
  );
}
