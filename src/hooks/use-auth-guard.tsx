import { useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSegments, type Href } from 'expo-router';
import { useSession } from '@/lib/auth/context';

type AuthGuardOptions = {
  enabled?: boolean;
  redirectTo?: Href;
  authenticatedRoute?: Href;
  allowlist?: Href[];
  isOnboarded?: boolean;
  onboardingRoute?: Href;
};

type ResolvedAuthGuardOptions = AuthGuardOptions & {
  enabled: boolean;
  redirectTo: Href;
  authenticatedRoute: Href;
};

const defaultOptions: ResolvedAuthGuardOptions = {
  enabled: true,
  redirectTo: '/sign-in',
  authenticatedRoute: '/(app)',
};

function hrefToPathname(href: Href) {
  if (typeof href === 'string') {
    return href.split('?')[0].split('#')[0];
  }

  return href.pathname;
}

function pathMatches(pathname: string, candidates: string[]) {
  return candidates.some((candidate) => {
    if (candidate === pathname) {
      return true;
    }

    if (candidate.endsWith('/')) {
      return pathname.startsWith(candidate);
    }

    return pathname.startsWith(`${candidate}/`);
  });
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();
  const mergedOptions = useMemo<ResolvedAuthGuardOptions>(
    () => ({ ...defaultOptions, ...options }),
    [options],
  );

  useEffect(() => {
    if (!mergedOptions.enabled || isLoading) {
      return;
    }

    const hasSession = !!session;
    const firstSegment = segments[0] ?? '';
    const isInAppGroup = firstSegment === '(app)';
    const isAuthScreen = firstSegment === 'sign-in';
    const redirectPath = hrefToPathname(mergedOptions.redirectTo);
    const authenticatedPath = hrefToPathname(mergedOptions.authenticatedRoute);
    const onboardingHref = mergedOptions.onboardingRoute ?? null;
    const onboardingPath = onboardingHref ? hrefToPathname(onboardingHref) : null;
    const allowlistPaths = mergedOptions.allowlist
      ? mergedOptions.allowlist.map(hrefToPathname)
      : [];
    const isAllowlisted = allowlistPaths.length
      ? pathMatches(pathname, allowlistPaths)
      : false;

    if (!hasSession) {
      if (isInAppGroup && !isAllowlisted && pathname !== redirectPath) {
        router.replace(mergedOptions.redirectTo);
      }
      return;
    }

    if (onboardingHref && mergedOptions.isOnboarded === false && pathname !== onboardingPath) {
      router.replace(onboardingHref);
      return;
    }

    if (isAuthScreen && pathname !== authenticatedPath) {
      router.replace(mergedOptions.authenticatedRoute);
    }
  }, [
    isLoading,
    mergedOptions,
    pathname,
    router,
    segments,
    session,
  ]);
}
