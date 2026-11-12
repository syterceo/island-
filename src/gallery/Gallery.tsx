import { listDefinitions } from '@/island';

/** Placeholder: lists the registered activities. A full side by side gallery comes later. */
export function Gallery() {
  const definitions = listDefinitions();
  return (
    <main style={{ minHeight: '100vh', padding: 32, background: 'var(--ui-bg)', color: 'var(--ui-fg)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Gallery</h1>
      <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0 }}>
        {definitions.map((definition) => (
          <li key={definition.kind} style={{ color: 'var(--ui-fg-2)' }}>
            {definition.title} <span style={{ color: 'var(--ui-fg-3)' }}>({definition.kind}, {definition.type})</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
