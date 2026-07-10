import { useState, useEffect, useCallback, useRef } from "react";

// ── Supabase config ──────────────────────────────────────────────
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

// ── helpers ──────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function pinRotation(id) {
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 1000;
  return ((hash % 50) / 10) - 2.5;
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

const NG_LOCATIONS = {
  "Abia (Umuahia)": [5.5262, 7.4860],
  "Adamawa (Yola)": [9.2035, 12.4954],
  "Akwa Ibom (Uyo)": [5.0377, 7.9128],
  "Anambra (Awka)": [6.2120, 7.0741],
  "Bauchi": [10.3103, 9.8437],
  "Bayelsa (Yenagoa)": [4.9247, 6.2642],
  "Benue (Makurdi)": [7.7322, 8.5391],
  "Borno (Maiduguri)": [11.8333, 13.1500],
  "Cross River (Calabar)": [4.9517, 8.3220],
  "Delta (Asaba)": [6.2059, 6.7317],
  "Ebonyi (Abakaliki)": [6.3249, 8.1137],
  "Edo (Benin City)": [6.3350, 5.6037],
  "Ekiti (Ado-Ekiti)": [7.6210, 5.2210],
  "Enugu": [6.5244, 7.5106],
  "Gombe": [10.2897, 11.1673],
  "Imo (Owerri)": [5.4840, 7.0351],
  "Jigawa (Dutse)": [11.7563, 9.3406],
  "Kaduna": [10.5222, 7.4383],
  "Kano": [12.0022, 8.5920],
  "Katsina": [12.9908, 7.6018],
  "Kebbi (Birnin Kebbi)": [12.4534, 4.1975],
  "Kogi (Lokoja)": [7.8023, 6.7333],
  "Kwara (Ilorin)": [8.4966, 4.5426],
  "Lagos": [6.5244, 3.3792],
  "Nasarawa (Lafia)": [8.4939, 8.5203],
  "Niger (Minna)": [9.6139, 6.5569],
  "Ogun (Abeokuta)": [7.1475, 3.3619],
  "Ondo (Akure)": [7.2571, 5.2058],
  "Osun (Osogbo)": [7.7719, 4.5560],
  "Oyo (Ibadan)": [7.3775, 3.9470],
  "Plateau (Jos)": [9.8965, 8.8583],
  "Rivers (Port Harcourt)": [4.8156, 7.0498],
  "Sokoto": [13.0059, 5.2476],
  "Taraba (Jalingo)": [8.8833, 11.3667],
  "Yobe (Damaturu)": [11.7470, 11.9608],
  "Zamfara (Gusau)": [12.1704, 6.6641],
  "FCT (Abuja)": [9.0765, 7.3986],
};
const LOCATIONS_LIST = Object.keys(NG_LOCATIONS);

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── styles ───────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --paper:#F7F5FF;
  --paper-dark:#EDE8FC;
  --ink:#150F26;
  --ink-soft:#5B5470;
  --red:#7C3AED;
  --red-d:#6425C9;
  --mustard:#06B6D4;
  --mustard-l:#CFFAFE;
  --sage:#10B981;
  --sage-l:#D1FAE5;
  --line:#E1D9FA;
  --shadow-pin: 0 3px 0 rgba(20,15,35,0.08), 0 8px 24px rgba(124,58,237,0.14);
}
body{
  font-family:'Archivo',sans-serif;
  background:var(--paper);
  color:var(--ink);
  min-height:100vh;
  background-image:
    radial-gradient(circle at 15% 20%, rgba(124,58,237,0.10) 0%, transparent 35%),
    radial-gradient(circle at 85% 15%, rgba(6,182,212,0.10) 0%, transparent 35%),
    radial-gradient(circle at 50% 90%, rgba(16,185,129,0.06) 0%, transparent 40%);
  background-attachment:fixed;
}

.lh-display{ font-family:'Archivo Black', sans-serif; }
.lh-mono{ font-family:'JetBrains Mono', monospace; }

