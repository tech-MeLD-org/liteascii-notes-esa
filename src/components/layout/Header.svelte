<script>
  import { onMount } from 'svelte';
  
  // ── State ─────────────────────────────────────────────────────────────────
  let searchOpen = $state(false);
  let searchReady = $state(false);
  let searchEl = $state(null);
  let isDark = $state(false);

  const links = [
    { href: '/',         label: 'Home'      },
    { href: '/notes',     label: 'Notes'     },
    { href: '/map',       label: 'Map'       },
    { href: '/timeline',  label: 'Timeline'  },
    { href: '/thoughts',  label: 'Thoughts'  },
    { href: '/about',     label: 'About'     },
  ];

  // ── Theme ─────────────────────────────────────────────────────────────────
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
    setTimeout(() => {
      if (window.__pagefind_ready && searchEl && !searchReady) {
        // @ts-ignore
        new PagefindUI({ element: searchEl, showSubResults: true, showImages: false });
        searchReady = true;
      }
    }, 80);
  }

  function closeSearch() { searchOpen = false; }

  function handleGlobalKey(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchOpen ? closeSearch() : openSearch(); }
    if (e.key === 'Escape') { if (searchOpen) closeSearch(); }
  }

  onMount(() => { initTheme(); });
</script>

<svelte:window onkeydown={handleGlobalKey} />

<nav class="nav-bar">
  <div class="nav-inner">
    <a href="/" class="nav-logo">LiteASCII</a>

    <ul class="nav-links-desktop">
      {#each links as link}
        <li><a href={link.href} class="nav-link">{link.label}</a></li>
      {/each}
    </ul>

    <div class="nav-actions">
      <button class="nav-btn" onclick={openSearch} aria-label="Search (⌘K)" title="Search (⌘K)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </button>

      <button class="nav-btn" onclick={toggleTheme} aria-label="Toggle theme">
        {#if isDark}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        {/if}
      </button>
    </div>
  </div>
</nav>

{#if searchOpen}
  <div class="search-overlay" onclick={closeSearch} aria-hidden="true">
    <div class="search-content" onclick={(e) => e.stopPropagation()} aria-hidden="true">
      <div class="search-header">
        <span class="text-xs text-[var(--color-text-secondary)] font-medium">搜索文档</span>
        <span class="search-tip">ESC to close</span>
      </div>
      <div bind:this={searchEl} id="pagefind-search" class="px-4 py-3"></div>
    </div>
  </div>
{/if}

<style>
  :global(.pagefind-ui) {
    --pagefind-ui-primary: var(--color-primary);
    --pagefind-ui-text: var(--color-text);
    --pagefind-ui-background: transparent;
    --pagefind-ui-border: var(--color-border);
    --pagefind-ui-tag: var(--color-bg-secondary);
    --pagefind-ui-font: ui-sans-serif, system-ui, sans-serif;
  }
</style>