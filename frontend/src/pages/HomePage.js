import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

const BG_IMAGE = '/fundal_register.avif';

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
}

export default function HomePage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [sqlRecs, setSqlRecs] = useState([]);
  const [bookOfWeek, setBookOfWeek] = useState(null);
  const [loadingSql, setLoadingSql] = useState(true);
  const [loadingBow, setLoadingBow] = useState(true);
  const [addedToList, setAddedToList] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    apiCall('GET', '/recommendations/sql-v2', null, token)
      .then(data => setSqlRecs(data.recommendations || []))
      .catch(console.error)
      .finally(() => setLoadingSql(false));

    apiCall('GET', '/books?limit=200&sort=rating', null, token)
      .then(data => {
        const books = data.books || data || [];
        if (books.length > 0) {
          const week = getWeekNumber();
          const index = week % books.length;
          setBookOfWeek(books[index]);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingBow(false));
  }, [token]);

  // Autoscroll
  useEffect(() => {
  if (sqlRecs.length === 0) return;
  const interval = setInterval(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (el.scrollLeft >= maxScroll) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: 552, behavior: 'smooth' });
    }
  }, 5000);
  return () => clearInterval(interval);
}, [sqlRecs]);

  function scrollLeft() {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
  }

  function scrollRight() {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
  }

  async function handleAddToList() {
    if (!bookOfWeek) return;
    try {
      await apiCall('POST', '/reading-list', { bookId: bookOfWeek.id, status: 'want-to-read' }, token);
      setAddedToList(true);
    } catch {
      setAddedToList(true);
    }
  }

  const sectionTitle = (title, subtitle) => (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '22px', fontWeight: '600',
        color: '#f0e0c0', margin: 0, marginBottom: '4px',
        textShadow: '0 1px 6px rgba(0,0,0,0.5)',
      }}>{title}</h2>
      {subtitle && (
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px', color: 'rgba(212,175,100,0.65)',
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
        style={{
          cursor: 'pointer', flexShrink: 0, width: '160px',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={{
          width: '160px', height: '230px',
          borderRadius: '8px', overflow: 'hidden',
          marginBottom: '12px',
          border: '1px solid rgba(212,175,100,0.25)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
        }}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={book.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                filter: 'sepia(45%) contrast(110%) brightness(85%) saturate(80%)',
              }}
              onError={e => {
                e.target.style.display = 'none';
                e.target.parentNode.style.background = 'rgba(139,101,48,0.15)';
                setCoverUrl(null);
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'rgba(139,101,48,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px',
            }}>📖</div>
          )}
        </div>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px', color: '#f0e0c0',
          margin: 0, marginBottom: '4px', lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        }}>{book.title}</p>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '12px', color: 'rgba(212,175,100,0.65)',
          fontStyle: 'italic', margin: 0,
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        }}>
          {(book.authors || []).slice(0, 1).join('')}
        </p>
      </div>
    );
  };

  const shimmer = (w, h) => (
    <div style={{
      width: w, height: h,
      background: 'rgba(212,175,100,0.08)',
      borderRadius: '8px', flexShrink: 0,
    }} />
  );

  const arrowBtn = (onClick, label) => (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(20,12,4,0.6)',
        border: '1px solid rgba(212,175,100,0.25)',
        borderRadius: '50%',
        width: '40px', height: '40px',
        color: 'rgba(232,213,176,0.8)',
        fontSize: '18px',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        transition: 'border-color 0.2s, color 0.2s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(212,175,100,0.6)';
        e.currentTarget.style.color = '#f0e0c0';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(212,175,100,0.25)';
        e.currentTarget.style.color = 'rgba(232,213,176,0.8)';
      }}
    >{label}</button>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url(${BG_IMAGE})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      fontFamily: "'Lora', Georgia, serif",
      paddingBottom: '60px',
      position: 'relative',
    }}>

      {/* Dark overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 5, 2, 0.68)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* Hero header */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        borderBottom: '1px solid rgba(212,175,100,0.12)',
        padding: '28px 48px 24px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(20, 12, 4, 0.25)',
      }}>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px', color: 'rgba(212,175,100,0.6)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          margin: 0, marginBottom: '8px',
        }}>Welcome back</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '42px', fontWeight: '700',
          color: '#f0e0c0', margin: 0,
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>{user?.username}</h1>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '0 48px' }}>

        {/* Book of the Week */}
        <section style={{ paddingTop: '52px', marginBottom: '60px' }}>
          {sectionTitle('Book of the Week', 'A handpicked read to discover this week')}

          {!loadingBow && bookOfWeek && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '48px', maxWidth: '900px' }}>

             {/* Floating cover */}
<div
  onClick={() => navigate(`/books/${bookOfWeek.id}`)}
  style={{
    flexShrink: 0,
    cursor: 'pointer',
    filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.7))',
    transition: 'transform 0.15s',
    alignSelf: 'stretch',
  }}
  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