@keyframes blobShift{
  0%,100%{ transform:translate(0,0) scale(1); }
  33%{ transform:translate(3%,-4%) scale(1.08); }
  66%{ transform:translate(-3%,3%) scale(0.95); }
}
@keyframes fadeSlideUp{
  from{ opacity:0; transform:translateY(22px); }
  to{ opacity:1; transform:translateY(0); }
}
.lh-reveal{ opacity:0; }
.lh-reveal.lh-revealed{ animation:fadeSlideUp .6s cubic-bezier(.22,1,.36,1) forwards; }

.lh-nav{
  position:sticky;top:0;z-index:200;
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 22px;
  background:var(--ink);
  border-bottom:4px solid transparent;
  border-image:linear-gradient(90deg,var(--red),var(--mustard),var(--sage)) 1;
}
.lh-logo{
  font-family:'Archivo Black', sans-serif;
  font-size:1.15rem;
  color:var(--paper);
  letter-spacing:-0.3px;
  text-transform:uppercase;
}
.lh-logo span{
  background:linear-gradient(90deg,var(--red),var(--mustard));
  -webkit-background-clip:text;background-clip:text;color:transparent;
}
.lh-badge{
  font-family:'JetBrains Mono', monospace;
  font-size:.7rem;
  background:var(--red);
  color:var(--paper);
  padding:5px 11px;
  border-radius:3px;
  font-weight:600;
  letter-spacing:.02em;
  box-shadow:0 0 0 0 rgba(124,58,237,0.5);
  animation:badgeGlow 2.4s ease-in-out infinite;
}
@keyframes badgeGlow{
  0%,100%{ box-shadow:0 0 0 0 rgba(124,58,237,0.35); }
  50%{ box-shadow:0 0 0 6px rgba(124,58,237,0); }
}

.lh-hero{
  background:var(--paper-dark);
  padding:46px 20px 38px;
  text-align:center;
  position:relative;
  overflow:hidden;
  border-bottom:1px dashed var(--line);
}
.lh-hero::before,.lh-hero::after{
  content:'';
  position:absolute;
  width:280px;height:280px;
  border-radius:50%;
  filter:blur(50px);
  z-index:0;
  animation:blobShift 9s ease-in-out infinite;
  pointer-events:none;
}
.lh-hero::before{ background:rgba(124,58,237,0.20); top:-100px; left:-60px; }
.lh-hero::after{ background:rgba(6,182,212,0.18); bottom:-120px; right:-60px; animation-delay:3s; }
.lh-hero > *{ position:relative; z-index:1; }
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
  background:linear-gradient(90deg,var(--red),var(--mustard));
  -webkit-background-clip:text;background-clip:text;color:transparent;
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
  box-shadow:3px 3px 0 var(--red);
  transition:box-shadow .25s;
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
  transition:transform .15s, background .3s, color .3s, box-shadow .3s;
}
.lh-tab.active{ background:linear-gradient(90deg,var(--red),var(--red-d)); color:var(--paper); border-color:var(--red); box-shadow:0 4px 14px rgba(124,58,237,0.35); }
.lh-tab:active{ transform:translateY(1px) scale(.98); }


.lh-main{max-width:880px;margin:0 auto;padding:30px 18px 80px;}

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

.lh-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-bottom:30px;border:2px solid var(--ink);border-radius:4px;overflow:hidden;}
.lh-stat{background:var(--paper);padding:16px 10px;text-align:center;border-right:2px solid var(--ink);}
.lh-stat:last-child{border-right:none;}
.lh-stat-num{font-family:'Archivo Black', sans-serif;font-size:1.5rem;color:var(--red);line-height:1;}
.lh-stat-label{font-family:'JetBrains Mono', monospace;font-size:.65rem;color:var(--ink-soft);margin-top:4px;text-transform:uppercase;letter-spacing:.04em;}

