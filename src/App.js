import { useState, useEffect, useCallback } from "react";

// ── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://usdkknqyusgjqusvqarq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZGtrbnF5dXNnanF1c3ZxYXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0ODcyMTIsImV4cCI6MjA5NzA2MzIxMn0.UlbT0rIILkEJVfOXM_MpkrjoKLmwVznjzyv8iX3Mo8g";

const db = {
  async getJobs() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/jobs?select=*&order=created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) throw new Error("Failed to fetch jobs");
    return res.json();
  },
  async insertJob(job) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(job),
    });
    if (!res.ok) throw new Error("Failed to post job");
    const data = await res.json();
    return data[0];
  },
};

// ── helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const CATEGORIES = [
  "Retail & Sales","Food & Hospitality","Healthcare",
  "Trades & Labor","Admin & Office","Education","Technology","Other",
];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

// ── styles ────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --ink:#0F172A;--ink2:#475569;--ink3:#94A3B8;
  --teal:#0D9488;--teal-d:#0F766E;--teal-l:#F0FDFA;
  --amber-l:#FFFBEB;--green:#10B981;--green-l:#ECFDF5;
  --red:#DC2626;--red-l:#FEF2F2;
  --bg:#F8FAFC;--white:#FFFFFF;--border:#E2E8F0;
  --shadow:0 1px 3px rgba(0,0,0,.07);
  --shadow-md:0 4px 16px rgba(0,0,0,.08);
}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;}

.lh-nav{
  position:sticky;top:0;z-index:200;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 28px;height:58px;
  background:var(--white);border-bottom:1px solid var(--border);
  box-shadow:var(--shadow);
}
.lh-logo{font-size:1.25rem;font-weight:800;letter-spacing:-0.5px;color:var(--teal);}
.lh-logo span{color:var(--ink);}
.lh-badge{font-family:'DM Mono',monospace;font-size:.72rem;background:var(--teal-l);color:var(--teal-d);border:1px solid #99F6E4;padding:3px 10px;border-radius:100px;}

.lh-hero{
  background:var(--ink);padding:60px 24px 0;
  text-align:center;overflow:hidden;position:relative;
}
.lh-hero::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(13,148,136,.25) 0%,transparent 70%);
  pointer-events:none;
}
.lh-hero-eye{font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--teal);margin-bottom:18px;}
.lh-hero h1{font-size:clamp(2.2rem,5.5vw,3.4rem);font-weight:800;letter-spacing:-1.5px;line-height:1.08;color:var(--white);margin-bottom:18px;}
.lh-hero h1 em{font-style:normal;color:var(--teal);}
.lh-hero-sub{font-size:1rem;color:rgba(255,255,255,.6);max-width:420px;margin:0 auto 30px;line-height:1.65;}
.lh-counter{
  display:inline-flex;align-items:center;gap:10px;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);
  border-radius:100px;padding:9px 22px;
  font-size:.88rem;font-weight:600;color:rgba(255,255,255,.85);margin-bottom:36px;
}
.lh-live-dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 0 3px rgba(16,185,129,.3);animation:livepulse 2s infinite;}
@keyframes livepulse{0%,100%{box-shadow:0 0 0 3px rgba(16,185,129,.3);}50%{box-shadow:0 0 0 6px rgba(16,185,129,.08);}}

.lh-tabs{display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,.1);max-width:500px;margin:0 auto;position:relative;}
.lh-tab{flex:1;padding:13px 0;background:none;border:none;font-family:inherit;font-size:.88rem;font-weight:600;color:rgba(255,255,255,.45);cursor:pointer;border-bottom:2px solid transparent;transition:color .2s,border-color .2s;margin-bottom:-1px;}
.lh-tab.active{color:var(--teal);border-bottom-color:var(--teal);}
.lh-tab:not(.active):hover{color:rgba(255,255,255,.75);}

.lh-main{max-width:880px;margin:0 auto;padding:32px 20px 80px;}

.lh-search-bar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;}
.lh-search-wrap{flex:1;min-width:220px;position:relative;}
.lh-search-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--ink3);pointer-events:none;display:flex;align-items:center;}
.lh-input{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:9px;font-family:inherit;font-size:.88rem;color:var(--ink);background:var(--white);transition:border-color .15s,box-shadow .15s;outline:none;}
.lh-input:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(13,148,136,.12);}
.lh-search-input{padding-left:38px;}
.lh-select{padding:10px 14px;border:1px solid var(--border);border-radius:9px;font-family:inherit;font-size:.88rem;color:var(--ink);background:var(--white);cursor:pointer;outline:none;transition:border-color .15s,box-shadow .15s;}
.lh-select:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(13,148,136,.12);}

