import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecommendationCard({ book, rank, reason }) {
  const navigate = useNavigate();
  const [coverUrl, setCoverUrl] = useState(book.cover_image_url);

  useEffect(() => {
    if (!coverUrl && book.title) {
      const author = (book.authors || [])[0] || '';
      console.log('Fetching cover for:', book.title, '| author:', author);
      fetch(`http://localhost:3001/api/books/cover-lookup?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(author)}`)
        .then(res => res.json())
        .then(data => {
          console.log('Cover result for', book.title, ':', data);
          if (data.cover_image_url) setCoverUrl(data.cover_image_url);
        })
        .catch(err => console.error('Cover fetch error:', err));
    }
  }, [book.title]);

  const handleClick = () => {
    if (book.id && typeof book.id === 'number') {
      navigate(`/books/${book.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        cursor: book.id && typeof book.id === 'number' ? 'pointer' : 'default',
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
        if (book.id && typeof book.id === 'number') {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,101,48,0.14)';
          e.currentTarget.style.borderColor = 'rgba(139,101,48,0.35)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,101,48,0.06)';
        e.currentTarget.style.borderColor = 'rgba(139,101,48,0.15)';
      }}
    >
      <div style={{ position: 'relative', height: '200px', backgroundColor: 'rgba(139,101,48,0.06)', overflow: 'hidden' }}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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

        {book.average_rating && (
          <div style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '12px', color: '#8b6914',
            marginBottom: '6px', letterSpacing: '1px',
          }}>
            {'★'.repeat(Math.round(book.average_rating))}
            {'☆'.repeat(5 - Math.round(book.average_rating))}
            <span style={{ color: '#a07840', marginLeft: '4px', letterSpacing: 0 }}>
              {parseFloat(book.average_rating).toFixed(1)}
            </span>
          </div>
        )}

        {book.total_score !== undefined && (
          <div style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '11px', color: '#6b4c1a',
            marginBottom: '6px', letterSpacing: '0.04em',
          }}>
            Score: {book.total_score}
            {book.author_bonus > 0 && (
              <span style={{ color: '#8b6914', marginLeft: '4px' }}>· author match ✓</span>
            )}
          </div>
        )}

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