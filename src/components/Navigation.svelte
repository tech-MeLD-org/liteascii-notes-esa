<script>
  // ── State ─────────────────────────────────────────────────────────────────
  let mobileOpen = $state(false);
  let searchOpen = $state(false);
  let searchReady = $state(false);
  let searchEl = $state(null);
  let isDark = $state(false);

  const links = [
    { href: '/',          label: 'Home'      },
    { href: '/notes',     label: 'Notes'     },
    { href: '/timeline',  label: 'Timeline'  },
    { href: '/thoughts',  label: 'Thoughts'  },
    { href: '/about',     label: 'About'     },
  ];

  // ── Theme ─────────────────────────────────────────────────────────────────
  // Dark is default (no attribute). Light = data-theme="light"
  function initTheme() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
    if (saved === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      isDark = false;
    } else {
      document.documentElement.removeAttribute('data-theme');
      isDark = true;
    }
  }

  function toggleTheme() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }

  // ── Search ────────────────────────────────────────────────────────────────
  function openSearch() {
    searchOpen = true;
    // Init pagefind UI if available
    setTimeout(() => {
      if (window.__pagefind_ready && searchEl && !searchReady) {
        // @ts-ignore
        new PagefindUI({ element: searchEl, showSubResults: true, showImages: false });
        searchReady = true;
      }
    }, 80);
  }

  function closeSearch() {
    searchOpen = false;
  }

  function handleGlobalKey(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchOpen ? closeSearch() : openSearch();
    }
    if (e.key === 'Escape') {
      if (searchOpen) closeSearch();
      if (mobileOpen) mobileOpen = false;
    }
  }

  import { onMount } from 'svelte';
  onMount(() => {
    initTheme();
  });
</script>

<svelte:window onkeydown={handleGlobalKey} />

<!-- ── Navigation Bar ─────────────────────────────────────────────────────── -->
<nav class="nav">
  <div class="nav-inner">

    <!-- Logo -->
    <a href="/" class="nav-logo">LiteASCII</a>

    <!-- Desktop links -->
    <ul class="nav-links">
      {#each links as link}
        <li>
          <a href={link.href} class="nav-link">{link.label}</a>
        </li>
      {/each}
    </ul>

    <!-- Actions -->
    <div class="nav-actions">
      <!-- Search button -->
      <button class="btn-icon" onclick={openSearch} aria-label="Search (⌘K)" title="Search (⌘K)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </button>

      <!-- Theme toggle -->
      <button class="btn-icon" onclick={toggleTheme} aria-label="Toggle theme">
        {#if isDark}
          <!-- Sun icon -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        {:else}
          <!-- Moon icon -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        {/if}
      </button>

      <!-- Mobile hamburger -->
      <button class="btn-icon btn-mobile" onclick={() => mobileOpen = !mobileOpen} aria-label="Menu">
        {#if mobileOpen}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        {:else}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if mobileOpen}
    <div class="mobile-menu">
      {#each links as link}
        <a href={link.href} class="mobile-link" onclick={() => mobileOpen = false}>
          {link.label}
        </a>
      {/each}
    </div>
  {/if}
</nav>

<!-- ── Search Modal ────────────────────────────────────────────────────────── -->
{#if searchOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="search-overlay" onclick={closeSearch}>
    <div class="search-modal" onclick={(e) => e.stopPropagation()}>
      <div class="search-modal-header">
        <span class="search-label">搜索文档</span>
        <span class="search-shortcut">ESC to close</span>
      </div>
      <div bind:this={searchEl} id="pagefind-search"></div>
      {#if !window?.__pagefind_ready}
        <p class="search-unavail">搜索功能需先运行 <code>pnpm build</code></p>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* ── Nav ──────────────────────────────────────────────────────────────────── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    height: var(--nav-h);
    background: var(--nav-bg);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }

  .nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .nav-logo {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--red);
    letter-spacing: 0.03em;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .nav-logo:hover { color: var(--red-2); }

  .nav-links {
    display: none;
    list-style: none;
    margin: 0; padding: 0;
    gap: 1.5rem;
    flex: 1;
  }
  @media (min-width: 640px) {
    .nav-links { display: flex; }
  }

  .nav-link {
    font-size: 0.85rem;
    color: var(--text-2);
    transition: color 0.15s;
  }
  .nav-link:hover { color: var(--red); }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-left: auto;
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px; height: 32px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: transparent;
    color: var(--text-2);
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }
  .btn-icon:hover { color: var(--red); border-color: var(--red); }

  .btn-mobile { display: flex; }
  @media (min-width: 640px) { .btn-mobile { display: none; } }

  /* ── Mobile menu──────────────────────────────────────────────────────────── */
  .mobile-menu {
    border-top: 1px solid var(--border);
    background: var(--nav-bg);
    padding: 0.75rem 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .mobile-link {
    font-size: 0.9rem;
    color: var(--text-2);
    padding: 0.5rem 0.5rem;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
  }
  .mobile-link:hover { color: var(--red); background: var(--red-faint); }

  /* ── Search modal ─────────────────────────────────────────────────────────── */
  .search-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
  }

  .search-modal {
    width: min(640px, 90vw);
    background: var(--bg-card);
    border: 1px solid var(--border-2);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  }

  .search-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
  }

  .search-label {
    font-size: 0.8rem;
    color: var(--text-2);
    font-weight: 500;
  }

  .search-shortcut {
    font-size: 0.7rem;
    color: var(--text-3);
    font-family: 'Courier New', monospace;
  }

  :global(#pagefind-search) {
    padding: 0.75rem 1rem;
  }

  .search-unavail {
    padding: 1rem;
    font-size: 0.8rem;
    color: var(--text-3);
    text-align: center;
  }
  .search-unavail code {
    background: var(--bg-2);
    padding: 1px 5px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    color: var(--red);
    font-size: 0.85em;
  }

  /* ── Pagefind UI theme overrides ──────────────────────────────────────────── */
  :global(.pagefind-ui) {
    --pagefind-ui-scale: 0.9;
    --pagefind-ui-primary: var(--red);
    --pagefind-ui-text: var(--text);
    --pagefind-ui-background: transparent;
    --pagefind-ui-border: var(--border);
    --pagefind-ui-tag: var(--bg-2);
    --pagefind-ui-border-width: 1px;
    --pagefind-ui-border-radius: 6px;
    --pagefind-ui-font: ui-sans-serif, system-ui, sans-serif;
  }
</style>
