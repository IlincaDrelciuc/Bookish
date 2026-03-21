import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import DefaultBookCover from '../components/DefaultBookCover';

function hasGoodCover(url) {
  return url && (url.includes('books.google') || url.includes('openlibrary'));
}

export default function BookDetailPage() {
  const { id } = useParams();
  const { token, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [loadingSynopsis, setLoadingSynopsis] = useState(false);
  const [readingStatus, setReadingStatus] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(null);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [hoverBookId, setHoverBookId] = useState(null);

  useEffect(() => {
    apiCall('GET', `/books/${id}`)
      .then(data => {
        setBook(data);
        if (!data.synopsis) {
          const authorNames = (data.authors || []).map(a => a.name).join(', ');
          fetchSynopsis(data.title, authorNames);
        } else {
          setSynopsis(data.synopsis);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    apiCall('GET', `/books/${id}/similar`)
      .then(setSimilarBooks)
      .catch(() => setSimilarBooks([]));
  }, [id]);

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    apiCall('GET', '/reading-list', null, token)
      .then(data => {
        const all = [
          ...(data['to-read'] || []),
          ...(data['reading'] || []),
          ...(data['finished'] || []),
        ];
        const match = all.find(item => item.book_id === parseInt(id));
        setReadingStatus(match ? match.status : null);
        setMyRating(match?.user_rating || 0);
      })
      .catch(() => {});
  }, [id, token, isLoggedIn]);

  async function fetchSynopsis(title, authors) {
    setLoadingSynopsis(true);
    try {
      const data = await apiCall('POST', '/synopsis', { title, authors }, token);
      if (data.synopsis) setSynopsis(data.synopsis);
    } catch (err) {
      console.error('Synopsis fetch failed:', err);
    } finally {
      setLoadingSynopsis(false);
    }
  }

  async function addToList(status) {
    if (!isLoggedIn) { setError('Please log in to add books.'); return; }
    try {
      await apiCall('POST', '/reading-list', { bookId: parseInt(id), status }, token);
      setReadingStatus(status);
    } catch (err) {
      setError(err.message);
    }
  }

  async function rateBook(score) {
    try {
      await apiCall('POST', '/reviews/rate', { bookId: parseInt(id), score }, token);
      setMyRating(score);
    } catch (err) { console.error(err); }
  }

  async function submitReview() {
    if (!reviewText.trim()) return;
    setReviewSubmitting(true);
    try {
      await apiCall('POST', '/reviews', {
        bookId: parseInt(id),
        body: reviewText,
        score: myRating || 5,
      }, token);
      setReviewSuccess('Review submitted!');
      setReviewText('');
      const updated = await apiCall('GET', `/books/${id}`);
      setBook(updated);
      setTimeout(() => setReviewSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setReviewSubmitting(false); }
  }

  const overlayBg = (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(8,5,2,0.72)',
      zIndex: 0, pointerEvents: 'none',
    }} />
  );

  const cardStyle = {
    background: 'rgba(20,12,4,0.55)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(212,175,100,0.12)',
    borderRadius: '10px',
    padding: '28px',
  };

  const buttons = [
    {
      status: 'to-read',
      label: readingStatus === 'to-read' ? '✓ On Want to Read' : '+ Want to Read',
      active: readingStatus === 'to-read',
    },
    {
      status: 'reading',
      label: readingStatus === 'reading' ? '📖 Currently Reading' : '📖 Reading Now',
      active: readingStatus === 'reading',
    },
    {
      status: 'finished',
      label: readingStatus === 'finished' ? '✓ Already Read' : '✓ Mark as Read',
      active: readingStatus === 'finished',
    },
  ];

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url('/fundal_register.avif')`,
      backgroundSize: 'cover', backgroundAttachment: 'fixed',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Lora', Georgia, serif",
      color: 'rgba(212,175,100,0.7)', fontStyle: 'italic', position: 'relative',
    }}>
      {overlayBg}
      <span style={{ position: 'relative', zIndex: 1 }}>Loading book details...</span>
    </div>
  );

  if (error || !book) return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url('/fundal_register.avif')`,
      backgroundSize: 'cover', backgroundAttachment: 'fixed',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Lora', Georgia, serif",
      color: '#e09090', position: 'relative',
    }}>
      {overlayBg}
      <span style={{ position: 'relative', zIndex: 1 }}>{error || 'Book not found.'}</span>
    </div>
  );

  // Use Goodreads rating first, fall back to community rating
  const avgRating = parseFloat(book.average_rating) ||
                    parseFloat(book.communityRating?.average) || 0;
  const ratingCount = book.ratings_count || 0;

  // Work out what rating label to show
  const ratingLabel = (() => {
    if (book.average_rating && ratingCount > 0) {
      return `${ratingCount.toLocaleString()} ratings on Goodreads`;
    }
    if (book.communityRating?.count > 0) {
      return `${book.communityRating.count} rating${book.communityRating.count !== 1 ? 's' : ''} on Bookish`;
    }
    return 'No ratings yet';
  })();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url('/fundal_register.avif')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      fontFamily: "'Lora', Georgia, serif",
      paddingBottom: '80px',
      position: 'relative',
    }}>
      {overlayBg}

      <div style={{
        position: 'relative', zIndex: 1,
        borderBottom: '1px solid rgba(212,175,100,0.12)',
        padding: '28px 48px 24px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: 'rgba(20,12,4,0.25)',
      }}>
        <p style={{
          fontSize: '13px', color: 'rgba(212,175,100,0.6)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: 0,
        }}>Book Details</p>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '48px' }}>
        <div style={{
          display: 'flex', gap: '40px',
          marginBottom: '48px',
          alignItems: 'stretch', flexWrap: 'wrap',
        }}>

          {/* Left column */}
          <div style={{
            flexShrink: 0, display: 'flex',
            flexDirection: 'column', gap: '16px', width: '220px',
          }}>
            <div style={{
              width: '220px', height: '320px',
              borderRadius: '8px', overflow: 'hidden',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              border: '1px solid rgba(212,175,100,0.15)',
            }}>
              {hasGoodCover(book.cover_image_url) ? (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    filter: 'sepia(10%) contrast(105%) brightness(95%)',
                  }}
                />
              ) : (
                <DefaultBookCover
                  title={book.title}
                  author={(book.authors || []).map(a => a.name).join(', ')}
                  width="220px"
                  height="320px"
                />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {buttons.map(({ status, label, active }) => (
                <button
                  key={status}
                  onClick={() => addToList(status)}
                  style={{
                    padding: '10px 16px',
                    background: active
                      ? 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)'
                      : 'rgba(212,175,100,0.08)',
                    border: active
                      ? '1px solid rgba(212,155,60,0.5)'
                      : '1px solid rgba(212,175,100,0.25)',
                    borderRadius: '6px',
                    color: active ? '#fff8ee' : 'rgba(232,213,176,0.85)',
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '13px', cursor: 'pointer',
                    letterSpacing: '0.04em', transition: 'all 0.15s',
                    textAlign: 'center',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(212,175,100,0.15)';
                      e.currentTarget.style.borderColor = 'rgba(212,175,100,0.5)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(212,175,100,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(212,175,100,0.25)';
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* My Rating */}
            {isLoggedIn && (
              <div style={{
                ...cardStyle, padding: '16px',
                display: 'flex', flexDirection: 'column', gap: '8px',
              }}>
                <p style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '11px', color: 'rgba(212,175,100,0.45)',
                  letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0,
                }}>
                  {myRating ? 'My Rating' : 'Rate this book'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => rateBook(n)}
                      onMouseEnter={() => setHoverStar(n)}
                      onMouseLeave={() => setHoverStar(null)}
                      style={{
                        background: 'none', border: 'none',
                        cursor: 'pointer', padding: '0 1px', fontSize: '22px',
                        color: n <= (hoverStar ?? myRating)
                          ? '#d4af37' : 'rgba(212,175,100,0.2)',
                        transition: 'color 0.1s', lineHeight: 1,
                      }}
                    >★</button>
                  ))}
                  {myRating > 0 && (
                    <span style={{
                      fontFamily: "'Lora', Georgia, serif",
                      fontSize: '12px', color: 'rgba(212,175,100,0.5)',
                      marginLeft: '4px',
                    }}>{myRating}/5</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '36px', fontWeight: '700',
              color: '#f0e0c0', margin: '0 0 8px 0',
              lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}>{book.title}</h1>

            <p style={{
              fontSize: '17px', color: 'rgba(212,175,100,0.8)',
              fontStyle: 'italic', margin: '0 0 20px 0',
            }}>
              by {(book.authors || []).map(a => a.name).join(', ')}
            </p>

            {/* Rating — only show stars if there is actually a rating */}
            {avgRating > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px', color: '#d4af37', letterSpacing: '3px' }}>
                    {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                  </span>
                  <span style={{
                    fontSize: '24px', fontWeight: '700', color: '#f0e0c0',
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}>
                    {avgRating.toFixed(2)}
                  </span>
                </div>
                <p style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '12px', color: 'rgba(212,175,100,0.45)',
                  fontStyle: 'italic', margin: '0 0 20px 0',
                }}>
                  {ratingLabel}
                </p>
              </>
            ) : (
              <p style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '12px', color: 'rgba(212,175,100,0.35)',
                fontStyle: 'italic', margin: '0 0 20px 0',
              }}>
                No ratings yet — be the first to rate this book
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              {(book.genres || []).map(g => (
                <span key={g.id} style={{
                  background: 'rgba(212,175,100,0.1)',
                  color: 'rgba(232,213,176,0.85)',
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                  border: '1px solid rgba(212,175,100,0.2)',
                  fontFamily: "'Lora', Georgia, serif", letterSpacing: '0.04em',
                }}>{g.name}</span>
              ))}
            </div>

            <div style={{
              display: 'flex', gap: '24px', flexWrap: 'wrap',
              fontSize: '13px', color: 'rgba(212,175,100,0.6)',
              fontStyle: 'italic', marginBottom: '24px',
            }}>
              {book.publication_year && <span>First published {book.publication_year}</span>}
              {book.page_count && <span>{book.page_count} pages</span>}
            </div>

            <div style={{ ...cardStyle, flex: 1 }}>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '18px', fontWeight: '600',
                color: '#f0e0c0', marginTop: 0, marginBottom: '14px',
              }}>About this book</h2>
              {loadingSynopsis ? (
                <p style={{ color: 'rgba(212,175,100,0.6)', fontStyle: 'italic', fontSize: '14px', margin: 0 }}>
                  Generating description...
                </p>
              ) : synopsis ? (
                <p style={{
                  color: 'rgba(232,213,176,0.85)', lineHeight: '1.9',
                  fontSize: '14px', fontStyle: 'italic', margin: 0,
                }}>{synopsis}</p>
              ) : (
                <p style={{ color: 'rgba(212,175,100,0.5)', fontStyle: 'italic', fontSize: '14px', margin: 0 }}>
                  No description available.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div style={{ maxWidth: '860px' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '22px', fontWeight: '600',
            color: '#f0e0c0', marginTop: 0, marginBottom: '24px',
            textShadow: '0 1px 6px rgba(0,0,0,0.5)',
          }}>
            Reader Reviews
            <span style={{
              fontSize: '14px', fontWeight: '400',
              color: 'rgba(212,175,100,0.55)', marginLeft: '10px', fontStyle: 'italic',
            }}>
              {book.reviews?.length || 0} reviews
            </span>
          </h2>

          <div style={{ ...cardStyle, marginBottom: '24px' }}>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '16px', color: '#f0e0c0',
              marginTop: 0, marginBottom: '16px',
            }}>Write a Review</h3>

            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Share your thoughts about this book..."
              rows={4}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,250,240,0.06)',
                border: '1px solid rgba(212,175,100,0.2)',
                borderRadius: '6px', color: '#e8d5b0',
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '14px', lineHeight: '1.6',
                boxSizing: 'border-box', resize: 'vertical', outline: 'none',
              }}
            />

            {reviewSuccess && (
              <p style={{ color: '#90c878', fontSize: '13px', fontStyle: 'italic', margin: '8px 0 0' }}>
                {reviewSuccess}
              </p>
            )}

            <button
              onClick={submitReview}
              disabled={reviewSubmitting || !reviewText.trim()}
              style={{
                marginTop: '12px', padding: '10px 28px',
                background: reviewText.trim()
                  ? 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)'
                  : 'rgba(212,175,100,0.08)',
                border: '1px solid rgba(212,175,100,0.25)',
                borderRadius: '6px',
                color: reviewText.trim() ? '#fff8ee' : 'rgba(212,175,100,0.3)',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '13px', fontWeight: '600',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: reviewText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>

          {book.reviews?.length === 0 && (
            <p style={{ color: 'rgba(212,175,100,0.5)', fontStyle: 'italic', fontSize: '14px' }}>
              No reviews yet. Be the first to share your thoughts.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(book.reviews || []).map(review => (
              <div key={review.id} style={{ ...cardStyle, padding: '20px 28px' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: '8px', alignItems: 'center',
                }}>
                  <span style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '14px', fontWeight: '600', color: '#f0e0c0',
                  }}>{review.username}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(212,175,100,0.5)', fontStyle: 'italic' }}>
                    {new Date(review.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
                {review.user_rating && (
                  <div style={{ color: '#d4af37', fontSize: '14px', marginBottom: '8px', letterSpacing: '2px' }}>
                    {'★'.repeat(review.user_rating)}{'☆'.repeat(5 - review.user_rating)}
                  </div>
                )}
                <p style={{ margin: 0, color: 'rgba(232,213,176,0.8)', lineHeight: '1.7', fontSize: '14px' }}>
                  {review.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Similar Books */}
        {similarBooks.length > 0 && (
          <div style={{ maxWidth: '860px', marginTop: '48px' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '22px', fontWeight: '600',
              color: '#f0e0c0', marginTop: 0, marginBottom: '8px',
              textShadow: '0 1px 6px rgba(0,0,0,0.5)',
            }}>
              You Might Also Like
            </h2>
            <p style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '13px', color: 'rgba(212,175,100,0.45)',
              fontStyle: 'italic', margin: '0 0 24px 0',
            }}>
              Books that share the most genres with this one
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '16px',
            }}>
              {similarBooks.map(b => (
                <div
                  key={b.id}
                  onClick={() => navigate(`/books/${b.id}`)}
                  onMouseEnter={() => setHoverBookId(b.id)}
                  onMouseLeave={() => setHoverBookId(null)}
                  style={{
                    cursor: 'pointer',
                    transform: hoverBookId === b.id ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'transform 0.18s ease',
                  }}
                >
                  <div style={{
                    width: '100%', aspectRatio: '2/3',
                    borderRadius: '6px', overflow: 'hidden',
                    boxShadow: hoverBookId === b.id
                      ? '0 12px 32px rgba(0,0,0,0.6)'
                      : '0 4px 16px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(212,175,100,0.12)',
                    transition: 'box-shadow 0.18s ease',
                    marginBottom: '8px',
                  }}>
                    {hasGoodCover(b.cover_image_url) ? (
                      <img
                        src={b.cover_image_url}
                        alt={b.title}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          filter: 'sepia(8%) contrast(105%) brightness(95%)',
                        }}
                      />
                    ) : (
                      <DefaultBookCover
                        title={b.title}
                        author={(b.authors || []).join(', ')}
                        width="100%"
                        height="100%"
                      />
                    )}
                  </div>
                  <p style={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '12px', color: 'rgba(232,213,176,0.8)',
                    margin: '0 0 3px 0',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', lineHeight: '1.4',
                  }}>
                    {b.title}
                  </p>
                  {b.average_rating && (
                    <p style={{
                      fontFamily: "'Lora', Georgia, serif",
                      fontSize: '11px', color: 'rgba(212,175,100,0.45)',
                      margin: 0,
                    }}>
                      ★ {parseFloat(b.average_rating).toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}