>
  <div style={{
    width: '200px',
    height: '100%',
    minHeight: '300px',
    borderRadius: '8px', overflow: 'hidden',
    border: '1px solid rgba(212,175,100,0.25)',
  }}>
    {bookOfWeek.cover_image_url ? (
      <img
        src={bookOfWeek.cover_image_url}
        alt={bookOfWeek.title}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          filter: 'sepia(45%) contrast(110%) brightness(85%) saturate(80%)',
        }}
      />
    ) : (
      <div style={{
        width: '100%', height: '100%',
        background: 'rgba(139,101,48,0.15)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '48px',
      }}>📖</div>
    )}
  </div>
</div>

              {/* Info card */}
              <div style={{
                flex: 1,
                background: 'rgba(20, 12, 4, 0.55)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(212,175,100,0.18)',
                borderRadius: '8px',
                padding: '36px 40px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                alignSelf: 'stretch',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}>
                <p style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '11px', color: 'rgba(212,175,100,0.55)',
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  margin: 0, marginBottom: '10px',
                }}>Featured this week</p>

                <h3
                  onClick={() => navigate(`/books/${bookOfWeek.id}`)}
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '28px', fontWeight: '700',
                    color: '#f0e0c0', margin: 0, marginBottom: '8px',
                    cursor: 'pointer', lineHeight: 1.2,
                  }}
                >{bookOfWeek.title}</h3>

                <p style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '15px', color: 'rgba(212,175,100,0.7)',
                  fontStyle: 'italic', margin: 0, marginBottom: '16px',
                }}>
                  {(bookOfWeek.authors || []).join(', ')}
                </p>

                {bookOfWeek.average_rating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
                    <span style={{ color: '#d4af64', fontSize: '15px' }}>★</span>
                    <span style={{
                      fontFamily: "'Lora', Georgia, serif",
                      fontSize: '14px', color: 'rgba(232,213,176,0.7)',
                    }}>{parseFloat(bookOfWeek.average_rating).toFixed(1)}</span>
                    {bookOfWeek.ratings_count && (
                      <span style={{
                        fontFamily: "'Lora', Georgia, serif",
                        fontSize: '12px', color: 'rgba(232,213,176,0.4)',
                      }}>({bookOfWeek.ratings_count?.toLocaleString()} ratings)</span>
                    )}
                  </div>
                )}

                {/* Description — show placeholder if none in DB */}
                <p style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '13px', color: 'rgba(232,213,176,0.55)',
                  lineHeight: 1.75, margin: 0, marginBottom: '28px',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontStyle: 'italic',
                }}>
                  {bookOfWeek.description
                    ? bookOfWeek.description
                    : `A beloved work by ${(bookOfWeek.authors || []).join(', ')} — rated ${parseFloat(bookOfWeek.average_rating || 0).toFixed(1)} by over ${bookOfWeek.ratings_count?.toLocaleString() || 'thousands of'} readers worldwide. Click to learn more.`
                  }
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => navigate(`/books/${bookOfWeek.id}`)}
                    style={{
                      padding: '11px 28px',
                      background: 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)',
                      border: '1px solid rgba(212,155,60,0.35)',
                      borderRadius: '4px',
                      color: '#f5e6c0',
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '12px', fontWeight: '600',
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    View Book
                  </button>
                  <button
                    onClick={handleAddToList}
                    disabled={addedToList}
                    style={{
                      padding: '11px 28px',
                      background: 'transparent',
                      border: '1px solid rgba(212,175,100,0.25)',
                      borderRadius: '4px',
                      color: addedToList ? 'rgba(212,175,100,0.4)' : 'rgba(232,213,176,0.6)',
                      fontFamily: "'Lora', Georgia, serif",
                      fontSize: '12px', letterSpacing: '0.06em',
                      cursor: addedToList ? 'default' : 'pointer',
                    }}
                  >
                    {addedToList ? '✓ Added to list' : '+ Want to read'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Recommended For You */}
        <section style={{ marginBottom: '52px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '22px', fontWeight: '600',
                color: '#f0e0c0', margin: 0, marginBottom: '4px',
                textShadow: '0 1px 6px rgba(0,0,0,0.5)',
              }}>Recommended For You</h2>
              <p style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '13px', color: 'rgba(212,175,100,0.65)',
                fontStyle: 'italic', margin: 0,
              }}>Based on your reading taste</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {arrowBtn(scrollLeft, '‹')}
              {arrowBtn(scrollRight, '›')}
            </div>
          </div>

          <div
            ref={scrollRef}
            style={{
              display: 'flex', gap: '24px',
              overflowX: 'auto', paddingBottom: '8px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {loadingSql
              ? [1, 2, 3, 4, 5].map(i => <div key={i}>{shimmer(160, 230)}</div>)
              : sqlRecs.length > 0
                ? sqlRecs.map(book => <BookCard key={book.id} book={book} />)
                : <p style={{ color: 'rgba(232,213,176,0.5)', fontStyle: 'italic', fontSize: '14px' }}>
                    No recommendations yet. Add some books to your reading list.
                  </p>
            }
          </div>
        </section>

      </div>
    </div>
  );
}