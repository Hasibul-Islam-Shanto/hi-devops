import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  code: string;
  lang?: string;
}

export default function CodeBlock({ code, lang = 'bash' }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      position: 'relative',
      borderRadius: '10px',
      border: '1px solid var(--code-border)',
      marginBottom: '1.5rem',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.4rem 1rem',
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid var(--code-border)',
      }}>
        <span style={{
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {lang}
        </span>
        <button
          onClick={handleCopy}
          title="Copy code"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            background: copied ? 'rgba(16, 185, 129, 0.15)' : 'var(--color-surface)',
            color: copied ? '#10b981' : 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            transition: 'all 150ms ease',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <pre style={{
        background: 'var(--code-bg)',
        padding: '1.25rem',
        overflowX: 'auto',
        margin: 0,
        fontSize: '0.875rem',
        lineHeight: '1.7',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        color: 'var(--code-text)',
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
