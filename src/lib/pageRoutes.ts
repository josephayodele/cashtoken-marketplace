// Bidirectional mapping between AppLayout's `currentPage` state and URL paths,
// so every page has its own shareable/bookmarkable slug and browser back/forward
// works. Navigation is still driven by `currentPage` state; two effects in
// AppLayout keep the URL and the state in sync (see AppLayout.tsx).
//
// URL scheme (UK is the primary site → root-level slugs; Global/Nigeria are
// namespaced). To rename a slug, change the value here — nothing else.
//
//   /                    UK home            (currentPage 'uk')
//   /brands              UK brands          ('ukbrands')
//   /brands/details      UK brand details   ('ukbrandDetails')
//   /airtime             UK airtime         ('ukairtimeDetails')
//   /marketplace         UK marketplace     ('ukmarketplace')
//   /team /newsletter /business /wallet /about /faqs /contact  (UK pages)
//   /profile /transactions                  (shared, signed-in)
//   /global /global/about /coming-soon      (Global)
//   /nigeria                                ('nigeria')
//   /ng /ng/business /ng/team               (Nigeria home tabs)
//   /ng/brands /ng/brands/details /ng/airtime /ng/wallet /ng/newsletter /ng/faqs

// currentPage key -> path (no leading slash; '' = site root).
// NOTE: 'home' (Nigeria tabbed home) and its tab-mapped keys ('merchant','team')
// are handled specially in pathForState/stateForPath, NOT listed here.
export const PAGE_TO_PATH: Record<string, string> = {
  // UK (primary) — root level
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

  // Global
  global:         'global',
  globalaboutus:  'global/about',
  comingsoon:     'coming-soon',

  // Nigeria — namespaced
  nigeria:        'nigeria',
  brands:         'ng/brands',
  brandDetails:   'ng/brands/details',
  airtimeDetails: 'ng/airtime',
  consumer:       'ng/wallet',
  newsletter:     'ng/newsletter',
  faqs:           'ng/faqs',
};

// Nigeria tabbed home: currentPage stays 'home' while `homeTab` selects the tab.
const NG_HOME_TAB_PATH: Record<string, string> = {
  home:     'ng',
  business: 'ng/business',
  team:     'ng/team',
};

// Reverse map (path -> currentPage). Paths are unique, so this is unambiguous.
const PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([page, path]) => [path, page]),
);

/** The URL path for the current render state. */
export function pathForState(currentPage: string, homeTab: string): string {
  if (currentPage === 'home') return NG_HOME_TAB_PATH[homeTab] ?? 'ng';
  return PAGE_TO_PATH[currentPage] ?? '';
}

/** The render state for a URL path. Unknown paths fall back to the UK home. */
export function stateForPath(pathname: string): { page: string; tab?: string } {
  const path = pathname.replace(/^\/+|\/+$/g, '');
  if (path === 'ng')          return { page: 'home', tab: 'home' };
  if (path === 'ng/business') return { page: 'home', tab: 'business' };
  if (path === 'ng/team')     return { page: 'home', tab: 'team' };
  return { page: PATH_TO_PAGE[path] ?? 'uk' };
}
