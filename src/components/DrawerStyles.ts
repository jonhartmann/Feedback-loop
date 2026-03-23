import type React from 'react'

export const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', fontSize: 11,
  padding: '3px 6px', background: '#0e0e20', color: '#c0c0e0',
  border: '1px solid #2a2a4a', borderRadius: 3, outline: 'none', marginBottom: 4,
}

export const btn = (primary?: boolean): React.CSSProperties => ({
  fontSize: 11, padding: '3px 8px', borderRadius: 3, cursor: 'pointer',
  border: 'none', background: primary ? '#2255aa' : '#1c1c34',
  color: primary ? '#d0e0ff' : '#8080a0',
})

export const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', padding: '0 3px',
  fontSize: 12, lineHeight: 1, color: '#6060a0',
}
