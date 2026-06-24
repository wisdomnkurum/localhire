import { useState, useEffect, useCallback } from "react";

// â”€â”€ Supabase config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// deterministic "random" rotation per card based on id, so it doesn't jitter on re-render
function pinRotation(id) {
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 1000;
  return ((hash % 50) / 10) - 2.5; // -2.5deg to +2.5deg
}
function pinColor(id) {
  const colors = ["#C8402C", "#D4A017", "#1A1611", "#7C8B6F"];
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 1000;
  return colors[hash % colors.length];
}

const CATEGORIES = [
  "Retail & Sales","Food & Hospitality","Healthcare",
  "Trades & Labor","Admin & Office","Education","Technology","Other",
];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

// â”€â”€ styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const css = `
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --paper:#FAF6EE;
  --paper-dark:#F0E9D8;
  --ink:#1A1611;
  --ink-soft:#4A433A;
  --red:#C8402C;
  --red-d:#A8341F;
  --mustard:#D4A017;
  --mustard-l:#FBF0D2;
  --sage:#7C8B6F;
  --sage-l:#EBEFE6;
  --line:#D8CFB8;
  --shadow-pin: 0 3px 0 rgba(26,22,17,0.08), 0 8px 16px rgba(26,22,17,0.12);
}
body{
  font-family:'Archivo',sans-serif;
  background:var(--paper);
  color:var(--ink);
  min-height:100vh;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(26,22,17,0.02) 0%, transparent 8%),
    radial-gradient(circle at 80% 70%, rgba(26,22,17,0.02) 0%, transparent 8%);
}

.lh-display{ font-family:'Archivo Black', sans-serif; }
.lh-mono{ font-family:'JetBrains Mono', monospace; }

/* NAV â€” like a shop sign */
.lh-nav{
  position:sticky;top:0;z-index:200;
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 22px;
  background:var(--ink);
  border-bottom:4px solid var(--red);
}
.lh-logo{
  font-family:'Archivo Black', sans-serif;
  font-size:1.15rem;
  color:var(--paper);
  letter-spacing:-0.3px;
  text-transform:uppercase;
}
.lh-logo span{ color:var(--mustard); }
.lh-badge{
  font-family:'JetBrains Mono', monospace;
  font-size:.7rem;
  background:var(--red);
  color:var(--paper);
  padding:5px 11px;
  border-radius:3px;
  font-weight:600;
  letter-spacing:.02em;
}

/* HERO â€” torn paper notice */
.lh-hero{
  background:var(--paper-dark);
  padding:46px 20px 38px;
  text-align:center;
  position:relative;
  border-bottom:1px dashed var(--line);
}
.lh-hero-eye{
  font-family:'JetBrains Mono', monospace;
  font-size:.72rem;
  font-weight:600;
  letter-spacing:.15em;
  text-transform:uppercase;
  color:var(--red);
  margin-bottom:14px;
  display:inline-block;
  border-top:2px solid var(--red);
  border-bottom:2px solid var(--red);
  padding:4px 0;
}
.lh-hero h1{
  font-family:'Archivo Black', sans-serif;
  font-size:clamp(2rem,7vw,3.1rem);
  line-height:1.05;
  letter-spacing:-1px;
  color:var(--ink);
  margin-bottom:14px;
  text-transform:uppercase;
}
.lh-hero h1 em{
  font-style:normal;
  color:var(--red);
  background:none;
  position:relative;
}
.lh-hero-sub{
  font-size:.98rem;
  color:var(--ink-soft);
  max-width:380px;
  margin:0 auto 26px;
  line-height:1.6;
}
.lh-counter{
  display:inline-flex;align-items:center;gap:9px;
  background:var(--paper);
  border:2px solid var(--ink);
  border-radius:100px;
  padding:8px 20px;
  font-family:'JetBrains Mono', monospace;
  font-size:.82rem;font-weight:600;color:var(--ink);
  margin-bottom:28px;
  box-shadow:3px 3px 0 var(--ink);
}
.lh-live-dot{width:7px;height:7px;border-radius:50%;background:var(--red);animation:pulse 1.6s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.35;}}

