// Bidirectional mapping between AppLayout's `currentPage` state and URL paths,
// so every page has its own shareable/bookmarkable slug and browser back/forward
// works. Navigation is still driven by `currentPage` state; two effects in
// AppLayout keep the URL and the state in sync (see AppLayout.tsx).
//
// The site is UK-only — root-level slugs. Any unknown path (including the old
// /global, /nigeria, /ng/* routes) falls back to the UK home.
//
//   /                    UK home            (currentPage 'uk')
//   /brands              UK brands          ('ukbrands')
//   /brands/details      UK brand details   ('ukbrandDetails')
//   /airtime             UK airtime         ('ukairtimeDetails')
//   /marketplace         UK marketplace     ('ukmarketplace')
//   /team /newsletter /business /wallet /about /faqs /contact  (UK pages)
//   /profile /transactions                  (shared, signed-in)

// currentPage key -> path (no leading slash; '' = site root).
export const PAGE_TO_PATH: Record<string, string> = {
  uk:             '',
  ukbrands:       'brands',
  ukbrandDetails: 'brands/details',
  ukairtimeDetails: 'airtime',
  ukmarketplace:  'marketplace',
  ukteam:         'team',
  uknewsletter:   'newsletter',
  ukbusiness:     'business',
  ukconsumer:     'wallet',
  ukaboutus:      'about',
  ukfaqs:         'faqs',
  ukcontact:      'contact',

  // Shared (signed-in) pages
  profile:        'profile',
  transactions:   'transactions',
};

// Reverse map (path -> currentPage). Paths are unique, so this is unambiguous.
const PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([page, path]) => [path, page]),
);

/** The URL path for the current render state. */
export function pathForState(currentPage: string, _homeTab: string): string {
  return PAGE_TO_PATH[currentPage] ?? '';
}

/** The render state for a URL path. Unknown paths fall back to the UK home. */
export function stateForPath(pathname: string): { page: string; tab?: string } {
  const path = pathname.replace(/^\/+|\/+$/g, '');
  return { page: PATH_TO_PAGE[path] ?? 'uk' };
}
