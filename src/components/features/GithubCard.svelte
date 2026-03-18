<script>
  export let repoData = {};
</script>

<a 
  href={repoData.html_url} 
  target="_blank" 
  rel="noopener noreferrer"
  class="interactive-card ui-card ui-card-hover group flex flex-col p-5 no-underline transition-all"
>
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2">
      <svg class="w-5 h-5 text-text-main group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
      </svg>
      <span class="text-lg font-bold text-text-main group-hover:text-primary transition-colors">
        {repoData.name}
      </span>
    </div>
    
    {#if repoData.language}
      <span class="text-[10px] font-mono px-2 py-0.5 rounded border border-border-main text-text-muted uppercase">
        {repoData.language}
      </span>
    {/if}
  </div>

  <p class="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed flex-1">
    {repoData.description || "No description provided."}
  </p>

  <div class="flex items-center gap-4 text-xs font-mono text-text-muted">
    <div class="flex items-center gap-1.5">
      <span class="text-primary">★</span>
      {repoData.stargazers_count}
    </div>
    <div class="flex items-center gap-1.5">
      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 3v12m0 0a3 3 0 1 0 3 3M6 15a3 3 0 0 1 3 3M18 6l-6 6-6-6m12 0h-6m0 0V3"></path></svg>
      {repoData.forks_count}
    </div>
  </div>
</a>

<style>
  /* 确保链接不带下划线，即便是在 prose 文章内 */
  a { text-decoration: none !important; }
</style>