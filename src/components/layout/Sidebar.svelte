<script lang="ts">
  import ProfileCard from '../features/ProfileCard.svelte';
  import TagCloud from '../features/TagCloud.svelte';
  import CategoryNav from '../features/CategoryNav.svelte';
  
  interface Category {
    name: string;
    href: string;
    count: number;
  }

  interface Tag {
    name: string;
    count: number;
    href: string;
  }

  interface Props {
    name?: string;
    description?: string;
    avatar?: string;
    noteCount?: number;
    categoryCount?: number;
    tagCount?: number;
    categories?: Category[];
    tags?: Tag[];
    currentCategory?: string;
    currentTag?: string;
    currentPath?: string;
  }

  let {
    name = 'LiteASCII',
    description = '知识生长于链接之中',
    avatar = '/ProfileImage.png',
    noteCount = 0,
    categoryCount = 0,
    tagCount = 0,
    categories = [],
    tags = [],
    currentCategory,
    currentTag,
    currentPath
  }: Props = $props();

  const processedCategories = $derived(
    categories.map(cat => 
      cat.name === '未分类' 
        ? { ...cat, count: noteCount } 
        : cat
    )
  );

  const categoryNavCurrent = $derived(
    currentCategory || (currentPath === '/notes' ? '未分类' : undefined)
  );
</script>

<aside class="sidebar-container">
  <ProfileCard 
    {name}
    {description}
    {avatar}
    {noteCount}
    {categoryCount}
    {tagCount}
  />

  {#if categories.length > 0}
    <div class="card-border">
      <h3 class="sidebar-section-title">
        <span class="sidebar-section-indicator"></span>
        分类
      </h3>
      <CategoryNav categories={processedCategories} current={categoryNavCurrent} />
    </div>
  {/if}

  {#if tags.length > 0}
    <div class="card-border">
      <h3 class="sidebar-section-title">
        <span class="sidebar-section-indicator"></span>
        标签
      </h3>
      <TagCloud {tags} current={currentTag} />
    </div>
  {/if}
</aside>