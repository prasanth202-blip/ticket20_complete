import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ratingAPI } from '../../api';
import { Spinner, EmptyState, StarDisplay, Pagination, StatCard } from '../../components/shared';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Star, TrendingUp, ThumbsUp } from 'lucide-react';

export default function CompanyRatings() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const slug = companySlug || user?.company?.slug;

  const [ratings, setRatings]       = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [avgScore, setAvgScore]     = useState(0);

  useEffect(() => {
    setLoading(true);
    ratingAPI.getCompanyRatings(slug, { page, limit:20 })
      .then(r => {
        const data = r.data.data;
        setRatings(data);
        setPagination(r.data.pagination);
        if (data.length > 0) {
          const avg = data.reduce((s, r) => s + r.score, 0) / data.length;
          setAvgScore(avg.toFixed(1));
        }
      })
      .finally(() => setLoading(false));
  }, [slug, page]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Ratings & Feedback</h1><p>Customer satisfaction scores from resolved tickets</p></div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom:24 }}>
        <StatCard label="Average Rating" value={avgScore > 0 ? `${avgScore} ★` : '—'} icon={<Star size={18}/>} color="#f59e0b"/>
        <StatCard label="Total Ratings" value={pagination.total || ratings.length} icon={<ThumbsUp size={18}/>} color="#3b82f6"/>
        <StatCard label="5 Star Reviews" value={ratings.filter(r => r.score === 5).length} icon={<TrendingUp size={18}/>} color="#10b981"/>
      </div>

      {ratings.length > 0 && (
        <div className="card" style={{ marginBottom:24, padding:20, display:'flex', alignItems:'center', gap:24 }}>
          <div>
            <div style={{ fontSize:56, fontFamily:'var(--font-h)', fontWeight:800, color:'#f59e0b' }}>{avgScore}</div>
            <StarDisplay score={Math.round(avgScore)} size={24}/>
            <div style={{ fontSize:14, color:'var(--muted)', marginTop:6 }}>
              Based on {pagination.total || ratings.length} reviews
            </div>
          </div>
          <div style={{ flex:1 }}>
            {[5,4,3,2,1].map(s => {
              const count = ratings.filter(r => r.score === s).length;
              const pct   = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
              return (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                  <span style={{ fontSize:13, width:24, fontWeight:600, color:'var(--text)' }}>{s}★</span>
                  <div style={{ flex:1, height:8, background:'var(--surface2)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:s>=4?'#10b981':s===3?'#f59e0b':'#ef4444', borderRadius:4, transition:'width 0.5s ease' }}/>
                  </div>
                  <span style={{ fontSize:13, color:'var(--muted)', width:30, textAlign:'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:20, borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:16, color:'var(--text)' }}>Recent Ratings</h3>
        </div>
        {loading ? <div className="loading-overlay" style={{ minHeight:200 }}><Spinner/></div> : ratings.length===0 ? (
          <EmptyState
            icon={<Star size={44}/>}
            title="No ratings yet"
            description="Ratings will appear here after customers rate resolved tickets."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Ticket #</th><th>Customer</th><th>Agent</th><th>Rating</th><th>Feedback</th><th>Date</th></tr>
              </thead>
              <tbody>
                {ratings.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontSize:13, fontWeight:700, color:'var(--primary)' }}>{r.ticket?.ticketNumber}</td>
                    <td style={{ fontSize:13, color:'var(--text)' }}>{r.ratedBy?.name}</td>
                    <td style={{ fontSize:13, color:'var(--text)' }}>{r.agent?.name || '—'}</td>
                    <td><StarDisplay score={r.score}/></td>
                    <td style={{ fontSize:13, color:'var(--muted)', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {r.feedback || <span style={{ opacity:0.5 }}>No feedback</span>}
                    </td>
                    <td style={{ fontSize:12, color:'var(--muted)' }}>
                      {formatDistanceToNow(new Date(r.createdAt), { addSuffix:true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination pagination={pagination} onPageChange={setPage}/>
    </div>
  );
}
