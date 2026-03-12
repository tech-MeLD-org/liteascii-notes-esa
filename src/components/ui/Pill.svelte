<script lang="ts">
  import { tagSlug, categorySlug } from '../../lib/core/note-logic';

  interface Props {
    variant?: 'tag' | 'category' | 'default';
    size?: 'sm' | 'md';
    /** 标签/分类的文本内容 */
    label?: string;
    /** 链接地址（传入后自动渲染为 <a> 标签） */
    href?: string;
    /** 是否自动根据 variant 生成链接 */
    autoLink?: boolean;
    children?: import('svelte').Snippet;
  }

  let {
    variant = 'default',
    size = 'sm',
    label = '',
    href = '',
    autoLink = false,
    children
  }: Props = $props();

  // 计算最终链接
  const computedHref = $derived(() => {
    if (href) return href;
    if (!autoLink || !label) return '';
    return variant === 'tag' ? `/tags/${tagSlug(label)}` :
           variant === 'category' ? `/category/${categorySlug(label)}` :
           '';
  });

  // 复合样式类
  const className = $derived(() => {
    const sizeClass = size === 'sm' ? 'ui-pill-sm' : 'ui-pill-md';
    const variantClass = variant === 'tag' ? 'ui-pill-tag' :
                         variant === 'category' ? 'ui-pill-category' :
                         'ui-pill-default';
    return `ui-pill ${sizeClass} ${variantClass}`;
  });

  const finalHref = computedHref();
  const finalClass = className();
</script>

{#if finalHref}
  <a href={finalHref} class={finalClass}>
    {#if children}
      {@render children()}
    {:else}
      {label}
    {/if}
  </a>
{:else}
  <span class={finalClass}>
    {#if children}
      {@render children()}
    {:else}
      {label}
    {/if}
  </span>
{/if}