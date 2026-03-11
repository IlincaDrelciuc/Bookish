import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecommendationCard({ book, rank, reason, geminiMode }) {
  const navigate = useNavigate();
  const [coverUrl, setCoverUrl] = useState(book.cover_image_url);

  useEffect(() => {
    if (!coverUrl && book.title) {
      const author = (book.authors || [])[0] || '';
      fetch(`http://localhost:3001/api/books/cover-lookup?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(author)}`)
        .then(res => res.json())
        .then(data => { if (data.cover_image_url) setCoverUrl(data.cover_image_url); })
        .catch(() => {});
    }
  }, [book.title]);

  const handleClick = () => {
    if (book.id && typeof book.id === 'number') {
      navigate(`/books/${book.id}`);
    }
  };

  function renderStars(rating) {
    const filled = Math.round(rating);
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  }

  if (geminiMode) {
    // Horizontal cover + details layout for AI recommendations
    return (
      <div
        onClick={handleClick}
        style={{
          cursor: book.id && typeof book.id === 'number' ? 'pointer' : 'default',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: 'rgba(172, 158, 133, 0.8)',
          border: '1px solid rgba(139,101,48,0.15)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
          display: 'flex',
          flexDirection: 'row',
        }}
        onMouseEnter={e => {
          if (book.id && typeof book.id === 'number') {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.35)';
            e.currentTarget.style.borderColor = 'rgba(139,101,48,0.35)';
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
          e.currentTarget.style.borderColor = 'rgba(139,101,48,0.15)';
        }}
      >
        {/* Cover */}
        <div style={{
          position: 'relative',
          width: '100px',
          flexShrink: 0,
          backgroundColor: 'rgba(139,101,48,0.06)',
          overflow: 'hidden',
          borderRadius: '8px 0 0 8px',
        }}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={book.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                filter: 'sepia(20%) contrast(105%) brightness(95%)',
              }}
              onError={e => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px',
            }}>📖</div>
          )}
          {rank && (
            <div style={{
              position: 'absolute', top: '8px', left: '8px',
              background: 'linear-gradient(135deg, #433f36 0%, #373122 100%)',
              color: '#fff8ee',
              borderRadius: '50%',
              width: '24px', height: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '12px', fontWeight: '700',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}>
              {rank}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{
          padding: '16px 18px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <h3 style={{
            margin: '0 0 4px 0',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '14px', fontWeight: '600',
            color: '#2c1a06',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {book.title}
          </h3>
          <p style={{
            margin: '0 0 8px 0',
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '12px', color: '#302415',
            fontStyle: 'italic',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {(book.authors || []).join(', ') || 'Unknown Author'}
          </p>

          {book.average_rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              <span style={{ color: '#b6970c', fontSize: '12px' }}>
                {renderStars(book.average_rating)}
              </span>
              <span style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '11px', color: '#3d2e1a',
              }}>
                {parseFloat(book.average_rating).toFixed(1)}
              </span>
            </div>
          )}

          {reason && (
            <p style={{
              margin: '8px 0 0 0',
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '12px', color: '#2c1a06',
              lineHeight: '1.6', fontStyle: 'italic',
              borderTop: '1px solid rgba(139,101,48,0.2)',
              paddingTop: '8px',
            }}>
              {reason}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Original vertical card layout for SQL recommendations
  return (
    <div
      onClick={handleClick}
      style={{
        width: '100%',
        cursor: book.id && typeof book.id === 'number' ? 'pointer' : 'default',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'rgba(172, 158, 133, 0.8)',
        border: '1px solid rgba(139,101,48,0.15)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        if (book.id && typeof book.id === 'number') {
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.35)';
          e.currentTarget.style.borderColor = 'rgba(139,101,48,0.35)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
        e.currentTarget.style.borderColor = 'rgba(139,101,48,0.15)';
      }}
    >
      {/* Cover */}
      <div style={{
        position: 'relative',
        height: '200px',
        backgroundColor: 'rgba(139,101,48,0.06)',
        overflow: 'hidden',
        borderRadius: '8px 8px 0 0',
      }}>
        {coverUrl ? (
          <img
            src={coverUrl}
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
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '48px',
          }}>📖</div>
        )}
        {rank && (
          <div style={{
            position: 'absolute', top: '8px', left: '8px',
            background: 'linear-gradient(135deg, #433f36 0%, #373122 100%)',
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
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
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
          fontSize: '12px', color: '#302415',
          fontStyle: 'italic',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {(book.authors || []).join(', ') || 'Unknown Author'}
        </p>

        {book.average_rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <span style={{ color: '#b6970c', fontSize: '12px' }}>
              {renderStars(book.average_rating)}
            </span>
            <span style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '11px', color: '#3d2e1a',
            }}>
              {parseFloat(book.average_rating).toFixed(1)}
            </span>
          </div>
        )}

        {book.total_score !== undefined && (
          <div style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '11px', color: '#3d2e1a',
            marginBottom: '6px',
          }}>
            Score: {book.total_score}
            {book.author_bonus > 0 && (
              <span style={{ color: '#8b6914', marginLeft: '4px' }}>· author match ✓</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}