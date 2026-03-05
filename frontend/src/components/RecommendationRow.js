import RecommendationCard from './RecommendationCard';

export default function RecommendationRow({ title, subtitle, books, loading, error, geminiMode }) {
  return (
    <div style={{ marginBottom: '52px' }}>

      {/* Section header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{
          margin: '0 0 4px 0',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '22px', fontWeight: '600',
          color: '#2c1a06',
        }}>{title}</h2>
        {subtitle && (
          <p style={{
            margin: 0,
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '13px', color: '#a07840',
            fontStyle: 'italic',
          }}>{subtitle}</p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{
          height: '280px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,250,240,0.5)',
          border: '1px solid rgba(139,101,48,0.12)',
          borderRadius: '3px',
          fontFamily: "'Lora', Georgia, serif",
          color: '#a07840', fontStyle: 'italic', fontSize: '14px',
        }}>
          {geminiMode ? 'Asking Gemini for personalised picks...' : 'Finding recommendations...'}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          height: '100px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(180,60,60,0.06)',
          border: '1px solid rgba(180,60,60,0.15)',
          borderRadius: '3px',
          fontFamily: "'Lora', Georgia, serif",
          color: '#8b3030', fontSize: '14px', fontStyle: 'italic',
        }}>
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && books.length === 0 && (
        <div style={{
          height: '100px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,250,240,0.5)',
          border: '1px solid rgba(139,101,48,0.12)',
          borderRadius: '3px',
          fontFamily: "'Lora', Georgia, serif",
          color: '#a07840', fontSize: '14px', fontStyle: 'italic',
        }}>
          No recommendations yet — add more books to your reading history.
        </div>
      )}

      {/* Book cards */}
      {!loading && !error && books.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '12px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(139,101,48,0.2) transparent',
        }}>
          {books.map((book, i) => (
            <div key={book.id} style={{ minWidth: '180px', maxWidth: '180px', flexShrink: 0 }}>
              <RecommendationCard
                book={book}
                rank={i + 1}
                reason={geminiMode ? book.reason : undefined}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}