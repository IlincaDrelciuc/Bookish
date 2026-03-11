import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

export default function BookDetailPage() {
  const { id } = useParams();
  const { token, isLoggedIn } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addSuccess, setAddSuccess] = useState('');
  const [error, setError] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [loadingSynopsis, setLoadingSynopsis] = useState(false);

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
  }, [id]);

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
      setAddSuccess(`Added to your ${status} list!`);
      setTimeout(() => setAddSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitReview() {
    if (!reviewText.trim()) return;
    setReviewSubmitting(true);
    try {
      await apiCall('POST', '/reviews', {
        bookId: parseInt(id),
        body: reviewText,
        score: reviewScore,
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

  const avgRating = book.communityRating?.average || parseFloat(book.average_rating) || 0;
  const ratingCount = book.communityRating?.count || book.ratings_count || 0;

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

      {/* Page header */}
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

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, padding: '48px' }}>

        {/* Top section: left col + right col */}
        <div style={{
          display: 'flex',
          gap: '40px',
          marginBottom: '48px',
          alignItems: 'stretch',
          flexWrap: 'wrap',
        }}>

          {/* Left column — cover + buttons */}
          <div style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: '220px',
          }}>
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                style={{
                  width: '220px',
                  borderRadius: '8px',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                  border: '1px solid rgba(212,175,100,0.15)',
                  display: 'block',
                  filter: 'sepia(10%) contrast(105%) brightness(95%)',
                }}
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = `https://covers.openlibrary.org/b/id/${book.goodbooks_id}-L.jpg`;
                }}
              />
            ) : (
              <div style={{
                width: '220px', height: '320px',
                background: 'rgba(212,175,100,0.06)',
                borderRadius: '8px',
                border: '1px solid rgba(212,175,100,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '64px',
              }}>📖</div>
            )}

            {addSuccess && (
              <div style={{
                color: '#90c878', fontSize: '13px',
                fontStyle: 'italic', textAlign: 'center',
              }}>{addSuccess}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { status: 'to-read', label: '+ Want to Read' },
                { status: 'reading', label: '📖 Reading Now' },
                { status: 'finished', label: '✓ Already Read' },
              ].map(({ status, label }) => (
                <button
                  key={status}
                  onClick={() => addToList(status)}
                  style={{
                    padding: '10px 16px',
                    background: status === 'finished'
                      ? 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)'
                      : 'rgba(212,175,100,0.08)',
                    border: '1px solid rgba(212,175,100,0.25)',
                    borderRadius: '6px',
                    color: status === 'finished' ? '#fff8ee' : 'rgba(232,213,176,0.85)',
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '13px',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    transition: 'all 0.15s',
                    textAlign: 'center',
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = status === 'finished'
                      ? 'linear-gradient(135deg, #8b5f1a 0%, #5e3a0e 100%)'
                      : 'rgba(212,175,100,0.15)';
                    e.target.style.borderColor = 'rgba(212,175,100,0.5)';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = status === 'finished'
                      ? 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)'
                      : 'rgba(212,175,100,0.08)';
                    e.target.style.borderColor = 'rgba(212,175,100,0.25)';
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Right column — info + synopsis */}
          <div style={{
            flex: 1,
            minWidth: '280px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '36px', fontWeight: '700',
              color: '#f0e0c0', margin: '0 0 8px 0',
              lineHeight: 1.2,
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}>{book.title}</h1>

            <p style={{
              fontSize: '17px', color: 'rgba(212,175,100,0.8)',
              fontStyle: 'italic', margin: '0 0 20px 0',
            }}>
              by {(book.authors || []).map(a => a.name).join(', ')}
            </p>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '22px', color: '#d4af37', letterSpacing: '3px' }}>
                {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
              </span>
              <span style={{ fontSize: '22px', fontWeight: '600', color: '#f0e0c0', fontFamily: "'Playfair Display', Georgia, serif" }}>
                {avgRating.toFixed(2)}
              </span>
              <span style={{ fontSize: '13px', color: 'rgba(212,175,100,0.55)', fontStyle: 'italic' }}>
                {ratingCount.toLocaleString()} ratings
              </span>
            </div>

            {/* Genres */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              {(book.genres || []).map(g => (
                <span key={g.id} style={{
                  background: 'rgba(212,175,100,0.1)',
                  color: 'rgba(232,213,176,0.85)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  border: '1px solid rgba(212,175,100,0.2)',
                  fontFamily: "'Lora', Georgia, serif",
                  letterSpacing: '0.04em',
                }}>{g.name}</span>
              ))}
            </div>

            {/* Meta */}
            <div style={{
              display: 'flex', gap: '24px', flexWrap: 'wrap',
              fontSize: '13px', color: 'rgba(212,175,100,0.6)',
              fontStyle: 'italic', marginBottom: '24px',
            }}>
              {book.publication_year && <span>First published {book.publication_year}</span>}
              {book.page_count && <span>{book.page_count} pages</span>}
            </div>

            {/* Synopsis — flex: 1 so it fills remaining height */}
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

          {/* Write review */}
          <div style={{ ...cardStyle, marginBottom: '24px' }}>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '16px', color: '#f0e0c0',
              marginTop: 0, marginBottom: '16px',
            }}>Write a Review</h3>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setReviewScore(n)} style={{
                  fontSize: '24px', border: 'none', background: 'none',
                  cursor: 'pointer', padding: '0 2px',
                  color: n <= reviewScore ? '#d4af37' : 'rgba(212,175,100,0.2)',
                  transition: 'color 0.15s',
                }}>★</button>
              ))}
            </div>

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
                    {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
      </div>
    </div>
  );
}