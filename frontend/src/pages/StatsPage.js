import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLOURS = ['#2563EB','#0F766E','#7C3AED','#C2410C','#15803D'];

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

  if (loading) return <div style={{padding:'40px',textAlign:'center'}}>Loading stats...</div>;
  if (!stats) return <div style={{padding:'40px'}}>No stats yet. Start reading!</div>;

  return (
    <div style={{maxWidth:'900px',margin:'0 auto',padding:'32px 20px',fontFamily:'Arial,sans-serif'}}>
      <h1 style={{color:'#2563EB',marginBottom:'32px'}}>My Reading Stats</h1>

      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'20px',marginBottom:'40px'}}>
        {[
          {label:'Books Read',value:stats.totalBooksRead,emoji:'📚'},
          {label:'Pages Read',value:stats.totalPagesRead.toLocaleString(),emoji:'📄'},
          {label:'Favourite Genre',value:stats.topGenres[0]?.name||'N/A',emoji:'🏆'},
        ].map(card => (
          <div key={card.label} style={{backgroundColor:'white',padding:'24px',borderRadius:'12px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',textAlign:'center'}}>
            <div style={{fontSize:'36px',marginBottom:'8px'}}>{card.emoji}</div>
            <div style={{fontSize:'28px',fontWeight:'bold',color:'#1E293B'}}>{card.value}</div>
            <div style={{color:'#64748B',fontSize:'14px'}}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Books per month bar chart */}
      {stats.booksPerMonth.length > 0 && (
        <div style={{backgroundColor:'white',padding:'24px',borderRadius:'12px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',marginBottom:'24px'}}>
          <h2 style={{marginTop:0,color:'#1E293B'}}>Books Read This Year</h2>
          <ResponsiveContainer width='100%' height={250}>
            <BarChart data={stats.booksPerMonth}>
              <XAxis dataKey='month' />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey='count' fill='#2563EB' radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top genres pie chart */}
      {stats.topGenres.length > 0 && (
        <div style={{backgroundColor:'white',padding:'24px',borderRadius:'12px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <h2 style={{marginTop:0,color:'#1E293B'}}>Top Genres</h2>
          <ResponsiveContainer width='100%' height={280}>
            <PieChart>
              <Pie data={stats.topGenres} dataKey='count' nameKey='name' cx='50%' cy='50%' outerRadius={100} label>
                {stats.topGenres.map((_, i) => (
                  <Cell key={i} fill={COLOURS[i % COLOURS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.totalBooksRead === 0 && (
        <div style={{textAlign:'center',color:'#94A3B8',marginTop:'40px'}}>
          <p>Mark some books as finished to see your statistics!</p>
        </div>
      )}
    </div>
  );
}
