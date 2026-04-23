import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination component
 * Props: page, totalPages, onPageChange, totalItems, pageSize
 */
export default function Pagination({ page = 1, totalPages = 1, onPageChange, totalItems, pageSize }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left  = page - delta;
  const right = page + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      pages.push(i);
    }
  }

  // Insert ellipsis
  const withEllipsis = [];
  let prev = null;
  for (const p of pages) {
    if (prev !== null && p - prev > 1) {
      withEllipsis.push('...');
    }
    withEllipsis.push(p);
    prev = p;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      flexWrap: 'wrap',
      gap: 8,
    }}>
      {totalItems != null && (
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
          Showing{' '}
          <b style={{ color: 'var(--text)' }}>{Math.min((page - 1) * pageSize + 1, totalItems)}</b>
          {' '}–{' '}
          <b style={{ color: 'var(--text)' }}>{Math.min(page * pageSize, totalItems)}</b>
          {' '}of{' '}
          <b style={{ color: 'var(--text)' }}>{totalItems}</b>
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={btnStyle(false, page === 1)}
        >
          <ChevronLeft size={14} />
        </button>
        {withEllipsis.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--muted)', fontSize: 13 }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={btnStyle(p === page, false)}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          style={btnStyle(false, page === totalPages)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function btnStyle(active, disabled) {
  return {
    minWidth: 32,
    height: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    border: active ? '1.5px solid #1a6fa8' : '1px solid var(--border)',
    background: active ? '#1a6fa8' : 'var(--surface)',
    color: active ? '#fff' : disabled ? 'var(--muted2)' : 'var(--text)',
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
    padding: '0 6px',
  };
}
