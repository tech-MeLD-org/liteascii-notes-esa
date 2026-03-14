<script lang="ts">
  interface Props {
    name?: string;
    description?: string;
    avatar?: string;
    noteCount?: number;
    categoryCount?: number;
    tagCount?: number;
  }

  let { 
    name = 'LiteASCII', 
    description = '知识生长于链接之中',
    avatar = '/ProfileImage.png',
    noteCount = 0,
    categoryCount = 0,
    tagCount = 0
  }: Props = $props();
</script>

<div class="card-border">
  <div class="flex items-center gap-4 mb-4">
    {#if avatar}
      <img src={avatar} alt={name} class="w-16 h-16 rounded-full border-2 border-[#e74c3c]" />
    {/if}
    <div>
      <h2 class="text-xl font-bold text-[#e8e8e6]">{name}</h2>
      <p class="text-sm text-[#565658]">{description}</p>
    </div>
  </div>
  
  <div class="grid grid-cols-3 gap-2 pt-4 border-t border-[#303032]">
    <div class="text-center">
      <div class="text-xl font-bold text-[#e74c3c] font-mono">{noteCount}</div>
      <div class="text-xs text-[#565658]">笔记</div>
    </div>
    <div class="text-center">
      <div class="text-xl font-bold text-[#e74c3c] font-mono">{categoryCount}</div>
      <div class="text-xs text-[#565658]">分类</div>
    </div>
    <div class="text-center">
      <div class="text-xl font-bold text-[#e74c3c] font-mono">{tagCount}</div>
      <div class="text-xs text-[#565658]">标签</div>
    </div>
  </div>
</div>