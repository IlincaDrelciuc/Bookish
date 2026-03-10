import { useNavigate } from 'react-router-dom';

export default function BookCard({ book }) {
  const navigate = useNavigate();

  function renderStars(rating) {
    const filled = Math.round(rating);
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  }

  return (
    <div
      onClick={() => navigate(`/books/${book.id}`)}
      style={{
        cursor: 'pointer',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,250,240,0.8)',
        border: '1px solid rgba(139,101,48,0.15)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.35)';
        e.currentTarget.style.borderColor = 'rgba(139,101,48,0.35)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
        e.currentTarget.style.borderColor = 'rgba(139,101,48,0.15)';
      }}
    >
      {/* Cover */}
      <div style={{
        height: '200px',
        backgroundColor: 'rgba(139,101,48,0.06)',
        overflow: 'hidden',
        borderRadius: '8px 8px 0 0',
      }}>
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: 'sepia(20%) contrast(105%) brightness(95%)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            onError={e => {
              e.target.onerror = null;
              e.target.src = `https://covers.openlibrary.org/b/id/${book.goodbooks_id}-M.jpg`;
            }}
          />
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', fontSize: '48px',
          }}>📖</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
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
          {(book.authors || []).join(', ') || 'Unknown Author'}
        </p>
        {book.average_rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#8b6914', fontSize: '12px' }}>
              {renderStars(book.average_rating)}
            </span>
            <span style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '11px', color: '#a07840',
            }}>
              {parseFloat(book.average_rating).toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}