import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DefaultBookCover from './DefaultBookCover';

export default function RecommendationCard({ book, rank, reason, geminiMode }) {
  const navigate = useNavigate();
  const [coverUrl, setCoverUrl] = useState(book.cover_image_url);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (!coverUrl && book.title) {
      const author = (book.authors || [])[0] || book.author || '';
      fetch(`http://localhost:3001/api/books/cover-lookup?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(author)}`)
        .then(res => res.json())
        .then(data => { if (data.cover_image_url) setCoverUrl(data.cover_image_url); })
        .catch(() => {});
    }
  }, [book.title]);

  const handleClick = async () => {
    // If we already have a valid numeric DB id, just navigate
    if (book.id && typeof book.id === 'number') {
      navigate(`/books/${book.id}`);
      return;
    }

    // Gemini book — search DB by title first
    setNavigating(true);
    try {
      const author = book.author || (book.authors || [])[0] || '';
      const query = encodeURIComponent(book.title);

      // Search local DB
      const localResults = await fetch(
        `http://localhost:3001/api/books/search?query=${query}&limit=5`
      ).then(r => r.json());

      // Try exact title match first, then partial
      const exactMatch = localResults.find(
        b => b.title.toLowerCase() === book.title.toLowerCase()
      );
      const partialMatch = localResults.find(
        b => b.title.toLowerCase().includes(book.title.toLowerCase().slice(0, 10))
      );

      if (exactMatch) {
        navigate(`/books/${exactMatch.id}`);
        return;
      }

      // Not in local DB — try Google Books and import
      const combined = await fetch(
        `http://localhost:3001/api/books/search/combined?query=${query}`
      ).then(r => r.json());

      const googleResults = combined.google || [];
      const googleMatch = googleResults.find(
        b => b.title.toLowerCase() === book.title.toLowerCase()
      ) || googleResults[0];

      if (googleMatch) {
        const imported = await fetch('http://localhost:3001/api/books/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            google_books_id: googleMatch.google_books_id,
            title: googleMatch.title,
            authors: googleMatch.authors,
            genres: googleMatch.genres,
            cover_image_url: googleMatch.cover_image_url,
            average_rating: googleMatch.average_rating,
            ratings_count: googleMatch.ratings_count,
            publication_year: googleMatch.publication_year,
            page_count: googleMatch.page_count,
            synopsis: googleMatch.synopsis,
          }),
        }).then(r => r.json());

        navigate(`/books/${imported.id}`);
        return;
      }

      // Last resort — use partial match from local DB
      if (partialMatch) {
        navigate(`/books/${partialMatch.id}`);
      }

    } catch (err) {
      console.error('Navigation error:', err);
    } finally {
      setNavigating(false);
    }
  };

  function renderStars(rating) {
    const filled = Math.round(rating);
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  }

  const hasGoodCover = coverUrl && (
    coverUrl.includes('books.google') ||
    coverUrl.includes('openlibrary')
  );

  const coverSlot = (height = '100%', width = '100%') => hasGoodCover ? (
    <img
      src={coverUrl}
      alt={book.title}
      style={{
        width: '100%', height: '100%', objectFit: 'cover',
        filter: 'sepia(20%) contrast(105%) brightness(95%)',
        transition: 'transform 0.2s',
      }}
    />
  ) : (
    <DefaultBookCover
      title={book.title}
      author={(book.authors || []).join(', ') || book.author || ''}
      width={width}
      height={height}
    />
  );

  if (geminiMode) {
    return (
      <div
        onClick={handleClick}
        style={{
          cursor: navigating ? 'wait' : 'pointer',
          borderRadius: '8px', overflow: 'hidden',
          backgroundColor: navigating ? 'rgba(152,138,113,0.8)' : 'rgba(172,158,133,0.8)',
          border: '1px solid rgba(139,101,48,0.15)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
          display: 'flex', flexDirection: 'row',
        }}
        onMouseEnter={e => {
          if (!navigating) {
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
        <div style={{
          position: 'relative', width: '100px', flexShrink: 0,
          overflow: 'hidden', borderRadius: '8px 0 0 8px',
        }}>
          {coverSlot('100%', '100px')}
          {rank && (
            <div style={{
              position: 'absolute', top: '8px', left: '8px',
              background: 'linear-gradient(135deg, #433f36 0%, #373122 100%)',
              color: '#fff8ee', borderRadius: '50%',
              width: '24px', height: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '12px', fontWeight: '700',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}>{rank}</div>
          )}
        </div>

        <div style={{
          padding: '16px 18px', flex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <h3 style={{
            margin: '0 0 4px 0',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '14px', fontWeight: '600', color: '#2c1a06',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{book.title}</h3>
          <p style={{
            margin: '0 0 8px 0',
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '12px', color: '#302415', fontStyle: 'italic',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{(book.authors || []).join(', ') || book.author || 'Unknown Author'}</p>

          {book.average_rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              <span style={{ color: '#b6970c', fontSize: '12px' }}>{renderStars(book.average_rating)}</span>
              <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '11px', color: '#3d2e1a' }}>
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
              {navigating ? 'Finding book...' : reason}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      style={{
        width: '100%',
        cursor: book.id && typeof book.id === 'number' ? 'pointer' : 'default',
        borderRadius: '8px', overflow: 'hidden',
        backgroundColor: 'rgba(172,158,133,0.8)',
        border: '1px solid rgba(139,101,48,0.15)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        display: 'flex', flexDirection: 'column',
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
      <div style={{
        position: 'relative', height: '200px',
        overflow: 'hidden', borderRadius: '8px 8px 0 0',
      }}>
        {coverSlot('200px', '100%')}
        {rank && (
          <div style={{
            position: 'absolute', top: '8px', left: '8px',
            background: 'linear-gradient(135deg, #433f36 0%, #373122 100%)',
            color: '#fff8ee', borderRadius: '50%',
            width: '28px', height: '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '13px', fontWeight: '700',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}>{rank}</div>
        )}
      </div>

      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          margin: '0 0 4px 0',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '13px', fontWeight: '600', color: '#2c1a06',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{book.title}</h3>
        <p style={{
          margin: '0 0 8px 0',
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '12px', color: '#302415', fontStyle: 'italic',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{(book.authors || []).join(', ') || 'Unknown Author'}</p>

        {book.average_rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <span style={{ color: '#b6970c', fontSize: '12px' }}>{renderStars(book.average_rating)}</span>
            <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '11px', color: '#3d2e1a' }}>
              {parseFloat(book.average_rating).toFixed(1)}
            </span>
          </div>
        )}

        {book.total_score !== undefined && (
          <div style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '11px', color: '#3d2e1a', marginBottom: '6px',
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