.lh-jobs{ display:grid; grid-template-columns:1fr; gap:26px; padding-top:6px; }
@media(min-width:560px){ .lh-jobs{ grid-template-columns:1fr 1fr; } }

.lh-card{
  background:#FFFDF8;
  border:1px solid var(--line);
  padding:20px 20px 18px;
  position:relative;
  box-shadow:var(--shadow-pin);
  transition:transform .12s ease-out, box-shadow .25s ease;
  will-change:transform;
  transform-style:preserve-3d;
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
.lh-card:hover{ box-shadow:0 14px 32px rgba(124,58,237,0.22), var(--shadow-pin); }
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
  cursor:pointer;transition:background .2s, transform .15s;
}
.lh-apply:hover{ background:linear-gradient(90deg,var(--red),var(--red-d)); transform:translateY(-1px); }

.lh-empty{text-align:center;padding:70px 24px;color:var(--ink-soft);}
.lh-empty-icon{font-size:2.6rem;margin-bottom:14px;}
.lh-empty h3{font-family:'Archivo Black',sans-serif;font-size:1.1rem;color:var(--ink);margin-bottom:6px;text-transform:uppercase;}
.lh-empty p{font-size:.85rem;}
.lh-empty-cta{display:inline-block;margin-top:18px;padding:11px 22px;background:var(--red);color:var(--paper);border:none;font-family:'Archivo',sans-serif;font-size:.85rem;font-weight:700;text-transform:uppercase;cursor:pointer;}

.lh-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:70px 24px;gap:14px;color:var(--ink-soft);}
.lh-spinner{width:34px;height:34px;border:3px solid var(--line);border-top-color:var(--red);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

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
  background:linear-gradient(90deg,var(--red),var(--red-d));color:var(--paper);border:none;
  font-family:'Archivo Black',sans-serif;font-size:.9rem;text-transform:uppercase;letter-spacing:.02em;
  cursor:pointer;transition:box-shadow .25s, transform .15s;box-shadow:3px 3px 0 var(--ink);
}
.lh-submit:hover{ box-shadow:0 6px 20px rgba(124,58,237,0.4), 3px 3px 0 var(--ink); transform:translateY(-1px); }
.lh-submit:disabled{opacity:.6;cursor:not-allowed;}

.lh-toast{
  position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);
  background:var(--ink);color:var(--paper);padding:13px 22px;
  font-family:'Archivo',sans-serif;font-size:.85rem;font-weight:700;
  display:flex;align-items:center;gap:9px;
  box-shadow:0 8px 24px rgba(124,58,237,.35);
  transition:transform .35s cubic-bezier(.34,1.56,.64,1);
  z-index:999;white-space:nowrap;pointer-events:none;
}
.lh-toast.show{transform:translateX(-50%) translateY(0);}
.lh-toast-check{color:var(--mustard);}

