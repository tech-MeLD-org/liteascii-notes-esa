/**
 * Document TOC (Table of Contents) 交互 Hook
 * 处理文档页面的滚动监听、高亮当前标题、点击跳转逻辑
 */

import type { MarkdownHeading } from '@astrojs/markdown-remark';

export interface DocumentHeading {
  slug: string;
  text: string;
  depth: 1 | 2 | 3;
}

interface UseDocumentOptions {
  /** 滚动触发偏移量 (px) */
  offset?: number;
  /** 点击滚动时的顶部偏移 */
  scrollOffset?: number;
  /** 点击后禁用滚动监听的时长 (ms) */
  clickCooldown?: number;
}

interface UseDocumentReturn {
  /** 当前激活的标题 ID */
  activeHeadingId: string | null;
  /** 经过的标题 ID 数组（在当前激活标题之前的所有标题） */
  passingHeadingIds: string[];
  /** 滚动到指定标题 */
  scrollToHeading: (slug: string) => void;
}

/**
 * 创建文档 TOC 交互逻辑
 */
export function useDocument(
  headings: DocumentHeading[],
  options: UseDocumentOptions = {}
): UseDocumentReturn {
  const {
    offset = 120,
    scrollOffset = 100,
    clickCooldown = 1500
  } = options;

  let activeHeadingId = $state<string | null>(null);
  let passingHeadingIds = $state<string[]>([]);
  let isClickScrolling = false;
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * 设置当前激活的标题
   */
  function setActiveHeading(id: string) {
    activeHeadingId = id;
    
    // 滚动 TOC 侧边栏，使激活项可见
    const activeLink = document.querySelector(`#doc-nav a[href="#${id}"]`);
    if (activeLink) {
      activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * 根据滚动位置更新激活的标题
   */
  function updateTocOnScroll() {
    if (isClickScrolling || headings.length === 0) return;

    const triggerLine = window.scrollY + offset;
    
    // 获取所有实际存在的标题元素
    const headingElements = Array.from(
      document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3')
    ).filter((h): h is HTMLElement => h.id !== '') as HTMLElement[];

    if (headingElements.length === 0) return;

    // 找到当前在视口内的标题
    let currentHeading = headingElements[0];
    for (const h of headingElements) {
      if (h.offsetTop <= triggerLine) {
        currentHeading = h;
      } else {
        break;
      }
    }
    
    setActiveHeading(currentHeading.id);
  }

  /**
   * 滚动到指定标题
   */
  function scrollToHeading(slug: string) {
    const targetEl = document.getElementById(slug);
    if (!targetEl) return;

    isClickScrolling = true;
    setActiveHeading(slug);
    
    window.scrollTo({
      top: targetEl.offsetTop - scrollOffset,
      behavior: 'smooth'
    });

    // 清除之前的定时器
    if (scrollTimeout) clearTimeout(scrollTimeout);
    
    // 冷却后恢复滚动监听
    scrollTimeout = setTimeout(() => {
      isClickScrolling = false;
    }, clickCooldown);
  }

  // 初始化滚动监听
  $effect(() => {
    const handleScroll = () => requestAnimationFrame(updateTocOnScroll);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 初始高亮
    updateTocOnScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  });

  return {
    get activeHeadingId() { return activeHeadingId; },
    get passingHeadingIds() { return passingHeadingIds; },
    scrollToHeading
  };
}

/**
 * 从 Astro 的 headings 转换为 DocumentHeading
 */
export function convertHeadings(headings: MarkdownHeading[]): DocumentHeading[] {
  return headings
    .filter(h => h.depth >= 1 && h.depth <= 3)
    .map(h => ({
      slug: h.slug,
      text: h.text,
      depth: h.depth as 1 | 2 | 3
    }));
}