.lh-filter-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:8px;flex-wrap:wrap;}
.lh-results-count{font-size:.82rem;color:var(--ink2);}
.lh-results-count strong{color:var(--ink);font-weight:700;}

.lh-jobs{display:flex;flex-direction:column;gap:10px;}
.lh-card{background:var(--white);border:1px solid var(--border);border-radius:14px;padding:22px 24px;display:grid;grid-template-columns:1fr auto;gap:16px;align-items:start;transition:border-color .15s,box-shadow .15s,transform .15s;cursor:default;}
.lh-card:hover{border-color:var(--teal);box-shadow:var(--shadow-md);transform:translateY(-1px);}
.lh-card.lh-card-new{border-color:var(--teal);box-shadow:0 0 0 3px rgba(13,148,136,.12),var(--shadow-md);animation:cardIn .4s cubic-bezier(.34,1.56,.64,1);}
@keyframes cardIn{from{opacity:0;transform:translateY(-10px) scale(.98);}to{opacity:1;transform:translateY(0) scale(1);}}
.lh-card-title{font-size:1.05rem;font-weight:700;margin-bottom:4px;color:var(--ink);}
.lh-card-company{font-size:.85rem;font-weight:600;color:var(--teal);margin-bottom:12px;}
.lh-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}
.lh-tag{font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:100px;letter-spacing:.02em;}
.lh-tag-type{background:var(--teal-l);color:var(--teal-d);}
.lh-tag-cat{background:var(--amber-l);color:#92400E;}
.lh-tag-new{background:var(--green-l);color:#065F46;}
.lh-card-desc{font-size:.84rem;color:var(--ink2);line-height:1.65;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.lh-card-right{text-align:right;flex-shrink:0;}
.lh-card-salary{font-size:.9rem;font-weight:700;color:var(--ink);margin-bottom:3px;}
.lh-card-date{font-family:'DM Mono',monospace;font-size:.7rem;color:var(--ink3);margin-bottom:14px;}
.lh-apply{padding:8px 16px;background:var(--teal);color:#fff;border:none;border-radius:8px;font-family:inherit;font-size:.8rem;font-weight:700;cursor:pointer;transition:background .15s;}
.lh-apply:hover{background:var(--teal-d);}

.lh-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;}
.lh-stat{background:var(--white);border:1px solid var(--border);border-radius:12px;padding:18px 20px;}
.lh-stat-num{font-size:1.6rem;font-weight:800;letter-spacing:-1px;color:var(--teal);}
.lh-stat-label{font-size:.75rem;font-weight:600;color:var(--ink3);margin-top:2px;}

.lh-empty{text-align:center;padding:72px 24px;color:var(--ink3);}
.lh-empty-icon{font-size:2.8rem;margin-bottom:14px;}
.lh-empty h3{font-size:1rem;font-weight:700;color:var(--ink2);margin-bottom:6px;}
.lh-empty p{font-size:.85rem;}
.lh-empty-cta{display:inline-block;margin-top:20px;padding:10px 22px;background:var(--teal);color:#fff;border:none;border-radius:9px;font-family:inherit;font-size:.88rem;font-weight:700;cursor:pointer;transition:background .15s;}
.lh-empty-cta:hover{background:var(--teal-d);}

.lh-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:72px 24px;gap:16px;color:var(--ink3);}
.lh-spinner{width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--teal);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.lh-loading p{font-size:.88rem;font-weight:500;}

.lh-form-card{background:var(--white);border:1px solid var(--border);border-radius:16px;padding:36px 40px;box-shadow:var(--shadow);}
.lh-form-head{margin-bottom:28px;}
.lh-form-head h2{font-size:1.3rem;font-weight:800;letter-spacing:-.3px;margin-bottom:6px;}
.lh-form-head p{font-size:.85rem;color:var(--ink2);line-height:1.6;}
.lh-form-section{border-top:1px solid var(--border);padding-top:22px;margin-top:22px;}
.lh-form-section-label{font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);margin-bottom:16px;}
.lh-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.lh-form-grid .full{grid-column:1/-1;}
.lh-field{display:flex;flex-direction:column;gap:5px;}
.lh-label{font-size:.8rem;font-weight:600;color:var(--ink);}
.lh-label span{color:var(--red);}
textarea.lh-input{resize:vertical;min-height:110px;line-height:1.6;}
.lh-error{margin-top:16px;padding:11px 16px;background:var(--red-l);border:1px solid #FCA5A5;border-radius:9px;font-size:.84rem;color:var(--red);font-weight:600;}
.lh-submit{margin-top:24px;width:100%;padding:14px;background:var(--teal);color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:.95rem;font-weight:800;cursor:pointer;transition:background .15s,opacity .15s;}
.lh-submit:hover{background:var(--teal-d);}
.lh-submit:disabled{opacity:.6;cursor:not-allowed;}

.lh-toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--ink);color:#fff;padding:13px 24px;border-radius:12px;font-size:.88rem;font-weight:600;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,.22);transition:transform .35s cubic-bezier(.34,1.56,.64,1);z-index:999;white-space:nowrap;pointer-events:none;}
.lh-toast.show{transform:translateX(-50%) translateY(0);}
.lh-toast-check{color:var(--green);font-size:1.1rem;}

.lh-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s;}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
.lh-modal{background:var(--white);border-radius:18px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;padding:36px;box-shadow:0 24px 64px rgba(0,0,0,.18);animation:modalIn .25s cubic-bezier(.34,1.56,.64,1);}
@keyframes modalIn{from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);}}
.lh-modal-close{float:right;background:none;border:none;font-size:1.4rem;color:var(--ink3);cursor:pointer;line-height:1;margin-top:-4px;transition:color .15s;}
.lh-modal-close:hover{color:var(--ink);}
.lh-modal-title{font-size:1.4rem;font-weight:800;letter-spacing:-.5px;margin-bottom:4px;}
.lh-modal-company{font-size:.95rem;font-weight:600;color:var(--teal);margin-bottom:16px;}
.lh-modal-meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;}
.lh-modal-salary{font-family:'DM Mono',monospace;font-size:.85rem;color:var(--ink);margin-bottom:20px;}
.lh-modal-desc{font-size:.9rem;color:var(--ink2);line-height:1.75;white-space:pre-wrap;}
.lh-modal-apply{display:block;width:100%;margin-top:28px;padding:14px;background:var(--teal);color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:.95rem;font-weight:800;cursor:pointer;text-align:center;transition:background .15s;}
.lh-modal-apply:hover{background:var(--teal-d);}

