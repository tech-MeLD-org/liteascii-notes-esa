<script lang="ts">
  import { onMount } from 'svelte';

  // 1. 接收 Astro 传过来的初始数据（构建时的快照）
  let { repoData: initialData } = $props();

  // 2. 将传入的静态数据转化为 Svelte 5 的响应式状态
  let repo = $state(initialData);

  // 3. 客户端挂载时，静默获取最新数据
  onMount(async () => {
    // 如果没有完整的仓库名（例如 username/repo），则不执行
    if (!repo || !repo.full_name) return;

    try {
      // 客户端直接发起匿名请求（无 Token）。
      // GitHub 允许单个 IP 每小时 60 次的公共 API 请求，对前端展示完全够用。
      const res = await fetch(`https://api.github.com/repos/${repo.full_name}`);
      if (res.ok) {
        const freshData = await res.json();
        // 4. 获取成功后，更新本地状态，视图会自动刷新 Star 数
        repo = freshData;
      }
    } catch (error) {
      console.error("静默更新 GitHub 数据失败:", error);
      // 即使失败，页面依然显示构建时的初始数据，不会崩溃
    }
  });
</script>

<a 
  href={repo.html_url} 
  target="_blank" 
  rel="noopener noreferrer"
  class="interactive-card ui-card ui-card-hover group flex flex-col p-5 no-underline transition-all"
>
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2">
      <svg class="w-5 h-5 text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
      </svg>
      <span class="text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
        {repo.name}
      </span>
    </div>
    
    {#if repo.language}
      <span class="text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] uppercase">
        {repo.language}
      </span>
    {/if}
  </div>

  <p class="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4 leading-relaxed flex-1">
    {repo.description || "探索知识的边界，连接思想的星图"}
  </p>

  <div class="flex items-center gap-4 text-xs font-mono text-[var(--color-text-muted)]">
    <div class="flex items-center gap-1.5">
      <span class="text-[var(--color-primary)]">★</span>
      {repo.stargazers_count ?? 0}
    </div>
    <div class="flex items-center gap-1.5">
      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M6 3v12m0 0a3 3 0 1 0 3 3M6 15a3 3 0 0 1 3 3M18 6l-6 6-6-6m12 0h-6m0 0V3"></path>
      </svg>
      {repo.forks_count ?? 0}
    </div>
  </div>
</a>