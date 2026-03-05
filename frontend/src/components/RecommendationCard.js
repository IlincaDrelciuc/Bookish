import { useNavigate } from 'react-router-dom';

export default function RecommendationCard({ book, rank, reason }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/books/${book.id}`)}
      style={{
        cursor: 'pointer',
        backgroundColor: 'rgba(255,250,240,0.8)',
        borderRadius: '2px',
        overflow: 'hidden',
        border: '1px solid rgba(139,101,48,0.15)',
        boxShadow: '0 2px 8px rgba(139,101,48,0.06)',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,101,48,0.14)';
        e.currentTarget.style.borderColor = 'rgba(139,101,48,0.35)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,101,48,0.06)';
        e.currentTarget.style.borderColor = 'rgba(139,101,48,0.15)';
      }}
    >
      {/* Cover with rank badge */}
      <div style={{ position: 'relative', height: '200px', backgroundColor: 'rgba(139,101,48,0.06)', overflow: 'hidden' }}>
        {book.cover_image_url && (
          <img
            src={book.cover_image_url}
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => {
              e.target.onerror = null;
              e.target.src = `https://covers.openlibrary.org/b/id/${book.goodbooks_id}-M.jpg`;
            }}
          />
        )}
        {rank && (
          <div style={{
            position: 'absolute', top: '8px', left: '8px',
            background: 'linear-gradient(135deg, #8b6914 0%, #6b4f10 100%)',
            color: '#fff8ee',
            borderRadius: '50%',
            width: '28px', height: '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '13px', fontWeight: '700',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}>
            {rank}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          margin: '0 0 4px 0',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '13px', fontWeight: '600',
          color: '#2c1a06',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {book.title}
        </h3>
        <p style={{
          margin: '0 0 8px 0',
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '12px', color: '#a07840',
          fontStyle: 'italic',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {(book.authors || []).join(', ')}
        </p>

        {/* Star rating */}
        {book.average_rating && (
          <div style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '12px', color: '#8b6914',
            marginBottom: '6px',
            letterSpacing: '1px',
          }}>
            {'★'.repeat(Math.round(book.average_rating))}
            {'☆'.repeat(5 - Math.round(book.average_rating))}
            <span style={{ color: '#a07840', marginLeft: '4px', letterSpacing: 0 }}>
              {parseFloat(book.average_rating).toFixed(1)}
            </span>
          </div>
        )}

        {/* Score badge (SQL) */}
        {book.total_score !== undefined && (
          <div style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '11px',
            color: '#6b4c1a',
            marginBottom: '6px',
            letterSpacing: '0.04em',
          }}>
            Score: {book.total_score}
            {book.author_bonus > 0 && (
              <span style={{ color: '#8b6914', marginLeft: '4px' }}>· author match ✓</span>
            )}
          </div>
        )}

        {/* Reason text (Gemini) */}
        {reason && (
          <p style={{
            margin: '8px 0 0 0',
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '12px', color: '#4a3010',
            lineHeight: '1.6', fontStyle: 'italic',
            borderTop: '1px solid rgba(139,101,48,0.12)',
            paddingTop: '8px',
          }}>
            {reason}
          </p>
        )}
      </div>
    </div>
  );
}