@media(max-width:640px){
  .lh-form-grid{grid-template-columns:1fr;}
  .lh-form-grid .full{grid-column:1;}
  .lh-form-card{padding:24px 20px;}
  .lh-card{grid-template-columns:1fr;}
  .lh-card-right{text-align:left;}
  .lh-stats{grid-template-columns:1fr 1fr;}
  .lh-stats .lh-stat:last-child{grid-column:1/-1;}
  .lh-modal{padding:24px 20px;}
}
`;

// ── components ────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
    </svg>
  );
}

function JobCard({ job, onOpen, highlight }) {
  const isRecent = (new Date() - new Date(job.created_at)) < 24 * 60 * 60 * 1000;
  return (
    <div className={`lh-card${highlight ? " lh-card-new" : ""}`} id={`jc-${job.id}`} onClick={() => onOpen(job)}>
      <div>
        <div className="lh-card-title">{job.title}</div>
        <div className="lh-card-company">{job.company}</div>
        <div className="lh-tags">
          <span className="lh-tag lh-tag-type">{job.type}</span>
          <span className="lh-tag lh-tag-cat">{job.category}</span>
          {isRecent && <span className="lh-tag lh-tag-new">New</span>}
        </div>
        <div className="lh-card-desc">{job.description}</div>
      </div>
      <div className="lh-card-right">
        <div className="lh-card-salary">{job.salary || "Pay unlisted"}</div>
        <div className="lh-card-date">{timeAgo(job.created_at)}</div>
        <button className="lh-apply" onClick={(e) => {
          e.stopPropagation();
         window.open(`https://wa.me/${job.email.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi, I'm interested in the " + job.title + " position at " + job.company)}`, "_blank");
        }}>Apply →</button>
      </div>
    </div>
  );
}

function JobModal({ job, onClose }) {
  if (!job) return null;
  return (
    <div className="lh-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lh-modal">
        <button className="lh-modal-close" onClick={onClose}>×</button>
        <div className="lh-modal-title">{job.title}</div>
        <div className="lh-modal-company">{job.company}</div>
        <div className="lh-modal-meta">
          <span className="lh-tag lh-tag-type">{job.type}</span>
          <span className="lh-tag lh-tag-cat">{job.category}</span>
        </div>
        {job.salary && <div className="lh-modal-salary">💰 {job.salary}</div>}
        <div className="lh-modal-desc">{job.description}</div>
        <button className="lh-modal-apply" onClick={() => {
          window.open(`https://wa.me/${job.email.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi, I'm interested in the " + job.title + " position at " + job.company)}`, "_blank");
        }}>Apply for this role →</button>
      </div>
    </div>
  );
}

