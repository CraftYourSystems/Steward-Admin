import { redirect } from 'next/navigation';

type LoginCompatibilityPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default async function LoginCompatibilityPage({ searchParams }: LoginCompatibilityPageProps) {
  const params = new URLSearchParams();
  const resolvedSearchParams = (await searchParams) ?? {};

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }

    if (value !== undefined) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  redirect(query ? `/login?${query}` : '/login');
}
