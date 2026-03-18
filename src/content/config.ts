import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Obsidian notes collection.
 * Loads all .md files under src/content/, excluding attachments directories.
 * Notes may or may not have YAML frontmatter — all fields are optional.
 */
const notes = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/attachments/**'],
    base: './src/content',
  }),
  schema: z.object({
    title: z.string().optional().nullable(),
    date: z.coerce.date().optional().nullable(),
    description: z.string().optional().nullable(),

    // 💡 建议同时也把 tags 和 category 设为可选，防止后续报错
    tags: z.array(z.string()).optional().default([]),
    category: z.string().optional().nullable(),
    draft: z.boolean().optional().nullable(),
  }).passthrough(),
});

export const collections = { notes };