function BrowsePanel({ jobs, loading, error, onSwitchToPost, onOpen, highlightId, onRefresh }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [type, setType] = useState("");

  const filtered = jobs.filter((j) => {
    const qL = q.toLowerCase();
    const mQ = !q || j.title.toLowerCase().includes(qL) || j.company.toLowerCase().includes(qL) || (j.description || "").toLowerCase().includes(qL);
    const mC = !cat || j.category === cat;
    const mT = !type || j.type === type;
    return mQ && mC && mT;
  });

  const fullTime = jobs.filter((j) => j.type === "Full-time").length;
  const partTime = jobs.filter((j) => j.type === "Part-time").length;

  return (
    <div>
      <div className="lh-stats">
        <div className="lh-stat"><div className="lh-stat-num">{jobs.length}</div><div className="lh-stat-label">Active listings</div></div>
        <div className="lh-stat"><div className="lh-stat-num">{fullTime}</div><div className="lh-stat-label">Full-time roles</div></div>
        <div className="lh-stat"><div className="lh-stat-num">{partTime}</div><div className="lh-stat-label">Part-time roles</div></div>
      </div>

      <div className="lh-search-bar">
        <div className="lh-search-wrap">
          <span className="lh-search-icon"><SearchIcon /></span>
          <input className="lh-input lh-search-input" placeholder="Search by title, company, or keyword…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="lh-select" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="lh-select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="lh-filter-row">
        <div className="lh-results-count">
          {!loading && filtered.length > 0 && <>Showing <strong>{filtered.length}</strong> of <strong>{jobs.length}</strong> job{jobs.length !== 1 ? "s" : ""}</>}
        </div>
        <button onClick={onRefresh} style={{background:"none",border:"none",color:"var(--teal)",fontSize:".8rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>↻ Refresh</button>
      </div>

      {loading ? (
        <div className="lh-loading"><div className="lh-spinner" /><p>Loading jobs…</p></div>
      ) : error ? (
        <div className="lh-empty"><div className="lh-empty-icon">⚠️</div><h3>Couldn't load jobs</h3><p>{error}</p><button className="lh-empty-cta" onClick={onRefresh}>Try again</button></div>
      ) : filtered.length === 0 ? (
        <div className="lh-empty">
          <div className="lh-empty-icon">{jobs.length === 0 ? "📋" : "🔍"}</div>
          <h3>{jobs.length === 0 ? "No jobs yet" : "No matches found"}</h3>
          <p>{jobs.length === 0 ? "Be the first to post a job listing." : "Try clearing your filters."}</p>
          {jobs.length === 0 && <button className="lh-empty-cta" onClick={onSwitchToPost}>Post the first job</button>}
        </div>
      ) : (
        <div className="lh-jobs">
          {filtered.map((j) => <JobCard key={j.id} job={j} onOpen={onOpen} highlight={j.id === highlightId} />)}
        </div>
      )}
    </div>
  );
}

function PostPanel({ onPosted }) {
  const blank = { title:"", company:"", category:"", type:"", salary:"", email:"", description:"" };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (!form.title.trim()) return "Job title is required.";
    if (!form.company.trim()) return "Company name is required.";
    if (!form.category) return "Please select a category.";
    if (!form.type) return "Please select a job type.";
    if (!form.email.trim()) return "Contact email is required.";
    if (!/^\+?[0-9\s\-()]{7,}$/.test(form.email)) return "Please enter a valid phone number.";
    if (!form.description.trim()) return "Job description is required.";
    return "";
  };

  const submit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      const job = await db.insertJob({
        title: form.title.trim(),
        company: form.company.trim(),
        category: form.category,
        type: form.type,
        salary: form.salary.trim() || null,
        email: form.email.trim(),
        description: form.description.trim(),
        is_new: true,
      });
      setForm(blank);
      onPosted(job);
    } catch (e) {
      setError("Failed to post job. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lh-form-card">
      <div className="lh-form-head">
        <h2>Post a job listing</h2>
        <p>Your listing goes live immediately and is visible to all job seekers on this board.</p>
      </div>
      <div className="lh-form-section">
        <div className="lh-form-section-label">Role details</div>
        <div className="lh-form-grid">
          <div className="lh-field">
            <label className="lh-label">Job title <span>*</span></label>
            <input className="lh-input" placeholder="e.g. Barista, Electrician…" value={form.title} onChange={set("title")} />
          </div>
          <div className="lh-field">
            <label className="lh-label">Company name <span>*</span></label>
            <input className="lh-input" placeholder="Your business name" value={form.company} onChange={set("company")} />
          </div>
          <div className="lh-field">
            <label className="lh-label">Category <span>*</span></label>
            <select className="lh-select" style={{width:"100%"}} value={form.category} onChange={set("category")}>
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="lh-field">
            <label className="lh-label">Job type <span>*</span></label>
            <select className="lh-select" style={{width:"100%"}} value={form.type} onChange={set("type")}>
              <option value="">Select type</option>
              {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="lh-form-section">
        <div className="lh-form-section-label">Compensation & contact</div>
        <div className="lh-form-grid">
          <div className="lh-field">
            <label className="lh-label">Pay range <span style={{fontWeight:400,color:"var(--ink3)"}}>(optional)</span></label>
            <input className="lh-input" placeholder="e.g. $18–22/hr or $55k/yr" value={form.salary} onChange={set("salary")} />
          </div>
          <div className="lh-field"
  <div className="lh-field">
  <label className="lh-label">WhatsApp number <span>*</span></label>
  <input className="lh-input" type="tel" placeholder="e.g. +234 801 234 5678" value={form.email} onChange={set("email")} />
  <span className="lh-hint">Make sure this number has WhatsApp active — applicants will message you there.</span>
</div>
      <div className="lh-form-section">
        <div className="lh-form-section-label">Description</div>
        <div className="lh-field">
          <label className="lh-label">Tell candidates about the role <span>*</span></label>
          <textarea className="lh-input" placeholder="Describe responsibilities, requirements, and what makes this a great opportunity…" value={form.description} onChange={set("description")} />
        </div>
      </div>
      {error && <div className="lh-error">{error}</div>}
      <button className="lh-submit" onClick={submit} disabled={loading}>
        {loading ? "Posting…" : "Post this job →"}
      </button>
    </div>
  );
}

// ── app ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("browse");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [highlightId, setHighlightId] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [modal, setModal] = useState(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await db.getJobs();
      setJobs(data);
    } catch (e) {
      setError("Could not connect to the database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const showToast = useCallback((msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg }), 3500);
  }, []);

  const handlePosted = useCallback((job) => {
    setJobs((prev) => [job, ...prev]);
    setHighlightId(job.id);
    setTab("browse");
    showToast(`"${job.title}" is now live`);
    setTimeout(() => {
      const el = document.getElementById(`jc-${job.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    setTimeout(() => setHighlightId(null), 5000);
  }, [showToast]);

  return (
    <>
      <style>{css}</style>
      <nav className="lh-nav">
        <div className="lh-logo">Local<span>Hire</span></div>
        <div className="lh-badge">{jobs.length} live</div>
      </nav>
      <section className="lh-hero">
        <div className="lh-hero-eye">Community Job Board</div>
        <h1>Find work.<br /><em>Hire locally.</em></h1>
        <p className="lh-hero-sub">A direct line between local employers and job seekers — no middlemen, no fees.</p>
        <div className="lh-counter">
          <span className="lh-live-dot" />
          <span>{jobs.length} job{jobs.length !== 1 ? "s" : ""} posted in your area</span>
        </div>
        <div className="lh-tabs">
          <button className={`lh-tab${tab === "browse" ? " active" : ""}`} onClick={() => setTab("browse")}>Browse Jobs</button>
          <button className={`lh-tab${tab === "post" ? " active" : ""}`} onClick={() => setTab("post")}>Post a Job</button>
        </div>
      </section>
      <main className="lh-main">
        {tab === "browse"
          ? <BrowsePanel jobs={jobs} loading={loading} error={error} onSwitchToPost={() => setTab("post")} onOpen={setModal} highlightId={highlightId} onRefresh={loadJobs} />
          : <PostPanel onPosted={handlePosted} />}
      </main>
      <div className={`lh-toast${toast.show ? " show" : ""}`}>
        <span className="lh-toast-check">✓</span>
        <span>{toast.msg}</span>
      </div>
      {modal && <JobModal job={modal} onClose={() => setModal(null)} />}
    </>
  );
    }