.lh-tabs{display:flex;gap:10px;max-width:420px;margin:0 auto;}
.lh-tab{
  flex:1;padding:11px 0;
  background:var(--paper);border:2px solid var(--ink);
  font-family:'Archivo', sans-serif;font-size:.85rem;font-weight:700;
  text-transform:uppercase;letter-spacing:.02em;
  color:var(--ink);cursor:pointer;
  transition:transform .12s, background .12s;
}
.lh-tab.active{ background:var(--ink); color:var(--paper); }
.lh-tab:active{ transform:translateY(1px); }

/* MAIN */
.lh-main{max-width:880px;margin:0 auto;padding:30px 18px 80px;}

/* SEARCH */
.lh-search-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;}
.lh-search-wrap{flex:1;min-width:200px;position:relative;}
.lh-search-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--ink-soft);pointer-events:none;display:flex;}
.lh-input{
  width:100%;padding:11px 14px;
  border:2px solid var(--ink);border-radius:4px;
  font-family:'Archivo', sans-serif;font-size:.88rem;color:var(--ink);background:var(--paper);
  outline:none;
}
.lh-input:focus{ box-shadow:3px 3px 0 var(--mustard); outline:3px solid var(--mustard); outline-offset:2px; }
.lh-input-error{ border-color:var(--red) !important; box-shadow:3px 3px 0 var(--red) !important; }
.lh-tab:focus-visible, .lh-apply:focus-visible, .lh-submit:focus-visible, .lh-select:focus-visible { outline:3px solid var(--mustard); outline-offset:2px; }
.lh-search-input{padding-left:38px;}
.lh-select{
  padding:11px 14px;border:2px solid var(--ink);border-radius:4px;
  font-family:'Archivo', sans-serif;font-size:.85rem;color:var(--ink);background:var(--paper);
  cursor:pointer;outline:none;
}

.lh-filter-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;gap:8px;flex-wrap:wrap;}
.lh-results-count{font-family:'JetBrains Mono', monospace;font-size:.78rem;color:var(--ink-soft);}
.lh-results-count strong{color:var(--ink);}
.lh-refresh{background:none;border:none;color:var(--red);font-size:.8rem;font-weight:700;cursor:pointer;font-family:'Archivo',sans-serif;text-transform:uppercase;letter-spacing:.02em;}

/* STATS â€” like stamped receipt */
.lh-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-bottom:30px;border:2px solid var(--ink);border-radius:4px;overflow:hidden;}
.lh-stat{background:var(--paper);padding:16px 10px;text-align:center;border-right:2px solid var(--ink);}
.lh-stat:last-child{border-right:none;}
.lh-stat-num{font-family:'Archivo Black', sans-serif;font-size:1.5rem;color:var(--red);line-height:1;}
.lh-stat-label{font-family:'JetBrains Mono', monospace;font-size:.65rem;color:var(--ink-soft);margin-top:4px;text-transform:uppercase;letter-spacing:.04em;}

/* PINBOARD GRID */
.lh-jobs{ display:grid; grid-template-columns:1fr; gap:26px; padding-top:6px; }
@media(min-width:560px){ .lh-jobs{ grid-template-columns:1fr 1fr; } }

.lh-card{
  background:#FFFDF8;
  border:1px solid var(--line);
  padding:20px 20px 18px;
  position:relative;
  box-shadow:var(--shadow-pin);
  transition:transform .18s ease;
}
.lh-card::before{
  content:'';
  position:absolute;
  top:-9px; left:50%;
  transform:translateX(-50%);
  width:16px;height:16px;
  border-radius:50%;
  background: var(--pin-color, var(--red));
  box-shadow: 0 2px 3px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.4);
  z-index:2;
}
.lh-card:hover{ transform:translateY(-3px) rotate(0deg) !important; }
.lh-card.lh-card-new{
  animation:pinIn .5s cubic-bezier(.34,1.56,.64,1);
}
@keyframes pinIn{
  from{ opacity:0; transform:translateY(-16px) scale(.9) !important; }
  to{ opacity:1; }
}