@keyframes overlayIn{ from{ opacity:0; } to{ opacity:1; } }
@keyframes modalIn{ from{ opacity:0; transform:translateY(18px) scale(.96); } to{ opacity:1; transform:translateY(0) scale(1); } }
.lh-overlay{position:fixed;inset:0;background:rgba(20,15,35,.55);backdrop-filter:blur(2px);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;animation:overlayIn .2s ease;}
.lh-modal{background:#FFFDF8;border:2px solid var(--ink);max-width:540px;width:100%;max-height:90vh;overflow-y:auto;padding:32px;box-shadow:0 20px 60px rgba(124,58,237,0.25),6px 6px 0 var(--red);animation:modalIn .3s cubic-bezier(.22,1,.36,1);}
.lh-modal-close{float:right;background:none;border:2px solid var(--ink);width:30px;height:30px;font-size:1.1rem;cursor:pointer;line-height:1;margin-top:-4px;transition:background .2s,color .2s,transform .2s;}
.lh-modal-close:hover{ background:var(--red); color:var(--paper); border-color:var(--red); transform:rotate(90deg); }
.lh-modal-title{font-family:'Archivo Black',sans-serif;font-size:1.3rem;text-transform:uppercase;margin-bottom:4px;}
.lh-modal-company{font-family:'JetBrains Mono',monospace;font-size:.85rem;color:var(--red);margin-bottom:14px;font-weight:600;}
.lh-modal-meta{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px;}
.lh-modal-salary{font-family:'JetBrains Mono',monospace;font-size:.85rem;color:var(--ink);margin-bottom:18px;font-weight:700;}
.lh-modal-desc{font-size:.9rem;color:var(--ink-soft);line-height:1.7;white-space:pre-wrap;}
.lh-modal-apply{display:block;width:100%;margin-top:24px;padding:14px;background:linear-gradient(90deg,var(--red),var(--red-d));color:var(--paper);border:none;font-family:'Archivo Black',sans-serif;font-size:.9rem;text-transform:uppercase;cursor:pointer;box-shadow:3px 3px 0 var(--ink);transition:box-shadow .25s, transform .15s;}
.lh-modal-apply:hover{ box-shadow:0 6px 20px rgba(124,58,237,0.4), 3px 3px 0 var(--ink); transform:translateY(-1px); }


@media(max-width:640px){
  .lh-form-grid{grid-template-columns:1fr;}
  .lh-form-grid .full{grid-column:1;}
  .lh-form-card{padding:22px 18px;}
  .lh-modal{padding:22px 18px;}
}
`;

// ── components ───────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
    </svg>
  );
}

function CountUp({ value, duration = 700 }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    let raf;
    const step = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(fromRef.current + (value - fromRef.current) * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <>{display}</>;
}

async function saveApplication(jobId, jobTitle, phone) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/applications`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ job_id: jobId, job_title: jobTitle, applicant_phone: phone }),
    });
  } catch (e) {
    console.error("Failed to save application", e);
  }
}

function ApplyModal({ job, onClose }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!/^\+?[0-9\s\-()]{7,}$/.test(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }
    await saveApplication(job.id, job.title, phone);
    window.open(waLink(job.email, job.title, job.company), "_blank");
    onClose();
  };

  return (
    <div className="lh-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lh-modal">
        <button className="lh-modal-close" onClick={onClose}>×</button>
        <div className="lh-modal-title">Apply to {job.title}</div>
        <p style={{margin:"10px 0",color:"var(--ink-soft)",fontSize:".85rem"}}>Enter your WhatsApp number so the employer can reach you.</p>
        <input className="lh-input" type="tel" placeholder="e.g. +234 801 234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {error && <div className="lh-error">{error}</div>}
        <button className="lh-modal-apply" onClick={handleApply}>Continue to WhatsApp</button>
      </div>
    </div>
  );
}

function waLink(phone, title, company) {
  const digits = (phone || "").replace(/[^0-9]/g, "");
  const msg = encodeURIComponent(`Hi, I'm interested in the ${title} position at ${company}`);
  return `https://wa.me/${digits}?text=${msg}`;
}

