export default function DefaultBookCover({ title, author, width = '100%', height = '100%' }) {
  const colors = [
    ['#2c1a06', '#8b6914'],
    ['#0f2027', '#4a7c8a'],
    ['#1a0a2e', '#7b4fa6'],
    ['#0a2010', '#3a7a4a'],
    ['#1a0a0a', '#8a3a3a'],
    ['#1a1205', '#7a6014'],
    ['#0d1a2e', '#3a5a8a'],
    ['#1a1a0a', '#6a7a2a'],
  ];

  const colorIndex = title ? title.charCodeAt(0) % colors.length : 0;
  const [bg, accent] = colors[colorIndex];

  return (
    <div style={{
      width, height,
      background: `linear-gradient(160deg, ${bg} 0%, #1a1008 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: '8px',
        border: `1px solid ${accent}40`,
        borderRadius: '2px',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'absolute', top: '12px', left: '12px', color: `${accent}60`, fontSize: '10px' }}>✦</div>
      <div style={{ position: 'absolute', top: '12px', right: '12px', color: `${accent}60`, fontSize: '10px' }}>✦</div>
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', color: `${accent}60`, fontSize: '10px' }}>✦</div>
      <div style={{ position: 'absolute', bottom: '12px', right: '12px', color: `${accent}60`, fontSize: '10px' }}>✦</div>
      <div style={{ width: '40px', height: '1px', background: `${accent}80`, marginBottom: '12px' }} />
      <p style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '13px', fontWeight: '700',
        color: '#f0e0c0', textAlign: 'center',
        lineHeight: '1.4', margin: '0 0 10px 0',
        padding: '0 8px', wordBreak: 'break-word',
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {title || 'Unknown Title'}
      </p>
      <div style={{ width: '40px', height: '1px', background: `${accent}80`, marginBottom: '10px' }} />
      <p style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: '10px', color: `${accent}cc`,
        textAlign: 'center', fontStyle: 'italic',
        margin: 0, padding: '0 8px', wordBreak: 'break-word',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {author || 'Unknown Author'}
      </p>
    </div>
  );
}