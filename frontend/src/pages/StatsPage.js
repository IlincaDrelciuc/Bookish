import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLOURS = ['#8b6914', '#6b4f10', '#a07840', '#4a3010', '#c4a35a'];

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    apiCall('GET', '/stats', null, token)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f5ead6 0%, #ede0c4 50%, #e8d5b0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Lora', Georgia, serif",
      color: '#8b6530', fontStyle: 'italic',
    }}>
      Loading your stats...
    </div>
  );

  if (!stats) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f5ead6 0%, #ede0c4 50%, #e8d5b0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Lora', Georgia, serif",
      color: '#8b6530', fontStyle: 'italic',
    }}>
      No stats yet. Start reading!
    </div>
  );

  // Calculate derived stats from available data
  const booksThisMonth = stats.booksPerMonth.length > 0
    ? stats.booksPerMonth[stats.booksPerMonth.length - 1]?.count || 0
    : 0;
  const activeMonths = stats.booksPerMonth.length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f5ead6 0%, #ede0c4 50%, #e8d5b0 100%)',
      fontFamily: "'Lora', Georgia, serif",
      paddingBottom: '60px',
    }}>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(139,101,48,0.15)',
        padding: '40px 48px 32px',
      }}>
        <p style={{
          fontSize: '13px', color: '#8b6530',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: 0, marginBottom: '8px',
        }}>Your Journey</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '36px', fontWeight: '700',
          color: '#2c1a06', margin: 0,
        }}>Reading Stats</h1>
      </div>

      <div style={{ padding: '40px 48px' }}>

        {/* Summary cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}>
          {[
            { label: 'Books Read', value: stats.totalBooksRead },
            { label: 'Books This Month', value: booksThisMonth },
            { label: 'Active Months', value: activeMonths },
          ].map(card => (
            <div key={card.label} style={{
              background: 'rgba(255,250,240,0.7)',
              border: '1px solid rgba(139,101,48,0.2)',
              borderRadius: '3px',
              padding: '28px 24px',
              textAlign: 'center',
              boxShadow: '0 2px 12px rgba(139,101,48,0.06)',
            }}>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '36px', fontWeight: '700',
                color: '#2c1a06', marginBottom: '6px',
              }}>{card.value}</div>
              <div style={{
                fontFamily: "'Lora', Georgia, serif",
                color: '#8b6530', fontSize: '13px',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Books per month bar chart */}
        {stats.booksPerMonth.length > 0 && (
          <div style={{
            background: 'rgba(255,250,240,0.7)',
            border: '1px solid rgba(139,101,48,0.2)',
            borderRadius: '3px',
            padding: '28px',
            marginBottom: '24px',
            boxShadow: '0 2px 12px rgba(139,101,48,0.06)',
          }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '20px', fontWeight: '600',
              color: '#2c1a06', marginTop: 0, marginBottom: '24px',
            }}>Books Read This Year</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.booksPerMonth}>
                <XAxis
                  dataKey="month"
                  tick={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, fill: '#8b6530' }}
                  axisLine={{ stroke: 'rgba(139,101,48,0.2)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, fill: '#8b6530' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '13px',
                    background: 'rgba(255,250,240,0.97)',
                    border: '1px solid rgba(139,101,48,0.25)',
                    borderRadius: '2px',
                    color: '#2c1a06',
                  }}
                />
                <Bar dataKey="count" fill="#8b6914" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top genres pie chart */}
        {stats.topGenres.length > 0 && (
          <div style={{
            background: 'rgba(255,250,240,0.7)',
            border: '1px solid rgba(139,101,48,0.2)',
            borderRadius: '3px',
            padding: '28px',
            boxShadow: '0 2px 12px rgba(139,101,48,0.06)',
          }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '20px', fontWeight: '600',
              color: '#2c1a06', marginTop: 0, marginBottom: '24px',
            }}>Top Genres</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.topGenres}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name }) => name}
                  labelLine={{ stroke: 'rgba(139,101,48,0.4)' }}
                >
                  {stats.topGenres.map((_, i) => (
                    <Cell key={i} fill={COLOURS[i % COLOURS.length]} />
                  ))}
                </Pie>
                <Legend
                  wrapperStyle={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '13px',
                    color: '#6b4c1a',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '13px',
                    background: 'rgba(255,250,240,0.97)',
                    border: '1px solid rgba(139,101,48,0.25)',
                    borderRadius: '2px',
                    color: '#2c1a06',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {stats.totalBooksRead === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#a07840',
            fontStyle: 'italic',
            fontSize: '15px',
          }}>
            Mark some books as finished to see your statistics.
          </div>
        )}
      </div>
    </div>
  );
}