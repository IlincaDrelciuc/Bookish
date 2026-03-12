import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import DefaultBookCover from '../components/DefaultBookCover';

function hasGoodCover(url) {
  return url && (url.includes('books.google') || url.includes('openlibrary'));
}

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoverBookId, setHoverBookId] = useState(null);

  useEffect(() => {
    apiCall('GET', `/profile/${username}`)
      .then(setProfile)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [username]);

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
      color: 'rgba(212,175,100,0.7)', fontStyle: 'italic',
      position: 'relative',
    }}>
      {overlayBg}
      <span style={{ position: 'relative', zIndex: 1 }}>Loading profile...</span>
    </div>
  );

  if (error || !profile) return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url('/fundal_register.avif')`,
      backgroundSize: 'cover', backgroundAttachment: 'fixed',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Lora', Georgia, serif",
      color: '#e09090', position: 'relative',
    }}>
      {overlayBg}
      <span style={{ position: 'relative', zIndex: 1 }}>User not found.</span>
    </div>
  );

  const isOwnProfile = currentUser?.username === username;
  const initials = profile.user.username.slice(0, 2).toUpperCase();
  const memberSince = new Date(profile.user.memberSince).toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

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

      {/* Header bar */}
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
          letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0,
        }}>Reader Profile</p>
      </div>

      {/* Centered content wrapper */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: '860px',
        margin: '0 auto',
        padding: '48px 24px',
      }}>

        {/* ── Profile header ── */}
        <div style={{
          ...cardStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          marginBottom: '32px',
          padding: '40px 28px',
        }}>
          {/* Avatar */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)',
            border: '2px solid rgba(212,175,100,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '28px', fontWeight: '700', color: '#f0e0c0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            {initials}
          </div>

          <div>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '12px', marginBottom: '6px',
            }}>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '28px', fontWeight: '700',
                color: '#f0e0c0', margin: 0,
                textShadow: '0 2px 12px rgba(0,0,0,0.5)',
              }}>
                {profile.user.username}
              </h1>
              {isOwnProfile && (
                <span style={{
                  background: 'rgba(212,175,100,0.12)',
                  border: '1px solid rgba(212,175,100,0.25)',
                  color: 'rgba(212,175,100,0.7)',
                  padding: '3px 10px', borderRadius: '20px',
                  fontSize: '11px', letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontFamily: "'Lora', Georgia, serif",
                }}>
                  You
                </span>
              )}
            </div>
            <p style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '13px', color: 'rgba(212,175,100,0.5)',
              fontStyle: 'italic', margin: '0 0 14px 0',
            }}>
              Member since {memberSince}
            </p>

            {/* Favourite genres */}
            {profile.favouriteGenres.length > 0 && (
              <div style={{
                display: 'flex', flexWrap: 'wrap',
                gap: '6px', justifyContent: 'center',
              }}>
                {profile.favouriteGenres.map(g => (
                  <span key={g.name} style={{
                    background: 'rgba(212,175,100,0.08)',
                    border: '1px solid rgba(212,175,100,0.2)',
                    color: 'rgba(232,213,176,0.75)',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '11px', letterSpacing: '0.04em',
                    fontFamily: "'Lora', Georgia, serif",
                  }}>{g.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '14px',
          marginBottom: '40px',
        }}>
          {[
            { label: 'Books Read',    value: profile.stats.finished },
            { label: 'Reading Now',   value: profile.stats.reading },
            { label: 'Want to Read',  value: profile.stats.to_read },
            { label: 'Reviews',       value: profile.stats.reviewCount },
            { label: 'Ratings',       value: profile.stats.ratingCount },
          ].map(s => (
            <div key={s.label} style={{ ...cardStyle, textAlign: 'center', padding: '24px 12px' }}>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '32px', fontWeight: '700',
                color: '#d4af37', marginBottom: '6px',
              }}>{s.value}</div>
              <div style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '10px', color: 'rgba(212,175,100,0.5)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Currently reading ── */}
        {profile.currentlyReading.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '20px', fontWeight: '600',
              color: '#f0e0c0', margin: '0 0 6px 0',
            }}>
              {isOwnProfile ? 'Currently Reading' : `${profile.user.username} is Reading`}
            </h2>
            <p style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '13px', color: 'rgba(212,175,100,0.45)',
              fontStyle: 'italic', margin: '0 0 20px 0',
            }}>
              {profile.currentlyReading.length} book{profile.currentlyReading.length > 1 ? 's' : ''} in progress
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {profile.currentlyReading.map(book => {
                const progress = book.progress && book.page_count
                  ? Math.min(100, Math.round((book.progress / book.page_count) * 100))
                  : null;
                return (
                  <div
                    key={book.id}
                    onClick={() => navigate(`/books/${book.id}`)}
                    style={{
                      ...cardStyle,
                      display: 'flex', gap: '16px', alignItems: 'center',
                      cursor: 'pointer', padding: '16px 20px',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,175,100,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(212,175,100,0.12)'}
                  >
                    <div style={{
                      width: '48px', height: '72px', flexShrink: 0,
                      borderRadius: '4px', overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}>
                      {hasGoodCover(book.cover_image_url) ? (
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <DefaultBookCover title={book.title} author="" width="48px" height="72px" />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '15px', fontWeight: '600',
                        color: '#f0e0c0', margin: '0 0 10px 0',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{book.title}</p>

                      {progress !== null ? (
                        <div>
                          <div style={{
                            height: '5px', background: 'rgba(212,175,100,0.1)',
                            borderRadius: '3px', overflow: 'hidden', marginBottom: '5px',
                          }}>
                            <div style={{
                              height: '100%', width: `${progress}%`,
                              background: 'linear-gradient(90deg, #7a4f0d, #d4af37)',
                              borderRadius: '3px',
                            }} />
                          </div>
                          <p style={{
                            fontFamily: "'Lora', Georgia, serif",
                            fontSize: '11px', color: 'rgba(212,175,100,0.5)',
                            fontStyle: 'italic', margin: 0,
                          }}>
                            {book.progress} / {book.page_count} pages · {progress}%
                          </p>
                        </div>
                      ) : (
                        <p style={{
                          fontFamily: "'Lora', Georgia, serif",
                          fontSize: '11px', color: 'rgba(212,175,100,0.4)',
                          fontStyle: 'italic', margin: 0,
                        }}>In progress</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Recently finished ── */}
        {profile.recentlyFinished.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '20px', fontWeight: '600',
              color: '#f0e0c0', margin: '0 0 6px 0',
            }}>Recently Read</h2>
            <p style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '13px', color: 'rgba(212,175,100,0.45)',
              fontStyle: 'italic', margin: '0 0 20px 0',
            }}>
              The last books {isOwnProfile ? 'you' : profile.user.username} finished
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: '16px',
            }}>
              {profile.recentlyFinished.map(book => (
                <div
                  key={book.id}
                  onClick={() => navigate(`/books/${book.id}`)}
                  onMouseEnter={() => setHoverBookId(book.id)}
                  onMouseLeave={() => setHoverBookId(null)}
                  style={{
                    cursor: 'pointer',
                    transform: hoverBookId === book.id ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'transform 0.18s ease',
                  }}
                >
                  <div style={{
                    width: '100%', aspectRatio: '2/3',
                    borderRadius: '6px', overflow: 'hidden',
                    boxShadow: hoverBookId === book.id
                      ? '0 12px 32px rgba(0,0,0,0.6)'
                      : '0 4px 16px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(212,175,100,0.12)',
                    transition: 'box-shadow 0.18s ease',
                    marginBottom: '8px',
                  }}>
                    {hasGoodCover(book.cover_image_url) ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          filter: 'sepia(8%) contrast(105%) brightness(95%)',
                        }}
                      />
                    ) : (
                      <DefaultBookCover title={book.title} author="" width="100%" height="100%" />
                    )}
                  </div>
                  <p style={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '11px', color: 'rgba(232,213,176,0.7)',
                    margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', lineHeight: '1.4',
                  }}>{book.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent reviews ── */}
        {profile.recentReviews.length > 0 && (
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '20px', fontWeight: '600',
              color: '#f0e0c0', margin: '0 0 6px 0',
            }}>Recent Reviews</h2>
            <p style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '13px', color: 'rgba(212,175,100,0.45)',
              fontStyle: 'italic', margin: '0 0 20px 0',
            }}>
              What {isOwnProfile ? "you've" : profile.user.username + " has"} been saying
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {profile.recentReviews.map((review, i) => (
                <div key={i} style={{ ...cardStyle, padding: '20px 24px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: '10px',
                  }}>
                    <span
                      onClick={() => navigate(`/books/${review.book_id}`)}
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '15px', fontWeight: '600',
                        color: '#d4af37', cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f0e0c0'}
                      onMouseLeave={e => e.currentTarget.style.color = '#d4af37'}
                    >
                      {review.title}
                    </span>
                    <span style={{
                      fontFamily: "'Lora', Georgia, serif",
                      fontSize: '12px', color: 'rgba(212,175,100,0.4)',
                      fontStyle: 'italic', flexShrink: 0, marginLeft: '12px',
                    }}>
                      {new Date(review.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p style={{
                    margin: 0, color: 'rgba(232,213,176,0.8)',
                    lineHeight: '1.7', fontSize: '14px', fontStyle: 'italic',
                  }}>{review.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {profile.recentlyFinished.length === 0 &&
         profile.recentReviews.length === 0 &&
         profile.currentlyReading.length === 0 && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
            <p style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '15px', color: 'rgba(212,175,100,0.4)',
              fontStyle: 'italic', margin: 0,
            }}>
              {isOwnProfile
                ? "You haven't started any books yet. Start reading!"
                : `${profile.user.username} hasn't started any books yet.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}