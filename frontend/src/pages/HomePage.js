import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

export default function HomePage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [sqlRecs, setSqlRecs] = useState([]);
  const [geminiRecs, setGeminiRecs] = useState([]);
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [loadingSql, setLoadingSql] = useState(true);
  const [loadingGemini, setLoadingGemini] = useState(true);
  const [loadingReading, setLoadingReading] = useState(true);

  useEffect(() => {
    apiCall('GET', '/recommendations/sql-v2', null, token)
      .then(data => setSqlRecs(data.recommendations || []))
      .catch(console.error)
      .finally(() => setLoadingSql(false));

    apiCall('GET', '/recommendations/gemini', null, token)
      .then(data => setGeminiRecs(data.recommendations || []))
      .catch(console.error)
      .finally(() => setLoadingGemini(false));

    apiCall('GET', '/reading-list?status=reading', null, token)
      .then(data => setCurrentlyReading(data.books || data || []))
      .catch(console.error)
      .finally(() => setLoadingReading(false));
  }, [token]);

  const sectionTitle = (title, subtitle) => (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '22px',
        fontWeight: '600',
        color: '#f0e0c0',
        margin: 0,
        marginBottom: '4px',
      }}>{title}</h2>
      {subtitle && (
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px',
          color: 'rgba(232,213,176,0.5)',
          fontStyle: 'italic',
          margin: 0,
        }}>{subtitle}</p>
      )}
    </div>
  );

  const BookCard = ({ book }) => (
    <div
      onClick={() => navigate(`/books/${book.id}`)}
      style={{
        cursor: 'pointer',
        flexShrink: 0,
        width: '130px',
      }}
    >
      <div style={{
        width: '130px',
        height: '190px',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '10px',
        border: '1px solid rgba(212,175,100,0.15)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}>
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => {
              e.target.style.display = 'none';
              e.target.parentNode.style.background = 'rgba(212,175,100,0.1)';
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'rgba(212,175,100,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px',
          }}>📖</div>
        )}
      </div>
      <p style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: '12px',
        color: '#f0e0c0',
        margin: 0,
        marginBottom: '3px',
        lineHeight: 1.3,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>{book.title}</p>
      <p style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: '11px',
        color: 'rgba(232,213,176,0.45)',
        fontStyle: 'italic',
        margin: 0,
      }}>
        {(book.authors || []).slice(0, 1).join('')}
      </p>
    </div>
  );

  const GeminiCard = ({ book }) => (
    <div
      onClick={() => navigate(`/books/${book.id}`)}
      style={{
        cursor: 'pointer',
        background: 'rgba(255,245,220,0.04)',
        border: '1px solid rgba(212,175,100,0.15)',
        borderRadius: '4px',
        padding: '16px',
        display: 'flex',
        gap: '16px',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,175,100,0.35)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(212,175,100,0.15)'}
    >
      <div style={{
        flexShrink: 0,
        width: '60px',
        height: '88px',
        borderRadius: '2px',
        overflow: 'hidden',
        border: '1px solid rgba(212,175,100,0.15)',
      }}>
        {book.cover_image_url ? (
          <img src={book.cover_image_url} alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(212,175,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📖</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '15px',
          color: '#f0e0c0',
          margin: 0,
          marginBottom: '4px',
          fontWeight: '600',
        }}>{book.title}</p>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '12px',
          color: 'rgba(232,213,176,0.5)',
          fontStyle: 'italic',
          margin: 0,
          marginBottom: '8px',
        }}>{(book.authors || []).join(', ')}</p>
        {book.explanation && (
          <p style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '12px',
            color: 'rgba(232,213,176,0.65)',
            margin: 0,
            lineHeight: 1.5,
          }}>{book.explanation}</p>
        )}
      </div>
    </div>
  );

  const shimmer = (w, h) => (
    <div style={{
      width: w, height: h,
      background: 'rgba(212,175,100,0.06)',
      borderRadius: '3px',
      flexShrink: 0,
    }} />
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0a06 0%, #1a1008 40%, #0d0b08 100%)',
      fontFamily: "'Lora', Georgia, serif",
      paddingBottom: '60px',
    }}>

      {/* Hero greeting */}
      <div style={{
        borderBottom: '1px solid rgba(212,175,100,0.1)',
        padding: '40px 48px 32px',
        marginBottom: '8px',
      }}>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px',
          color: 'rgba(212,175,100,0.6)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          margin: 0,
          marginBottom: '8px',
        }}>Welcome back</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '36px',
          fontWeight: '700',
          color: '#f0e0c0',
          margin: 0,
        }}>{user?.username}</h1>
      </div>

      <div style={{ padding: '0 48px' }}>

        {/* Currently reading */}
        {(loadingReading || currentlyReading.length > 0) && (
          <section style={{ marginBottom: '52px', paddingTop: '40px' }}>
            {sectionTitle('Currently Reading', 'Pick up where you left off')}
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
              {loadingReading
                ? [1,2,3].map(i => shimmer(130, 190))
                : currentlyReading.map(book => <BookCard key={book.id} book={book} />)
              }
            </div>
          </section>
        )}

        {/* SQL recommendations */}
        <section style={{ marginBottom: '52px', paddingTop: '8px' }}>
          {sectionTitle('Recommended For You', 'Based on your reading taste')}
          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
            {loadingSql
              ? [1,2,3,4,5].map(i => shimmer(130, 190))
              : sqlRecs.length > 0
                ? sqlRecs.map(book => <BookCard key={book.id} book={book} />)
                : <p style={{ color: 'rgba(232,213,176,0.4)', fontStyle: 'italic', fontSize: '14px' }}>No recommendations yet. Add some books to your reading list.</p>
            }
          </div>
        </section>

        {/* Gemini recommendations */}
        <section style={{ marginBottom: '52px' }}>
          {sectionTitle('AI Picks', 'Curated by Gemini with explanations')}
          {loadingGemini ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1,2,3].map(i => shimmer('100%', 100))}
            </div>
          ) : geminiRecs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {geminiRecs.map(book => <GeminiCard key={book.id} book={book} />)}
            </div>
          ) : (
            <p style={{ color: 'rgba(232,213,176,0.4)', fontStyle: 'italic', fontSize: '14px' }}>
              AI recommendations are loading or unavailable right now.
            </p>
          )}
        </section>

      </div>
    </div>
  );
}