import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const linux = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/linux' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    topic: z.string().default('linux'),
  }),
});

const networking = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/networking' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    topic: z.string().default('networking'),
  }),
});

const docker = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docker' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    topic: z.string().default('docker'),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    readTime: z.string().default('5 min read'),
    coverImage: z.string().optional(),
    socialImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { linux, networking, docker, blog };
