import { getCollection, render } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const entries = await getCollection('linux');

  const index = await Promise.all(
    entries.map(async (entry) => {
      const { headings } = await render(entry);
      return {
        title:       entry.data.title,
        description: entry.data.description,
        slug:        entry.id,
        topic:       'Linux',
        topicColor:  '#10b981',
        href:        `/topics/linux/${entry.id}`,
        headings:    headings.map((h) => ({
          id:    h.slug,
          text:  h.text,
          depth: h.depth,
        })),
      };
    })
  );

  const sorted = index.sort((a, b) => {
    const ea = entries.find((e) => e.id === a.slug);
    const eb = entries.find((e) => e.id === b.slug);
    return (ea?.data.order ?? 99) - (eb?.data.order ?? 99);
  });

  return new Response(JSON.stringify(sorted), {
    headers: { 'Content-Type': 'application/json' },
  });
};
