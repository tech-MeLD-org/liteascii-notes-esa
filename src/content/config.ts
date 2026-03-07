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
    title: z.string().optional(),
    date: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    draft: z.boolean().optional(),
  }).passthrough(),
});

export const collections = { notes };
