import { getCollection, render } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const linuxEntries = await getCollection('linux');
  const networkingEntries = await getCollection('networking');

  const linuxIndex = await Promise.all(
    linuxEntries.map(async (entry) => {
      const { headings } = await render(entry);
      return {
        title:       entry.data.title,
        description: entry.data.description,
        slug:        entry.id,
        topic:       'Linux',
        topicColor:  '#10b981',
        href:        `/topics/linux/${entry.id}`,
        order:       entry.data.order,
        headings:    headings.map((h) => ({
          id:    h.slug,
          text:  h.text,
          depth: h.depth,
        })),
      };
    })
  );

  const networkingIndex = await Promise.all(
    networkingEntries.map(async (entry) => {
      const { headings } = await render(entry);
      return {
        title:       entry.data.title,
        description: entry.data.description,
        slug:        entry.id,
        topic:       'Networking',
        topicColor:  '#0ea5e9',
        href:        `/topics/networking/${entry.id}`,
        order:       entry.data.order,
        headings:    headings.map((h) => ({
          id:    h.slug,
          text:  h.text,
          depth: h.depth,
        })),
      };
    })
  );

  const index = [...linuxIndex, ...networkingIndex];

  const sorted = index.sort((a, b) => {
    if (a.topic !== b.topic) return a.topic.localeCompare(b.topic);
    return (a.order ?? 99) - (b.order ?? 99);
  });

  return new Response(JSON.stringify(sorted), {
    headers: { 'Content-Type': 'application/json' },
  });
};
