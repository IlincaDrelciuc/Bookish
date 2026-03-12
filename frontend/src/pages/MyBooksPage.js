import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import DefaultBookCover from '../components/DefaultBookCover';

function hasGoodCover(url) {
  return url && (url.includes('books.google') || url.includes('openlibrary'));
}

export default function MyBooksPage() {
  const [books, setBooks] = useState({ 'to-read': [], 'reading': [], 'finished': [] });
  const [activeTab, setActiveTab] = useState('reading');
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiCall('GET', '/reading-list', null, token)
      .then(setBooks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  async function updateStatus(bookId, newStatus) {
    try {
      await apiCall('PATCH', `/reading-list/${bookId}`, { status: newStatus }, token);
      const updated = await apiCall('GET', '/reading-list', null, token);
      setBooks(updated);
    } catch (err) { console.error(err); }
  }

  async function updateProgress(bookId, currentPage) {
    try {
      await apiCall('PATCH', `/reading-list/${bookId}`, { currentPage: parseInt(currentPage) }, token);
      const updated = await apiCall('GET', '/reading-list', null, token);
      setBooks(updated);
    } catch (err) { console.error(err); }
  }

  async function rateBook(bookId, score) {
    try {
      await apiCall('POST', '/reviews/rate', { bookId, score }, token);
      const updated = await apiCall('GET', '/reading-list', null, token);
      setBooks(updated);
    } catch (err) { console.error(err); }
  }

  const tabs = [
    { key: 'reading', label: 'Currently Reading' },
    { key: 'to-read', label: 'Want to Read' },
    { key: 'finished', label: 'Finished' },
  ];

  const currentBooks = books[activeTab] || [];
  const totalFinished = books['finished']?.length || 0;
  const totalReading = books['reading']?.length || 0;
  const totalToRead = books['to-read']?.length || 0;

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url('/fundal_register.avif')`,
      backgroundSize: 'cover', backgroundAttachment: 'fixed',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Lora', Georgia, serif",
      color: 'rgba(212,175,100,0.7)', fontStyle: 'italic',
      position: 'relative',
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,5,2,0.72)', zIndex: 0, pointerEvents: 'none' }} />
      <span style={{ position: 'relative', zIndex: 1 }}>Loading your books...</span>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url('/fundal_register.avif')`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      fontFamily: "'Lora', Georgia, serif",
      paddingBottom: '60px', position: 'relative',
    }}>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(8,5,2,0.72)',
        zIndex: 0, pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderBottom: '1px solid rgba(212,175,100,0.12)',
        padding: '28px 48px 24px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: 'rgba(20,12,4,0.25)',
      }}>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px', color: 'rgba(212,175,100,0.6)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: 0, marginBottom: '8px',
        }}>Your Collection</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '36px', fontWeight: '700',
          color: '#f0e0c0', margin: 0, marginBottom: '14px',
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>My Books</h1>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { value: totalFinished, label: totalFinished === 1 ? 'book finished' : 'books finished', icon: '✓' },
            { value: totalReading, label: totalReading === 1 ? 'book in progress' : 'books in progress', icon: '📖' },
            { value: totalToRead, label: totalToRead === 1 ? 'book on wishlist' : 'books on wishlist', icon: '♡' },
          ].map(({ value, label, icon }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(212,175,100,0.4)' }}>{icon}</span>
              <span style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '15px', fontWeight: '600', color: '#d4af37',
              }}>{value}</span>
              <span style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '12px', color: 'rgba(212,175,100,0.45)', fontStyle: 'italic',
              }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '0 48px' }}>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(212,175,100,0.12)',
          marginBottom: '36px', marginTop: '32px',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 24px', border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #d4af37' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === tab.key ? '#f0e0c0' : 'rgba(212,175,100,0.45)',
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '13px',
                fontWeight: activeTab === tab.key ? '600' : '400',
                letterSpacing: '0.06em', cursor: 'pointer',
                transition: 'all 0.2s', marginBottom: '-1px',
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: '8px', fontSize: '11px',
                color: activeTab === tab.key ? '#d4af37' : 'rgba(212,175,100,0.3)',
              }}>
                {books[tab.key]?.length || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {currentBooks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '18px', color: 'rgba(212,175,100,0.4)',
              fontStyle: 'italic', marginBottom: '24px',
            }}>No books here yet</div>
            <button
              onClick={() => navigate('/books')}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)',
                border: '1px solid rgba(212,175,100,0.25)',
                borderRadius: '4px', color: '#fff8ee',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '13px', fontWeight: '600',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >Browse Books</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentBooks.map(item => (
              <BookCard
                key={item.id}
                item={item}
                activeTab={activeTab}
                onNavigate={id => navigate(`/books/${id}`)}
                onUpdateStatus={updateStatus}
                onUpdateProgress={updateProgress}
                onRate={rateBook}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookCard({ item, activeTab, onNavigate, onUpdateStatus, onUpdateProgress, onRate }) {
  const [hoverStar, setHoverStar] = useState(null);
  const [pageInput, setPageInput] = useState(item.current_page || '');
  const userRating = item.user_rating || 0;

  // Keep pageInput in sync if item updates
  useEffect(() => {
    setPageInput(item.current_page || '');
  }, [item.current_page]);

  return (
    <div style={{
      display: 'flex', gap: '24px', padding: '20px',
      background: 'rgba(20,12,4,0.55)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(212,175,100,0.12)',
      borderRadius: '8px',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      alignItems: 'stretch',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(212,175,100,0.3)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(212,175,100,0.12)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Cover */}
      <div
        onClick={() => onNavigate(item.book_id)}
        style={{
          flexShrink: 0, width: '100px', height: '150px',
          borderRadius: '6px', overflow: 'hidden',
          border: '1px solid rgba(212,175,100,0.15)',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        {hasGoodCover(item.cover_image_url) ? (
          <img
            src={item.cover_image_url}
            alt={item.title}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: 'sepia(10%) contrast(105%) brightness(95%)',
            }}
          />
        ) : (
          <DefaultBookCover
            title={item.title}
            author={(item.authors || []).join(', ')}
            width="100px"
            height="150px"
          />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Title + finished badge */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', gap: '12px', marginBottom: '4px',
          }}>
            <h3
              onClick={() => onNavigate(item.book_id)}
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '17px', fontWeight: '600',
                color: '#f0e0c0', margin: 0, cursor: 'pointer', lineHeight: 1.3,
              }}
            >{item.title}</h3>
            {activeTab === 'finished' && item.finish_date && (
              <span style={{
                flexShrink: 0,
                background: 'rgba(212,175,100,0.1)',
                border: '1px solid rgba(212,175,100,0.2)',
                borderRadius: '20px', padding: '3px 10px',
                fontSize: '11px', color: 'rgba(212,175,100,0.6)',
                fontStyle: 'italic', fontFamily: "'Lora', Georgia, serif",
                whiteSpace: 'nowrap',
              }}>
                ✓ Finished {new Date(item.finish_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          {/* Author */}
          <p style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '13px', color: 'rgba(212,175,100,0.6)',
            fontStyle: 'italic', margin: '0 0 12px 0',
          }}>
            {(item.authors || []).join(', ')}
          </p>

          {/* Meta row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            flexWrap: 'wrap', marginBottom: '12px',
          }}>
            {item.page_count && (
              <span style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '12px', color: 'rgba(212,175,100,0.45)',
              }}>{item.page_count} pages</span>
            )}
            {item.publication_year && (
              <span style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '12px', color: 'rgba(212,175,100,0.45)',
              }}>{item.publication_year}</span>
            )}
            {item.average_rating && (
              <span style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '12px', color: 'rgba(212,175,100,0.45)',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <span style={{ color: '#d4af37' }}>★</span>
                {parseFloat(item.average_rating).toFixed(1)} avg
              </span>
            )}
          </div>

          {/* My Rating */}
          <div style={{ marginBottom: '14px' }}>
            <p style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '11px', color: 'rgba(212,175,100,0.4)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              margin: '0 0 5px 0',
            }}>
              {userRating ? 'My Rating' : 'Rate this book'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => onRate(item.book_id, n)}
                  onMouseEnter={() => setHoverStar(n)}
                  onMouseLeave={() => setHoverStar(null)}
                  style={{
                    background: 'none', border: 'none',
                    cursor: 'pointer', padding: '0 1px',
                    fontSize: '20px',
                    color: n <= (hoverStar ?? userRating)
                      ? '#d4af37'
                      : 'rgba(212,175,100,0.2)',
                    transition: 'color 0.1s',
                    lineHeight: 1,
                  }}
                >★</button>
              ))}
              {userRating > 0 && (
                <span style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '12px', color: 'rgba(212,175,100,0.5)',
                  marginLeft: '6px',
                }}>{userRating}/5</span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {activeTab === 'reading' && item.page_count && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '11px', color: 'rgba(212,175,100,0.5)',
                letterSpacing: '0.06em', marginBottom: '6px',
              }}>
                <span>PROGRESS</span>
                <span>{pageInput || 0} / {item.page_count} pages · {Math.round(((pageInput || 0) / item.page_count) * 100)}%</span>
              </div>
              <div style={{
                height: '3px', background: 'rgba(212,175,100,0.12)',
                borderRadius: '2px', marginBottom: '8px',
              }}>
                <div style={{
                  height: '100%', borderRadius: '2px',
                  background: 'linear-gradient(90deg, #8b6914, #d4a54a)',
                  width: `${Math.min(100, Math.round(((pageInput || 0) / item.page_count) * 100))}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <input
                type="number"
                placeholder="Update page"
                value={pageInput}
                min={0}
                max={item.page_count}
                onChange={e => setPageInput(e.target.value)}
                onBlur={() => {
                  if (pageInput !== '' && pageInput !== item.current_page) {
                    onUpdateProgress(item.book_id, pageInput);
                  }
                }}
                style={{
                  padding: '5px 10px',
                  background: 'rgba(255,245,220,0.06)',
                  border: '1px solid rgba(212,175,100,0.2)',
                  borderRadius: '4px', color: '#e8d5b0',
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '12px', width: '130px', outline: 'none',
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none',
                  appearance: 'textfield',
                }}
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        {activeTab !== 'finished' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {activeTab === 'to-read' && (
              <button
                onClick={() => onUpdateStatus(item.book_id, 'reading')}
                style={{
                  padding: '6px 14px', background: 'transparent',
                  border: '1px solid rgba(212,175,100,0.25)',
                  borderRadius: '4px', color: 'rgba(232,213,176,0.7)',
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '12px', cursor: 'pointer',
                  letterSpacing: '0.04em', transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.target.style.background = 'rgba(212,175,100,0.1)';
                  e.target.style.borderColor = 'rgba(212,175,100,0.5)';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = 'rgba(212,175,100,0.25)';
                }}
              >Start Reading</button>
            )}
            <button
              onClick={() => onUpdateStatus(item.book_id, 'finished')}
              style={{
                padding: '6px 14px',
                background: 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)',
                border: '1px solid rgba(212,175,100,0.25)',
                borderRadius: '4px', color: '#fff8ee',
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '12px', cursor: 'pointer', letterSpacing: '0.04em',
              }}
            >Mark Finished</button>
            {activeTab === 'reading' && (
              <button
                onClick={() => onUpdateStatus(item.book_id, 'to-read')}
                style={{
                  padding: '6px 14px', background: 'transparent',
                  border: '1px solid rgba(212,175,100,0.2)',
                  borderRadius: '4px', color: 'rgba(212,175,100,0.6)',
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '12px', cursor: 'pointer',
                  letterSpacing: '0.04em', transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.target.style.background = 'rgba(212,175,100,0.08)';
                  e.target.style.borderColor = 'rgba(212,175,100,0.4)';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = 'rgba(212,175,100,0.2)';
                }}
              >Move to Want to Read</button>
            )}
          </div>
        )}

        {/* Start date */}
        {activeTab === 'reading' && item.start_date && (
          <div style={{
            fontSize: '11px', color: 'rgba(212,175,100,0.35)',
            marginTop: '8px', fontStyle: 'italic',
          }}>
            Started {new Date(item.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  );
}