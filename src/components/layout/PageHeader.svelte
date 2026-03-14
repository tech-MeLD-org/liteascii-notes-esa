<script lang="ts">
  interface Props {
    title: string;
    subtitle?: string;
  }
  let { title, subtitle }: Props = $props();
</script>

<header class="page-header">
  <h1 class="page-header-title">{title}</h1>
  {#if subtitle}
    <p class="page-header-subtitle">{subtitle}</p>
  {/if}
</header>