.lh-card-title{ font-family:'Archivo Black', sans-serif; font-size:1.05rem; color:var(--ink); margin-bottom:3px; line-height:1.2; }
.lh-card-company{ font-family:'JetBrains Mono', monospace; font-size:.78rem; color:var(--red); margin-bottom:12px; font-weight:600; }
.lh-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}
.lh-tag{ font-family:'Archivo',sans-serif; font-size:.68rem; font-weight:700; padding:3px 9px; text-transform:uppercase; letter-spacing:.03em; }
.lh-tag-type{ background:var(--sage-l); color:#3F4A36; border:1px solid var(--sage); }
.lh-tag-cat{ background:var(--mustard-l); color:#7A5A0C; border:1px solid var(--mustard); }
.lh-tag-new{ background:var(--red); color:var(--paper); border:1px solid var(--red); }
.lh-card-desc{ font-size:.85rem; color:var(--ink-soft); line-height:1.6; margin-bottom:14px; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }

.lh-card-bottom{ display:flex; align-items:center; justify-content:space-between; border-top:1px dashed var(--line); padding-top:12px; }
.lh-card-salary{ font-family:'JetBrains Mono', monospace; font-size:.85rem; font-weight:700; color:var(--ink); }
.lh-card-date{ font-family:'JetBrains Mono', monospace; font-size:.68rem; color:var(--ink-soft); }
.lh-apply{
  padding:8px 16px;background:var(--ink);color:var(--paper);
  border:none;font-family:'Archivo',sans-serif;font-size:.78rem;font-weight:700;
  text-transform:uppercase;letter-spacing:.02em;
  cursor:pointer;transition:background .15s;
}
.lh-apply:hover{ background:var(--red); }

/* EMPTY */
.lh-empty{text-align:center;padding:70px 24px;color:var(--ink-soft);}
.lh-empty-icon{font-size:2.6rem;margin-bottom:14px;}
.lh-empty h3{font-family:'Archivo Black',sans-serif;font-size:1.1rem;color:var(--ink);margin-bottom:6px;text-transform:uppercase;}
.lh-empty p{font-size:.85rem;}
.lh-empty-cta{display:inline-block;margin-top:18px;padding:11px 22px;background:var(--red);color:var(--paper);border:none;font-family:'Archivo',sans-serif;font-size:.85rem;font-weight:700;text-transform:uppercase;cursor:pointer;}

.lh-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:70px 24px;gap:14px;color:var(--ink-soft);}
.lh-spinner{width:34px;height:34px;border:3px solid var(--line);border-top-color:var(--red);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

/* FORM */
.lh-form-card{ background:#FFFDF8; border:2px solid var(--ink); padding:30px 26px; box-shadow:5px 5px 0 var(--mustard); }
.lh-form-head{margin-bottom:24px;}
.lh-form-head h2{font-family:'Archivo Black',sans-serif;font-size:1.25rem;text-transform:uppercase;margin-bottom:6px;}
.lh-form-head p{font-size:.85rem;color:var(--ink-soft);line-height:1.6;}
.lh-form-section{border-top:1px dashed var(--line);padding-top:20px;margin-top:20px;}
.lh-form-section-label{ font-family:'JetBrains Mono',monospace; font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--red);margin-bottom:14px;}
.lh-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.lh-form-grid .full{grid-column:1/-1;}
.lh-field{display:flex;flex-direction:column;gap:5px;}
.lh-label{font-size:.8rem;font-weight:700;color:var(--ink);}
.lh-label span{color:var(--red);}
.lh-hint{font-size:.72rem;color:var(--ink-soft);margin-top:2px;}
textarea.lh-input{resize:vertical;min-height:100px;line-height:1.6;}

.lh-error{margin-top:14px;padding:10px 14px;background:#FBE4DF;border:1px solid var(--red);font-size:.82rem;color:var(--red-d);font-weight:600;}
.lh-submit{
  margin-top:22px;width:100%;padding:14px;
  background:var(--red);color:var(--paper);border:none;
  font-family:'Archivo Black',sans-serif;font-size:.9rem;text-transform:uppercase;letter-spacing:.02em;
  cursor:pointer;transition:background .15s;box-shadow:3px 3px 0 var(--ink);
}
.lh-submit:hover{background:var(--red-d);}
.lh-submit:disabled{opacity:.6;cursor:not-allowed;}

/* TOAST */
.lh-toast{
  position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);
  background:var(--ink);color:var(--paper);padding:13px 22px;
  font-family:'Archivo',sans-serif;font-size:.85rem;font-weight:700;
  display:flex;align-items:center;gap:9px;
  box-shadow:0 8px 24px rgba(0,0,0,.3);
  transition:transform .35s cubic-bezier(.34,1.56,.64,1);
  z-index:999;white-space:nowrap;pointer-events:none;
}
.lh-toast.show{transform:translateX(-50%) translateY(0);}
.lh-toast-check{color:var(--mustard);}

/* MODAL */
.lh-overlay{position:fixed;inset:0;background:rgba(26,22,17,.6);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;}
.lh-modal{background:#FFFDF8;border:2px solid var(--ink);max-width:540px;width:100%;max-height:90vh;overflow-y:auto;padding:32px;box-shadow:6px 6px 0 var(--red);}
.lh-modal-close{float:right;background:none;border:2px solid var(--ink);width:30px;height:30px;font-size:1.1rem;cursor:pointer;line-height:1;margin-top:-4px;}
.lh-modal-title{font-family:'Archivo Black',sans-serif;font-size:1.3rem;text-transform:uppercase;margin-bottom:4px;}
.lh-modal-company{font-family:'JetBrains Mono',monospace;font-size:.85rem;color:var(--red);margin-bottom:14px;font-weight:600;}
 .lh-modal-meta{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px;}
.lh-modal-salary{font-family:'JetBrains Mono',monospace;font-size:.85rem;color:var(--ink);margin-bottom:18px;font-weight:700;}
.lh-modal-desc{font-size:.9rem;color:var(--ink-soft);line-height:1.7;white-space:pre-wrap;}
.lh-modal-apply{display:block;width:100%;margin-top:24px;padding:14px;background:var(--red);color:var(--paper);border:none;font-family:'Archivo Black',sans-serif;font-size:.9rem;text-transform:uppercase;cursor:pointer;box-shadow:3px 3px 0 var(--ink);}
.lh-modal-apply:hover{background:var(--red-d);}

@media(max-width:640px){
  .lh-form-grid{grid-template-columns:1fr;}
  .lh-form-grid .full{grid-column:1;}
  .lh-form-card{padding:22px 18px;}
  .lh-modal{padding:22px 18px;}
}
`;

// â”€â”€ components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
    </svg>
  );
}

function waLink(phone, title, company) {
  const digits = (phone || "").replace(/[^0-9]/g, "");
  const msg = encodeURIComponent(`Hi, I'm interested in the ${title} position at ${company}`);
  return `https://wa.me/${digits}?text=${msg}`;
}

function JobCard({ job, onOpen, highlight }) {
  const isRecent = (new Date() - new Date(job.created_at)) < 24 * 60 * 60 * 1000;
  const rotation = pinRotation(job.id);
  const color = pinColor(job.id);
  return (
    <div
      className={`lh-card${highlight ? " lh-card-new" : ""}`}
      id={`jc-${job.id}`}
      style={{ transform: `rotate(${rotation}deg)`, "--pin-color": color }}
      onClick={() => onOpen(job)}
    >
      <div className="lh-card-title">{job.title}</div>
      <div className="lh-card-company">{job.company}</div>
      <div className="lh-tags">
        <span className="lh-tag lh-tag-type">{job.type}</span>
        <span className="lh-tag lh-tag-cat">{job.category}</span>
        {isRecent && <span className="lh-tag lh-tag-new">New</span>}
      </div>
      <div className="lh-card-desc">{job.description}</div>
      <div className="lh-card-bottom">
        <div>
          <div className="lh-card-salary">{job.salary || "Pay unlisted"}</div>
          <div className="lh-card-date">{timeAgo(job.created_at)}</div>
        </div>
        <button className="lh-apply" onClick={(e) => {
          e.stopPropagation();
          window.open(waLink(job.email, job.title, job.company), "_blank");
        }}>Apply</button>
      </div>
    </div>
  );
}

function JobModal({ job, onClose }) {
  if (!job) return null;
  return (
    <div className="lh-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lh-modal">
        <button className="lh-modal-close" onClick={onClose}>Ã—</button>
        <div className="lh-modal-title">{job.title}</div>
        <div className="lh-modal-company">{job.company}</div>
        <div className="lh-modal-meta">
          <span className="lh-tag lh-tag-type">{job.type}</span>
          <span className="lh-tag lh-tag-cat">{job.category}</span>
        </div>
        {job.salary && <div className="lh-modal-salary">{job.salary}</div>}
        <div className="lh-modal-desc">{job.description}</div>
        <button className="lh-modal-apply" onClick={() => {
          window.open(waLink(job.email, job.title, job.company), "_blank");
        }}>Message on WhatsApp</button>
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
        <div className="lh-stat"><div className="lh-stat-num">{jobs.length}</div><div className="lh-stat-label">Listings</div></div>
        <div className="lh-stat"><div className="lh-stat-num">{fullTime}</div><div className="lh-stat-label">Full-Time</div></div>
        <div className="lh-stat"><div className="lh-stat-num">{partTime}</div><div className="lh-stat-label">Part-Time</div></div>
      </div>
      <div className="lh-search-bar">
        <div className="lh-search-wrap">
          <span className="lh-search-icon"><SearchIcon /></span>
          <input className="lh-input lh-search-input" placeholder="Search title, company, keywordâ€¦" value={q} onChange={(e) => setQ(e.target.value)} />
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
          {!loading && filtered.length > 0 && <>SHOWING <strong>{filtered.length}</strong> OF <strong>{jobs.length}</strong></>}
        </div>
        <button className="lh-refresh" onClick={onRefresh}>â†» Refresh</button>
      </div>

      {loading ? (
        <div className="lh-loading"><div className="lh-spinner" /><p>Loading jobsâ€¦</p></div>
      ) : error ? (
        <div className="lh-empty"><div className="lh-empty-icon">âš </div><h3>Couldn't load jobs</h3><p>{error}</p><button className="lh-empty-cta" onClick={onRefresh}>Try again</button></div>
      ) : filtered.length === 0 ? (
        <div className="lh-empty">
          <div className="lh-empty-icon">ðŸ“Œ</div>
          <h3>{jobs.length === 0 ? "Board's empty" : "No matches"}</h3>
          <p>{jobs.length === 0 ? "Be the first to pin a job." : "Try clearing your filters."}</p>
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
  const [errorField, setErrorField] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const fieldClass = (name) => `lh-input${errorField === name ? " lh-input-error" : ""}`;
  const validate = () => {
  if (!form.title.trim()) return { msg: "Job title is required.", field: "title" };
  if (!form.company.trim()) return { msg: "Company name is required.", field: "company" };
  if (!form.category) return { msg: "Please select a category.", field: "category" };
  if (!form.type) return { msg: "Please select a job type.", field: "type" };
  if (!form.email.trim()) return { msg: "WhatsApp number is required.", field: "email" };
  if (!/^\+?[0-9\s\-()]{7,}$/.test(form.email)) return { msg: "Please enter a valid phone number.", field: "email" };
  if (!form.description.trim()) return { msg: "Job description is required.", field: "description" };
  return null;
  };
  const handleSubmit = async () => {
    const err = validate();
     if (err) { setError(err.msg); setErrorField(err.field); return; }
     setError("");
     setErrorField("");
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
        <h2>Pin a job to the board</h2>
        <p>Your listing goes live immediately and is visible to everyone browsing.</p>
      </div>
      <div className="lh-form-section">
        <div className="lh-form-section-label">Role details</div>
        <div className="lh-form-grid">
          <div className="lh-field">
            <label className="lh-label">Job title <span>*</span></label>
            <input className={fieldClass("title")} placeholder="e.g. Barista, Electrician…" value={form.title} onChange={set("title")} />
          </div>
          <div className="lh-field">
            <label className="lh-label">Company name <span>*</span></label>
            <input className={fieldClass("company")} placeholder="Your business name" value={form.company} onChange={set("company")} />
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
            <select className={fieldClass("type")} style={{width:"100%"}} value={form.type} onChange={set("type")}>
              <option value="">Select type</option>
              {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="lh-form-section">
        <div className="lh-form-section-label">Pay & contact</div>
        <div className="lh-form-grid">
          <div className="lh-field">
            <label className="lh-label">Pay range <span style={{fontWeight:400,color:"var(--ink-soft)"}}>(optional)</span></label>
            <input className="lh-input" placeholder="e.g. $18â€“22/hr or $55k/yr" value={form.salary} onChange={set("salary")} />
          </div>
          <div className="lh-field">
            <label className="lh-label">WhatsApp number <span>*</span></label>
            <input className={fieldClass("email")} type="tel" placeholder="e.g. +234 801 234 5678" value={form.email} onChange={set("email")} />
            <span className="lh-hint">Make sure this number has WhatsApp active â€” applicants will message you there.</span>
          </div>
        </div>
      </div>
      <div className="lh-form-section">
        <div className="lh-form-section-label">Description</div>
        <div className="lh-field">
          <label className="lh-label">Tell candidates about the role <span>*</span></label>
          <textarea className={fieldClass("description")} placeholder="Describe responsibilities, requirements, and what makes this a great opportunity…" value={form.description} onChange={set("description")} />
        </div>
      </div>
      {error && <div className="lh-error">{error}</div>}
      <button className="lh-submit" onClick={submit} disabled={loading}>
        {loading ? "Postingâ€¦" : "Pin this job â†’"}
      </button>
    </div>
  );
}

// â”€â”€ app â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    showToast(`"${job.title}" is now pinned`);
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
        <div className="lh-badge">{jobs.length} LIVE</div>
      </nav>
      <section className="lh-hero">
        <div className="lh-hero-eye">Community Job Board</div>
        <h1>Find work.<br /><em>Hire local.</em></h1>
        <p className="lh-hero-sub">A direct line between local employers and job seekers â€” no middlemen, no fees.</p>
        <div className="lh-counter">
          <span className="lh-live-dot" />
          <span>{jobs.length} job{jobs.length !== 1 ? "s" : ""} posted nearby</span>
        </div>
        <div className="lh-tabs">
          <button className={`lh-tab${tab === "browse" ? " active" : ""}`} onClick={() => setTab("browse")}>Browse</button>
          <button className={`lh-tab${tab === "post" ? " active" : ""}`} onClick={() => setTab("post")}>Post a Job</button>
        </div>
      </section>
      <main className="lh-main">
        {tab === "browse"
          ? <BrowsePanel jobs={jobs} loading={loading} error={error} onSwitchToPost={() => setTab("post")} onOpen={setModal} highlightId={highlightId} onRefresh={loadJobs} />
          : <PostPanel onPosted={handlePosted} />}
      </main>
      <div className={`lh-toast${toast.show ? " show" : ""}`}>
        <span className="lh-toast-check">ðŸ“Œ</span>
        <span>{toast.msg}</span>
      </div>
      {modal && <JobModal job={modal} onClose={() => setModal(null)} />}
      </>
     );
  }