function JobCard({ job, onOpen, highlight, distanceKm }) {
  const isRecent = (new Date() - new Date(job.created_at)) < 24 * 60 * 60 * 1000;
  const rotation = pinRotation(job.id);
  const color = pinColor(job.id);
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -8, y: px * 8 });
  };
  const handleLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      ref={cardRef}
      className={`lh-card${highlight ? " lh-card-new" : ""}`}
      id={`jc-${job.id}`}
      style={{
        transform: `rotate(${rotation}deg) perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        "--pin-color": color,
      }}
      onClick={() => onOpen(job)}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="lh-card-title">{job.title}</div>
      <div className="lh-card-company">{job.company}</div>
      <div className="lh-tags">
        <span className="lh-tag lh-tag-type">{job.type}</span>
        <span className="lh-tag lh-tag-cat">{job.category}</span>
        {job.location && <span className="lh-tag lh-tag-type">📍 {job.location.split(" (")[0]}</span>}
        {isRecent && <span className="lh-tag lh-tag-new">New</span>}
        {typeof distanceKm === "number" && <span className="lh-tag lh-tag-new">{distanceKm < 1 ? "<1" : Math.round(distanceKm)} km away</span>}
      </div>
      <div className="lh-card-desc">{job.description}</div>
      <div className="lh-card-bottom">
        <div>
          <div className="lh-card-salary">{job.salary || "Pay unlisted"}</div>
          <div className="lh-card-date">{timeAgo(job.created_at)}</div>
        </div>
        <button className="lh-apply" onClick={(e) => {
          e.stopPropagation();
          onOpen(job, true);
        }}>Apply</button>
      </div>
    </div>
  );
}
function JobModal({ job, onClose, onApply }) {
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
          {job.location && <span className="lh-tag lh-tag-type">📍 {job.location.split(" (")[0]}</span>}
        </div>
        {job.salary && <div className="lh-modal-salary">{job.salary}</div>}
        <div className="lh-modal-desc">{job.description}</div>
        <button className="lh-modal-apply" onClick={() => {
          onClose();
          onApply(job);
        }}>Message on WhatsApp</button>
      </div>
    </div>
  );
}

function BrowsePanel({ jobs, loading, error, onSwitchToPost, onOpen, highlightId, onRefresh }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [type, setType] = useState("");
  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | loading | granted | denied | unsupported
  const [sortNearest, setSortNearest] = useState(false);

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("granted");
        setSortNearest(true);
      },
      () => {
        setGeoStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const withDistance = jobs.map((j) => {
    if (!userCoords || !j.location || !NG_LOCATIONS[j.location]) return { ...j, __dist: null };
    const [lat, lng] = NG_LOCATIONS[j.location];
    return { ...j, __dist: haversineKm(userCoords.lat, userCoords.lng, lat, lng) };
  });

  let filtered = withDistance.filter((j) => {
    const qL = q.toLowerCase();
    const mQ = !q || j.title.toLowerCase().includes(qL) || j.company.toLowerCase().includes(qL) || (j.description || "").toLowerCase().includes(qL);
    const mC = !cat || j.category === cat;
    const mT = !type || j.type === type;
    return mQ && mC && mT;
  });

  if (sortNearest && userCoords) {
    filtered = [...filtered].sort((a, b) => {
      if (a.__dist == null) return 1;
      if (b.__dist == null) return -1;
      return a.__dist - b.__dist;
    });
  }

  const fullTime = jobs.filter((j) => j.type === "Full-time").length;
  const partTime = jobs.filter((j) => j.type === "Part-time").length;

  return (
    <div>
      <div className="lh-stats">
        <div className="lh-stat"><div className="lh-stat-num"><CountUp value={jobs.length} /></div><div className="lh-stat-label">Listings</div></div>
        <div className="lh-stat"><div className="lh-stat-num"><CountUp value={fullTime} /></div><div className="lh-stat-label">Full-Time</div></div>
        <div className="lh-stat"><div className="lh-stat-num"><CountUp value={partTime} /></div><div className="lh-stat-label">Part-Time</div></div>
      </div>
      <div className="lh-search-bar">
        <div className="lh-search-wrap">
          <span className="lh-search-icon"><SearchIcon /></span>
          <input className="lh-input lh-search-input" placeholder="Search title, company, keyword…" value={q} onChange={(e) => setQ(e.target.value)} />
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
        <div style={{display:"flex",gap:"14px",alignItems:"center"}}>
          {geoStatus === "granted" ? (
            <button className="lh-refresh" onClick={() => setSortNearest((s) => !s)}>
              {sortNearest ? "✓ Sorted by distance" : "📍 Sort by distance"}
            </button>
          ) : (
            <button className="lh-refresh" onClick={handleNearMe} disabled={geoStatus === "loading"}>
              {geoStatus === "loading" ? "Locating…" : "📍 Near me"}
            </button>
          )}
          <button className="lh-refresh" onClick={onRefresh}>↻ Refresh</button>
        </div>
      </div>
      {geoStatus === "denied" && (
        <div className="lh-error" style={{marginBottom:"18px"}}>Location access was denied. Enable it in your browser settings to see distances.</div>
      )}
      {geoStatus === "unsupported" && (
        <div className="lh-error" style={{marginBottom:"18px"}}>Your browser doesn't support location services.</div>
      )}

      {loading ? (
        <div className="lh-loading"><div className="lh-spinner" /><p>Loading jobs…</p></div>
      ) : error ? (
        <div className="lh-empty"><div className="lh-empty-icon">⚠</div><h3>Couldn't load jobs</h3><p>{error}</p><button className="lh-empty-cta" onClick={onRefresh}>Try again</button></div>
      ) : filtered.length === 0 ? (
        <div className="lh-empty">
          <div className="lh-empty-icon">📌</div>
          <h3>{jobs.length === 0 ? "Board's empty" : "No matches"}</h3>
          <p>{jobs.length === 0 ? "Be the first to pin a job." : "Try clearing your filters."}</p>
          {jobs.length === 0 && <button className="lh-empty-cta" onClick={onSwitchToPost}>Post the first job</button>}
        </div>
      ) : (
        <div className="lh-jobs">
          {filtered.map((j) => <JobCard key={j.id} job={j} onOpen={onOpen} highlight={j.id === highlightId} distanceKm={j.__dist} />)}
        </div>
      )}
    </div>
  );
}

function PostPanel({ onPosted }) {
  const blank = { title:"", company:"", category:"", type:"", location:"", salary:"", email:"", description:"" };
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
    if (!form.location) return { msg: "Please select a location.", field: "location" };
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
        location: form.location,
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
          <div className="lh-field full">
            <label className="lh-label">Location <span>*</span></label>
            <select className={fieldClass("location")} style={{width:"100%"}} value={form.location} onChange={set("location")}>
              <option value="">Select state / city</option>
              {LOCATIONS_LIST.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="lh-form-section">
        <div className="lh-form-section-label">Pay & contact</div>
        <div className="lh-form-grid">
          <div className="lh-field">
            <label className="lh-label">Pay range <span style={{fontWeight:400,color:"var(--ink-soft)"}}>(optional)</span></label>
            <input className="lh-input" placeholder="e.g. $18–22/hr or $55k/yr" value={form.salary} onChange={set("salary")} />
          </div>
          <div className="lh-field">
            <label className="lh-label">WhatsApp number <span>*</span></label>
            <input className={fieldClass("email")} type="tel" placeholder="e.g. +234 801 234 5678" value={form.email} onChange={set("email")} />
            <span className="lh-hint">Make sure this number has WhatsApp active — applicants will message you there.</span>
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
      <button className="lh-submit" onClick={handleSubmit} disabled={loading}>
        {loading ? "Posting…" : "Pin this job →"}
      </button>
    </div>
  );
}

function AggregatedJobCard({ job }) {
  return (
    <div className="lh-card">
      <div className="lh-card-title">{job.title}</div>
      <div className="lh-card-company">{job.company || "Company not listed"}</div>
      <div className="lh-tags">
        {job.location && <span className="lh-tag lh-tag-type">{job.location}</span>}
        <span className="lh-tag lh-tag-cat">Aggregated</span>
      </div>
      <div className="lh-card-desc">{job.snippet}</div>
      <div className="lh-card-bottom">
        <div>
          <div className="lh-card-salary">{job.salary || "Pay unlisted"}</div>
          <div className="lh-card-date">{job.updated || ""}</div>
        </div>
        <a className="lh-apply" href={job.link} target="_blank" rel="noopener noreferrer">View & Apply</a>
      </div>
    </div>
  );
}

function AggregatedPanel() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/feed`)
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setJobs(data.jobs || []);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load outside listings right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="lh-loading"><div className="lh-spinner" /><p>Loading listings from around the web…</p></div>;
  if (error) return <div className="lh-empty"><div className="lh-empty-icon">⚠</div><h3>Couldn't load jobs</h3><p>{error}</p></div>;
  if (jobs.length === 0) return <div className="lh-empty"><div className="lh-empty-icon">📌</div><h3>No listings found</h3><p>Try again later.</p></div>;

  return (
    <div className="lh-jobs">
      {jobs.map((j, i) => <AggregatedJobCard key={j.id || i} job={j} />)}
    </div>
  );
}

