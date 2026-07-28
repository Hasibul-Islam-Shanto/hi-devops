import { useState, useEffect, useRef, useCallback } from 'react';

interface Heading {
  id: string;
  text: string;
  depth: number;
}

interface SearchEntry {
  title: string;
  description: string;
  slug: string;
  topic: string;
  topicColor: string;
  href: string;
  headings: Heading[];
}

interface Match {
  entry: SearchEntry;
  matchedHeading: Heading | null;
  href: string;
}

function highlight(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

function searchEntries(entries: SearchEntry[], query: string): Match[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: Match[] = [];

  for (const entry of entries) {
    if (entry.title.toLowerCase().includes(q) || entry.description.toLowerCase().includes(q)) {
      results.push({ entry, matchedHeading: null, href: entry.href });
    }

    for (const h of entry.headings) {
      if (h.text.toLowerCase().includes(q)) {
        results.push({
          entry,
          matchedHeading: h,
          href: `${entry.href}#${h.id}`,
        });
      }
    }
  }

  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.href)) return false;
    seen.add(r.href);
    return true;
  });
}

export default function Search() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    fetch('/search-index.json')
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => {});
  }, []);

  const openSearch = useCallback(() => {
    setQuery('');
    setActive(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('open-search', openSearch);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('open-search', openSearch);
    };
  }, [openSearch]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const matches = searchEntries(entries, query);

  const updateQuery = useCallback((value: string) => {
    setQuery(value);
    setActive(0);
  }, []);

  const navigate = useCallback((href: string) => {
    window.location.href = href;
    setOpen(false);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && matches[active]) {
      navigate(matches[active].href);
    }
  };

  useEffect(() => {
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.60)',
          backdropFilter: 'blur(4px)',
          zIndex: 900,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        style={{
          position: 'fixed',
          top: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '600px',
          zIndex: 901,
          padding: '0 1rem',
        }}
      >
        <div
          style={{
            background: '#0f1629',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '14px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.70)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.875rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
              onKeyDown={handleKey}
              aria-label="Search topics, commands, headings"
              placeholder="Search topics, commands, headings…"
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#e2e8f0',
                fontSize: '0.9375rem',
                fontFamily: 'inherit',
              }}
            />
            {query && (
              <button
                onClick={() => updateQuery('')}
                aria-label="Clear search"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
            <kbd
              style={{
                padding: '0.15em 0.45em',
                borderRadius: '5px',
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.04)',
                color: '#64748b',
                fontSize: '0.72rem',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              Esc
            </kbd>
          </div>

          {query.trim() === '' ? (
            <div
              style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                color: '#475569',
                fontSize: '0.875rem',
              }}
            >
              Start typing to search…
            </div>
          ) : matches.length === 0 ? (
            <div
              style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                color: '#475569',
                fontSize: '0.875rem',
              }}
            >
              No results for <strong style={{ color: '#94a3b8' }}>"{query}"</strong>
            </div>
          ) : (
            <ul
              ref={listRef}
              style={{
                listStyle: 'none',
                margin: 0,
                padding: '0.375rem 0',
                maxHeight: '360px',
                overflowY: 'auto',
              }}
            >
              {matches.map((m, i) => (
                <li key={m.href}>
                  <button
                    onClick={() => navigate(m.href)}
                    onMouseEnter={() => setActive(i)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      width: '100%',
                      padding: '0.625rem 1rem',
                      background: i === active ? 'rgba(99,102,241,0.12)' : 'none',
                      border: 'none',
                      borderLeft: i === active ? '2px solid #6366f1' : '2px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s ease',
                    }}
                  >
                    <span
                      style={{
                        marginTop: '2px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '7px',
                        background: `${m.entry.topicColor}18`,
                        border: `1px solid ${m.entry.topicColor}32`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {m.matchedHeading ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={m.entry.topicColor}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="4" y1="6" x2="20" y2="6" />
                          <line x1="4" y1="12" x2="14" y2="12" />
                          <line x1="4" y1="18" x2="18" y2="18" />
                        </svg>
                      ) : (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={m.entry.topicColor}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="4 17 10 11 4 5" />
                          <line x1="12" y1="19" x2="20" y2="19" />
                        </svg>
                      )}
                    </span>

                    <span style={{ minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#e2e8f0',
                          marginBottom: '0.15rem',
                        }}
                        dangerouslySetInnerHTML={{
                          __html: highlight(
                            m.matchedHeading ? m.matchedHeading.text : m.entry.title,
                            query,
                          ),
                        }}
                      />
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          color: '#64748b',
                        }}
                      >
                        <span style={{ color: m.entry.topicColor, fontWeight: 600 }}>
                          {m.entry.topic}
                        </span>
                        {m.matchedHeading && (
                          <>
                            <span>›</span>
                            <span>{m.entry.title}</span>
                          </>
                        )}
                        {!m.matchedHeading && m.entry.description && (
                          <>
                            <span>·</span>
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '340px',
                              }}
                            >
                              {m.entry.description}
                            </span>
                          </>
                        )}
                      </span>
                    </span>

                    <span
                      style={{
                        marginLeft: 'auto',
                        color: '#475569',
                        alignSelf: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              padding: '0.5rem 1rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              fontSize: '0.7rem',
              color: '#475569',
            }}
          >
            <span>
              <kbd style={kbdStyle}>↑</kbd>
              <kbd style={kbdStyle}>↓</kbd> navigate
            </span>
            <span>
              <kbd style={kbdStyle}>↵</kbd> open
            </span>
            <span>
              <kbd style={kbdStyle}>Esc</kbd> close
            </span>
            {matches.length > 0 && (
              <span style={{ marginLeft: 'auto' }}>
                {matches.length} result{matches.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        mark {
          background: rgba(99,102,241,0.30);
          color: #a5b4fc;
          border-radius: 2px;
          padding: 0 2px;
        }
      `}</style>
    </>
  );
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.1em 0.4em',
  borderRadius: '4px',
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.04)',
  fontSize: '0.68rem',
  marginRight: '2px',
  fontFamily: 'inherit',
};
