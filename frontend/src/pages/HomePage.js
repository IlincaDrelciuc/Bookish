import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

export default function HomePage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [sqlRecs, setSqlRecs] = useState([]);
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [loadingSql, setLoadingSql] = useState(true);
  const [loadingReading, setLoadingReading] = useState(true);

  useEffect(() => {
    apiCall('GET', '/recommendations/sql-v2', null, token)
      .then(data => setSqlRecs(data.recommendations || []))
      .catch(console.error)
      .finally(() => setLoadingSql(false));

    apiCall('GET', '/reading-list?status=reading', null, token)
      .then(data => setCurrentlyReading(data.books || data || []))
      .catch(console.error)
      .finally(() => setLoadingReading(false));
  }, [token]);

  const sectionTitle = (title, subtitle) => (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '22px', fontWeight: '600',
        color: '#2c1a06', margin: 0, marginBottom: '4px',
      }}>{title}</h2>
      {subtitle && (
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px', color: '#a07840',
          fontStyle: 'italic', margin: 0,
        }}>{subtitle}</p>
      )}
    </div>
  );

  const BookCard = ({ book }) => {
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

    return (
      <div
        onClick={() => navigate(`/books/${book.id}`)}
        style={{ cursor: 'pointer', flexShrink: 0, width: '130px' }}
      >
        <div style={{
          width: '130px', height: '190px',
          borderRadius: '3px', overflow: 'hidden',
          marginBottom: '10px',
          border: '1px solid rgba(139,101,48,0.2)',
          boxShadow: '0 4px 16px rgba(139,101,48,0.12)',
        }}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={book.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => {
                e.target.style.display = 'none';
                e.target.parentNode.style.background = 'rgba(139,101,48,0.08)';
                setCoverUrl(null);
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'rgba(139,101,48,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px',
            }}>📖</div>
          )}
        </div>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '12px', color: '#2c1a06',
          margin: 0, marginBottom: '3px', lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{book.title}</p>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '11px', color: '#a07840',
          fontStyle: 'italic', margin: 0,
        }}>
          {(book.authors || []).slice(0, 1).join('')}
        </p>
      </div>
    );
  };

  const shimmer = (w, h) => (
    <div style={{
      width: w, height: h,
      background: 'rgba(139,101,48,0.08)',
      borderRadius: '3px', flexShrink: 0,
    }} />
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f5ead6 0%, #ede0c4 50%, #e8d5b0 100%)',
      fontFamily: "'Lora', Georgia, serif",
      paddingBottom: '60px',
    }}>

      <div style={{
        borderBottom: '1px solid rgba(139,101,48,0.15)',
        padding: '40px 48px 32px',
      }}>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px', color: '#8b6530',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: 0, marginBottom: '8px',
        }}>Welcome back</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '36px', fontWeight: '700',
          color: '#2c1a06', margin: 0,
        }}>{user?.username}</h1>
      </div>

      <div style={{ padding: '0 48px' }}>

        {(loadingReading || currentlyReading.length > 0) && (
          <section style={{ marginBottom: '52px', paddingTop: '40px' }}>
            {sectionTitle('Currently Reading', 'Pick up where you left off')}
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
              {loadingReading
                ? [1, 2, 3].map(i => <div key={i}>{shimmer(130, 190)}</div>)
                : currentlyReading.map(book => <BookCard key={book.id} book={book} />)
              }
            </div>
          </section>
        )}

        <section style={{ marginBottom: '52px', paddingTop: '8px' }}>
          {sectionTitle('Recommended For You', 'Based on your reading taste')}
          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
            {loadingSql
              ? [1, 2, 3, 4, 5].map(i => <div key={i}>{shimmer(130, 190)}</div>)
              : sqlRecs.length > 0
                ? sqlRecs.map(book => <BookCard key={book.id} book={book} />)
                : <p style={{ color: '#a07840', fontStyle: 'italic', fontSize: '14px' }}>
                    No recommendations yet. Add some books to your reading list.
                  </p>
            }
          </div>
        </section>

      </div>
    </div>
  );
}