// ── app ──────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("browse");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [highlightId, setHighlightId] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [modal, setModal] = useState(null);
  const [applyJob, setApplyJob] = useState(null);
  const isAdmin = window.location.search.includes("key=Nkurumwisdom4800marvelou$");

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
      {isAdmin && (
        <div style={{background:"#1A1611",color:"#FAF6EE",padding:"20px",fontFamily:"monospace"}}>
          <h2 style={{color:"#D4A017",marginBottom:"16px"}}>📊 Admin Dashboard</h2>
          <p>Total Jobs: <strong>{jobs.length}</strong></p>
          <p>Full-time: <strong>{jobs.filter(j=>j.type==="Full-time").length}</strong></p>
          <p>Part-time: <strong>{jobs.filter(j=>j.type==="Part-time").length}</strong></p>
          <p>Posted today: <strong>{jobs.filter(j=>new Date(j.created_at).toDateString()===new Date().toDateString()).length}</strong></p>
          <hr style={{margin:"16px 0",borderColor:"#4A433A"}}/>
          <h3 style={{color:"#D4A017",marginBottom:"10px"}}>Recent Listings</h3>
          {jobs.slice(0,5).map(j=><div key={j.id} style={{marginBottom:"8px",padding:"8px",background:"#2A2218"}}><strong>{j.title}</strong> — {j.company} ({j.type})</div>)}
        </div>
      )}

      <nav className="lh-nav">
        <div className="lh-logo">Local<span>Hire</span></div>
        <div className="lh-badge"><CountUp value={jobs.length} /> LIVE</div>
      </nav>
      <section className="lh-hero">
        <div className="lh-hero-eye">Community Job Board</div>
        <h1>Find work.<br /><em>Hire local.</em></h1>
        <p className="lh-hero-sub">A direct line between local employers and job seekers — no middlemen, no fees.</p>
        <div className="lh-counter">
          <span className="lh-live-dot" />
          <span><CountUp value={jobs.length} /> job{jobs.length !== 1 ? "s" : ""} posted nearby</span>
        </div>
        <div className="lh-tabs">
          <button className={`lh-tab${tab === "browse" ? " active" : ""}`} onClick={() => setTab("browse")}>Browse</button>
          <button className={`lh-tab${tab === "jooble" ? " active" : ""}`} onClick={() => setTab("jooble")}>More Jobs</button>
          <button className={`lh-tab${tab === "post" ? " active" : ""}`} onClick={() => setTab("post")}>Post a Job</button>
        </div>
      </section>
      <main className="lh-main">
        {tab === "browse" && <BrowsePanel jobs={jobs} loading={loading} error={error} onSwitchToPost={() => setTab("post")} onOpen={(job, apply) => apply ? setApplyJob(job) : setModal(job)} highlightId={highlightId} onRefresh={loadJobs} />}
        {tab === "jooble" && <AggregatedPanel />}
        {tab === "post" && <PostPanel onPosted={handlePosted} />}
      </main>
      <div className={`lh-toast${toast.show ? " show" : ""}`}>
        <span className="lh-toast-check">📌</span>
        <span>{toast.msg}</span>
      </div>
      {modal && <JobModal job={modal} onClose={() => setModal(null)} onApply={(j) => setApplyJob(j)} />}
      {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} />}
    </>
  );
}
