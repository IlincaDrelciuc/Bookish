import RecommendationCard from './RecommendationCard';

export default function RecommendationRow({ title, subtitle, books, loading, error, geminiMode }) {
  return (
    <div style={{ marginBottom: '52px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{
          margin: '0 0 4px 0',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '22px', fontWeight: '600',
          color: '#f0e0c0',
          textShadow: '0 1px 6px rgba(0,0,0,0.5)',
        }}>{title}</h2>
        {subtitle && (
          <p style={{
            margin: 0,
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '13px', color: 'rgba(212,175,100,0.65)',
            fontStyle: 'italic',
          }}>{subtitle}</p>
        )}
      </div>

      {loading && (
        <div style={{
          height: '120px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(20,12,4,0.4)',
          border: '1px solid rgba(212,175,100,0.12)',
          borderRadius: '8px',
          fontFamily: "'Lora', Georgia, serif",
          color: 'rgba(212,175,100,0.6)', fontStyle: 'italic', fontSize: '14px',
        }}>
          {geminiMode ? 'Asking Gemini for personalised picks...' : 'Finding recommendations...'}
        </div>
      )}

      {error && (
        <div style={{
          height: '80px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(180,60,60,0.06)',
          border: '1px solid rgba(180,60,60,0.15)',
          borderRadius: '8px',
          fontFamily: "'Lora', Georgia, serif",
          color: '#e09090', fontSize: '14px', fontStyle: 'italic',
        }}>
          {error}
        </div>
      )}

      {!loading && !error && books.length === 0 && (
        <div style={{
          height: '80px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(20,12,4,0.4)',
          border: '1px solid rgba(212,175,100,0.12)',
          borderRadius: '8px',
          fontFamily: "'Lora', Georgia, serif",
          color: 'rgba(212,175,100,0.6)', fontSize: '14px', fontStyle: 'italic',
        }}>
          No recommendations yet — add more books to your reading history.
        </div>
      )}

      {!loading && !error && books.length > 0 && (
        geminiMode ? (
          // Vertical stacked layout for AI recommendations
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {books.map((book, i) => (
              <RecommendationCard
                key={book.id}
                book={book}
                rank={i + 1}
                reason={book.reason}
                geminiMode={true}
              />
            ))}
          </div>
        ) : (
          // Horizontal scrolling layout for SQL recommendations
          <div style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '12px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(212,175,100,0.2) transparent',
            alignItems: 'stretch',
          }}>
            {books.map((book, i) => (
              <div key={book.id} style={{
                minWidth: '180px', maxWidth: '180px',
                flexShrink: 0, display: 'flex',
              }}>
                <RecommendationCard
                  book={book}
                  rank={i + 1}
                  geminiMode={false}
                />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}