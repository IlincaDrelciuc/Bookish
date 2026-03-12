import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Sector
} from 'recharts';

const COLOURS = [
  '#c4965a', // warm amber
  '#8b7355', // antique brown
  '#a0836a', // dusty rose-brown
  '#7a8c6e', // muted sage
  '#6b7a8d', // slate blue-grey
];

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGenreIndex, setActiveGenreIndex] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    apiCall('GET', '/stats', null, token)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const overlayBg = (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(8,5,2,0.72)',
      zIndex: 0, pointerEvents: 'none',
    }} />
  );

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
      <span style={{ position: 'relative', zIndex: 1 }}>Loading your stats...</span>
    </div>
  );

  if (!stats) return (
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
      <span style={{ position: 'relative', zIndex: 1 }}>No stats yet. Start reading!</span>
    </div>
  );

  const booksThisMonth = stats.booksPerMonth.length > 0
    ? stats.booksPerMonth[stats.booksPerMonth.length - 1]?.count || 0
    : 0;
  const activeMonths = stats.booksPerMonth.length;

  const cardStyle = {
    background: 'rgba(20,12,4,0.55)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(212,175,100,0.12)',
    borderRadius: '10px',
    padding: '28px',
  };

  const totalGenreCount = stats.topGenres.reduce((sum, g) => sum + g.count, 0);

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    return (
      <g>
        <Sector
          cx={cx} cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <text
          x={cx} y={cy - 10}
          textAnchor="middle"
          fill="#f0e0c0"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize={13}
          fontWeight={600}
        >
          {payload.name}
        </text>
        <text
          x={cx} y={cy + 10}
          textAnchor="middle"
          fill="rgba(212,175,100,0.7)"
          fontFamily="'Lora', Georgia, serif"
          fontSize={12}
        >
          {Math.round((payload.count / totalGenreCount) * 100)}%
        </text>
      </g>
    );
  };

  // Use a single warm amber for the bar chart — vintage ink feel
  const barColor = '#b8905a';

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
      {overlayBg}

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
        }}>Your Journey</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '36px', fontWeight: '700',
          color: '#f0e0c0', margin: 0,
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>Reading Stats</h1>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '40px 48px' }}>

        {/* Summary cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}>
          {[
            { label: 'Books Read', value: stats.totalBooksRead, icon: '✓' },
            { label: 'Pages Read', value: stats.totalPagesRead?.toLocaleString() || 0, icon: '📄' },
            { label: 'Books This Month', value: booksThisMonth, icon: '📅' },
            { label: 'Active Months', value: activeMonths, icon: '📆' },
          ].map(card => (
            <div key={card.label} style={{
              ...cardStyle,
              textAlign: 'center',
              padding: '28px 24px',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{card.icon}</div>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '36px', fontWeight: '700',
                color: '#d4af37', marginBottom: '6px',
              }}>{card.value}</div>
              <div style={{
                fontFamily: "'Lora', Georgia, serif",
                color: 'rgba(212,175,100,0.55)', fontSize: '12px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Books per month bar chart */}
        {stats.booksPerMonth.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: '24px' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '20px', fontWeight: '600',
              color: '#f0e0c0', marginTop: 0, marginBottom: '24px',
            }}>Books Read This Year</h2>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={stats.booksPerMonth}
                barSize={200}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, fill: 'rgba(212,175,100,0.6)' }}
                  axisLine={{ stroke: 'rgba(212,175,100,0.15)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, fill: 'rgba(212,175,100,0.5)' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '13px',
                    background: 'rgba(20,12,4,0.92)',
                    border: '1px solid rgba(212,175,100,0.2)',
                    borderRadius: '6px',
                    color: '#f0e0c0',
                  }}
                  cursor={{ fill: 'rgba(212,175,100,0.05)' }}
                  formatter={(value) => [`${value} books`, 'Read']}
                />
                <Bar dataKey="count" fill={barColor} radius={[6, 6, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top genres — pie left, bars right */}
        {stats.topGenres.length > 0 && (
          <div style={{ ...cardStyle }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '20px', fontWeight: '600',
              color: '#f0e0c0', marginTop: 0, marginBottom: '24px',
            }}>Top Genres</h2>

            <div style={{ display: 'flex', gap: '48px', alignItems: 'center', flexWrap: 'wrap' }}>

              {/* Pie chart */}
              <div style={{ flexShrink: 0 }}>
                <PieChart width={300} height={300}>
                  <Pie
                    data={stats.topGenres}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    activeIndex={activeGenreIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => setActiveGenreIndex(index)}
                    onMouseLeave={() => setActiveGenreIndex(null)}
                  >
                    {stats.topGenres.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLOURS[i % COLOURS.length]}
                        stroke="rgba(20,12,4,0.5)"
                        strokeWidth={2}
                        style={{ cursor: 'pointer', outline: 'none' }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </div>

              {/* Genre bars */}
              <div style={{
                flex: 1, minWidth: '220px',
                display: 'flex', flexDirection: 'column', gap: '18px',
              }}>
                {stats.topGenres.map((genre, i) => {
                  const pct = Math.round((genre.count / totalGenreCount) * 100);
                  const isActive = activeGenreIndex === i;
                  return (
                    <div
                      key={genre.name}
                      onMouseEnter={() => setActiveGenreIndex(i)}
                      onMouseLeave={() => setActiveGenreIndex(null)}
                      style={{ cursor: 'default' }}
                    >
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'baseline', marginBottom: '7px',
                      }}>
                        <span style={{
                          fontFamily: "'Lora', Georgia, serif",
                          fontSize: '13px',
                          color: isActive ? '#f0e0c0' : 'rgba(212,175,100,0.65)',
                          transition: 'color 0.15s',
                          display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                          <span style={{
                            width: '10px', height: '10px',
                            borderRadius: '50%',
                            background: COLOURS[i % COLOURS.length],
                            display: 'inline-block', flexShrink: 0,
                          }} />
                          {genre.name}
                        </span>
                        <span style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: '13px',
                          color: isActive ? '#d4af37' : 'rgba(212,175,100,0.4)',
                          transition: 'color 0.15s',
                        }}>
                          {pct}% · {genre.count} {genre.count === 1 ? 'book' : 'books'}
                        </span>
                      </div>
                      <div style={{
                        height: '7px',
                        background: 'rgba(212,175,100,0.08)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: COLOURS[i % COLOURS.length],
                          borderRadius: '4px',
                          opacity: isActive ? 1 : 0.55,
                          transition: 'width 0.6s ease, opacity 0.15s',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {stats.totalBooksRead === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: 'rgba(212,175,100,0.4)',
            fontStyle: 'italic', fontSize: '15px',
          }}>
            Mark some books as finished to see your statistics.
          </div>
        )}
      </div>
    </div>
  );
}