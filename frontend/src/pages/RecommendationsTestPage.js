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
        const enriched = await Promise.all(
          data.recommendations.map(async (r, i) => {
            try {
              const searchResults = await apiCall(
                'GET',
                `/books/search?q=${encodeURIComponent(r.title)}&limit=5`,
                null,
                token
              );

              const match = Array.isArray(searchResults)
                ? searchResults.find(b =>
                    b.title.toLowerCase().includes(r.title.toLowerCase()) ||
                    r.title.toLowerCase().includes(b.title.toLowerCase())
                  ) || null
                : null;

              return {
                id: match?.id || `gemini-${i}`,
                title: r.title,
                authors: [r.author],
                reason: r.reason,
                cover_image_url: match?.cover_image_url || null,
                average_rating: match?.average_rating || null,
              };
            } catch {
              return {
                id: `gemini-${i}`,
                title: r.title,
                authors: [r.author],
                reason: r.reason,
                cover_image_url: null,
                average_rating: null,
              };
            }
          })
        );
        setGeminiRecs(enriched);
      })
      .catch(err => setGeminiError(err.message))
      .finally(() => setGeminiLoading(false));
  }, [token]);

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
          fontSize: '13px', color: '#8b6530',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: 0, marginBottom: '8px',
        }}>Curated For You</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '36px', fontWeight: '700',
          color: '#2c1a06', margin: 0,
        }}>Your Recommendations</h1>
        <p style={{
          margin: '10px 0 0',
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '14px', color: '#a07840',
          fontStyle: 'italic',
        }}>Two approaches to finding your next favourite book.</p>
      </div>

      <div style={{ padding: '40px 48px' }}>
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