import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import RecommendationRow from '../components/RecommendationRow';

export default function RecommendationsTestPage() {
  const { token } = useAuth();
  const [sqlRecs, setSqlRecs] = useState([]);
  const [geminiRecs, setGeminiRecs] = useState([]);
  const [sqlLoading, setSqlLoading] = useState(true);
  const [geminiLoading, setGeminiLoading] = useState(true);
  const [sqlError, setSqlError] = useState('');
  const [geminiError, setGeminiError] = useState('');

  useEffect(() => {
    apiCall('GET', '/recommendations/sql-v2', null, token)
      .then(data => setSqlRecs(data.recommendations))
      .catch(err => setSqlError(err.message))
      .finally(() => setSqlLoading(false));

    apiCall('GET', '/recommendations/gemini', null, token)
      .then(async data => {
        const results = await Promise.all(
          data.recommendations.map(async (r) => {
            try {
              const searchResults = await apiCall(
                'GET',
                `/books/search?query=${encodeURIComponent(r.title)}&limit=5`,
                null,
                token
              );

              const match = Array.isArray(searchResults)
                ? searchResults.find(b => {
                    const dbTitle = b.title.toLowerCase();
                    const geminiTitle = r.title.toLowerCase();
                    return (
                      dbTitle.includes(geminiTitle) ||
                      geminiTitle.includes(dbTitle) ||
                      dbTitle.startsWith(geminiTitle) ||
                      geminiTitle.split(':')[0].trim() === dbTitle.split(':')[0].trim()
                    );
                  }) || null
                : null;

              if (!match?.id) return null;

              return {
                id: match.id,
                title: r.title,
                authors: [r.author],
                reason: r.reason,
                cover_image_url: match.cover_image_url || null,
                average_rating: match.average_rating || null,
              };
            } catch (err) {
              console.error('Error processing', r.title, err);
              return null;
            }
          })
        );

        setGeminiRecs(results.filter(Boolean));
      })
      .catch(err => setSqlError(err.message))
      .finally(() => setGeminiLoading(false));
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url('/fundal_register.avif')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      fontFamily: "'Lora', Georgia, serif",
      paddingBottom: '60px',
      position: 'relative',
    }}>

      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 5, 2, 0.68)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        borderBottom: '1px solid rgba(212,175,100,0.12)',
        padding: '28px 48px 24px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: 'rgba(20, 12, 4, 0.25)',
      }}>
        <p style={{
          fontSize: '13px', color: 'rgba(212,175,100,0.6)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: 0, marginBottom: '8px',
        }}>Curated For You</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '36px', fontWeight: '700',
          color: '#f0e0c0', margin: 0,
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>Your Recommendations</h1>
        <p style={{
          margin: '10px 0 0',
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '14px', color: 'rgba(212,175,100,0.6)',
          fontStyle: 'italic',
        }}>Two approaches to finding your next favourite book.</p>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '40px 48px' }}>
        <RecommendationRow
          title="Quick Picks"
          subtitle="Instant recommendations based on your reading history"
          books={sqlRecs}
          loading={sqlLoading}
          error={sqlError}
        />

        <RecommendationRow
          title="Handpicked For You"
          subtitle="AI-curated picks with personalised explanations"
          books={geminiRecs}
          loading={geminiLoading}
          error={geminiError}
          geminiMode={true}
        />
      </div>
    </div>
  );
}