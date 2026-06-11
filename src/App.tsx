import { useState, useEffect, useCallback } from "react";

// ── Puntuación ────────────────────────────────────────────────────
function calcPuntos(pron, partido) {
  if (!pron || partido.estado !== "finalizado") return 0;
  let pts = 0;
  const rl = partido.goles_local, rv = partido.goles_visita;
  const res = rl > rv ? "local" : rl < rv ? "visita" : "empate";
  if (pron.res_simple === res) pts += 1;
  if (pron.goles_local !== "" && pron.goles_visita !== "" &&
      Number(pron.goles_local) === rl && Number(pron.goles_visita) === rv) pts += 3;
  if (partido.penales && partido.gana_penales) {
    if (pron.empate90 && res === "empate") pts += 1;
    if (pron.gana_penales === partido.gana_penales) pts += 3;
  }
  return pts;
}

const FLAGS = {
  // Grupo A
  "México":"🇲🇽","Sudáfrica":"🇿🇦","Corea del Sur":"🇰🇷","Chequia":"🇨🇿",
  // Grupo B
  "Canadá":"🇨🇦","Bosnia":"🇧🇦","Qatar":"🇶🇦","Suiza":"🇨🇭",
  // Grupo C
  "Brasil":"🇧🇷","Marruecos":"🇲🇦","Haití":"🇭🇹","Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  // Grupo D
  "USA":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turquía":"🇹🇷",
  // Grupo E
  "Alemania":"🇩🇪","Curazao":"🇨🇼","Costa de Marfil":"🇨🇮","Ecuador":"🇪🇨",
  // Grupo F
  "Países Bajos":"🇳🇱","Japón":"🇯🇵","Suecia":"🇸🇪","Túnez":"🇹🇳",
  // Grupo G
  "Bélgica":"🇧🇪","Egipto":"🇪🇬","Irán":"🇮🇷","Nueva Zelanda":"🇳🇿",
  // Grupo H
  "España":"🇪🇸","Cabo Verde":"🇨🇻","Arabia Saudita":"🇸🇦","Uruguay":"🇺🇾",
  // Grupo I
  "Francia":"🇫🇷","Senegal":"🇸🇳","Irak":"🇮🇶","Noruega":"🇳🇴",
  // Grupo J
  "Argentina":"🇦🇷","Argelia":"🇩🇿","Austria":"🇦🇹","Jordania":"🇯🇴",
  // Grupo K
  "Portugal":"🇵🇹","DR Congo":"🇨🇩","Uzbekistán":"🇺🇿","Colombia":"🇨🇴",
  // Grupo L
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croacia":"🇭🇷","Ghana":"🇬🇭","Panamá":"🇵🇦",
  // TBD
  "TBD":"🏳️",
};
const flag = p => FLAGS[p] || "🏳️";

// Partidos reales Mundial 2026 — horas en horario de Chile (ET-1)
// Fase de grupos: 48 partidos confirmados
// Ronda de 32, cuartos, semis, final: por definir (TBD)
const mk = (id,local,visita,fecha,fase,penales=false) =>
  ({id,local,visita,fecha,fase,estado:"pendiente",goles_local:null,goles_visita:null,penales,gana_penales:null});

const PARTIDOS_SEED = [
  // ── GRUPO A ──────────────────────────────────────────────────
  mk("p1",  "México",       "Sudáfrica",    "Jun 11 - 15:00", "Grupo A"),
  mk("p2",  "Corea del Sur","Chequia",      "Jun 11 - 22:00", "Grupo A"),
  mk("p3",  "Chequia",      "Sudáfrica",    "Jun 18 - 12:00", "Grupo A"),
  mk("p4",  "México",       "Corea del Sur","Jun 18 - 21:00", "Grupo A"),
  mk("p5",  "Sudáfrica",    "Corea del Sur","Jun 25 - 21:00", "Grupo A"),
  mk("p6",  "Chequia",      "México",       "Jun 25 - 21:00", "Grupo A"),
  // ── GRUPO B ──────────────────────────────────────────────────
  mk("p7",  "Canadá",       "Bosnia",       "Jun 12 - 15:00", "Grupo B"),
  mk("p8",  "Qatar",        "Suiza",        "Jun 13 - 15:00", "Grupo B"),
  mk("p9",  "Suiza",        "Bosnia",       "Jun 19 - 15:00", "Grupo B"),
  mk("p10", "Canadá",       "Qatar",        "Jun 19 - 18:00", "Grupo B"),
  mk("p11", "Suiza",        "Canadá",       "Jun 25 - 15:00", "Grupo B"),
  mk("p12", "Bosnia",       "Qatar",        "Jun 25 - 15:00", "Grupo B"),
  // ── GRUPO C ──────────────────────────────────────────────────
  mk("p13", "Brasil",       "Marruecos",    "Jun 13 - 18:00", "Grupo C"),
  mk("p14", "Haití",        "Escocia",      "Jun 13 - 21:00", "Grupo C"),
  mk("p15", "Escocia",      "Marruecos",    "Jun 20 - 18:00", "Grupo C"),
  mk("p16", "Brasil",       "Haití",        "Jun 20 - 20:30", "Grupo C"),
  mk("p17", "Marruecos",    "Haití",        "Jun 25 - 18:00", "Grupo C"),
  mk("p18", "Escocia",      "Brasil",       "Jun 25 - 18:00", "Grupo C"),
  // ── GRUPO D ──────────────────────────────────────────────────
  mk("p19", "USA",          "Paraguay",     "Jun 12 - 21:00", "Grupo D"),
  mk("p20", "Australia",    "Turquía",      "Jun 14 - 00:00", "Grupo D"),
  mk("p21", "USA",          "Australia",    "Jun 20 - 15:00", "Grupo D"),
  mk("p22", "Turquía",      "Paraguay",     "Jun 20 - 23:00", "Grupo D"),
  mk("p23", "Turquía",      "USA",          "Jun 26 - 22:00", "Grupo D"),
  mk("p24", "Paraguay",     "Australia",    "Jun 26 - 22:00", "Grupo D"),
  // ── GRUPO E ──────────────────────────────────────────────────
  mk("p25", "Alemania",     "Curazao",      "Jun 15 - 13:00", "Grupo E"),
  mk("p26", "Costa de Marfil","Ecuador",    "Jun 14 - 19:00", "Grupo E"),
  mk("p27", "Alemania",     "Costa de Marfil","Jun 21 - 16:00","Grupo E"),
  mk("p28", "Ecuador",      "Curazao",      "Jun 21 - 20:00", "Grupo E"),
  mk("p29", "Curazao",      "Costa de Marfil","Jun 26 - 16:00","Grupo E"),
  mk("p30", "Ecuador",      "Alemania",     "Jun 26 - 16:00", "Grupo E"),
  // ── GRUPO F ──────────────────────────────────────────────────
  mk("p31", "Países Bajos", "Japón",        "Jun 14 - 16:00", "Grupo F"),
  mk("p32", "Suecia",       "Túnez",        "Jun 15 - 22:00", "Grupo F"),
  mk("p33", "Países Bajos", "Suecia",       "Jun 20 - 13:00", "Grupo F"),
  mk("p34", "Túnez",        "Japón",        "Jun 21 - 00:00", "Grupo F"),
  mk("p35", "Túnez",        "Países Bajos", "Jun 26 - 19:00", "Grupo F"),
  mk("p36", "Japón",        "Suecia",       "Jun 26 - 19:00", "Grupo F"),
  // ── GRUPO G ──────────────────────────────────────────────────
  mk("p37", "Bélgica",      "Egipto",       "Jun 15 - 15:00", "Grupo G"),
  mk("p38", "Irán",         "Nueva Zelanda","Jun 16 - 21:00", "Grupo G"),
  mk("p39", "Bélgica",      "Irán",         "Jun 22 - 15:00", "Grupo G"),
  mk("p40", "Nueva Zelanda","Egipto",       "Jun 22 - 21:00", "Grupo G"),
  mk("p41", "Bélgica",      "Nueva Zelanda","Jun 27 - 15:00", "Grupo G"),
  mk("p42", "Egipto",       "Irán",         "Jun 27 - 15:00", "Grupo G"),
  // ── GRUPO H ──────────────────────────────────────────────────
  mk("p43", "España",       "Cabo Verde",   "Jun 15 - 12:00", "Grupo H"),
  mk("p44", "Arabia Saudita","Uruguay",     "Jun 16 - 18:00", "Grupo H"),
  mk("p45", "España",       "Arabia Saudita","Jun 21 - 12:00","Grupo H"),
  mk("p46", "Uruguay",      "Cabo Verde",   "Jun 22 - 18:00", "Grupo H"),
  mk("p47", "Cabo Verde",   "Arabia Saudita","Jun 27 - 18:00","Grupo H"),
  mk("p48", "Uruguay",      "España",       "Jun 27 - 18:00", "Grupo H"),
  // ── GRUPO I ──────────────────────────────────────────────────
  mk("p49", "Francia",      "Senegal",      "Jun 16 - 15:00", "Grupo I"),
  mk("p50", "Irak",         "Noruega",      "Jun 17 - 18:00", "Grupo I"),
  mk("p51", "Francia",      "Irak",         "Jun 23 - 17:00", "Grupo I"),
  mk("p52", "Noruega",      "Senegal",      "Jun 23 - 20:00", "Grupo I"),
  mk("p53", "Noruega",      "Francia",      "Jun 27 - 21:00", "Grupo I"),
  mk("p54", "Senegal",      "Irak",         "Jun 27 - 21:00", "Grupo I"),
  // ── GRUPO J ──────────────────────────────────────────────────
  mk("p55", "Argentina",    "Argelia",      "Jun 17 - 21:00", "Grupo J"),
  mk("p56", "Austria",      "Jordania",     "Jun 17 - 00:00", "Grupo J"),
  mk("p57", "Argentina",    "Austria",      "Jun 22 - 13:00", "Grupo J"),
  mk("p58", "Jordania",     "Argelia",      "Jun 23 - 23:00", "Grupo J"),
  mk("p59", "Argentina",    "Jordania",     "Jun 28 - 15:00", "Grupo J"),
  mk("p60", "Argelia",      "Austria",      "Jun 28 - 15:00", "Grupo J"),
  // ── GRUPO K ──────────────────────────────────────────────────
  mk("p61", "Portugal",     "DR Congo",     "Jun 17 - 13:00", "Grupo K"),
  mk("p62", "Uzbekistán",   "Colombia",     "Jun 18 - 22:00", "Grupo K"),
  mk("p63", "Portugal",     "Uzbekistán",   "Jun 23 - 13:00", "Grupo K"),
  mk("p64", "Colombia",     "DR Congo",     "Jun 24 - 19:00", "Grupo K"),
  mk("p65", "Portugal",     "Colombia",     "Jun 28 - 18:00", "Grupo K"),
  mk("p66", "DR Congo",     "Uzbekistán",   "Jun 28 - 18:00", "Grupo K"),
  // ── GRUPO L ──────────────────────────────────────────────────
  mk("p67", "Inglaterra",   "Croacia",      "Jun 17 - 16:00", "Grupo L"),
  mk("p68", "Ghana",        "Panamá",       "Jun 18 - 19:00", "Grupo L"),
  mk("p69", "Inglaterra",   "Ghana",        "Jun 23 - 16:00", "Grupo L"),
  mk("p70", "Panamá",       "Croacia",      "Jun 24 - 19:00", "Grupo L"),
  mk("p71", "Inglaterra",   "Panamá",       "Jun 27 - 22:00", "Grupo L"),
  mk("p72", "Croacia",      "Ghana",        "Jun 27 - 22:00", "Grupo L"),
  // ── RONDA DE 32 (por definir) ─────────────────────────────────
  mk("r01", "TBD","TBD","Jul 01","Ronda de 32",true),
  mk("r02", "TBD","TBD","Jul 01","Ronda de 32",true),
  mk("r03", "TBD","TBD","Jul 02","Ronda de 32",true),
  mk("r04", "TBD","TBD","Jul 02","Ronda de 32",true),
  mk("r05", "TBD","TBD","Jul 03","Ronda de 32",true),
  mk("r06", "TBD","TBD","Jul 03","Ronda de 32",true),
  mk("r07", "TBD","TBD","Jul 04","Ronda de 32",true),
  mk("r08", "TBD","TBD","Jul 04","Ronda de 32",true),
  mk("r09", "TBD","TBD","Jul 05","Ronda de 32",true),
  mk("r10", "TBD","TBD","Jul 05","Ronda de 32",true),
  mk("r11", "TBD","TBD","Jul 06","Ronda de 32",true),
  mk("r12", "TBD","TBD","Jul 06","Ronda de 32",true),
  mk("r13", "TBD","TBD","Jul 07","Ronda de 32",true),
  mk("r14", "TBD","TBD","Jul 07","Ronda de 32",true),
  mk("r15", "TBD","TBD","Jul 08","Ronda de 32",true),
  mk("r16", "TBD","TBD","Jul 08","Ronda de 32",true),
  // ── CUARTOS DE FINAL ─────────────────────────────────────────
  mk("q1","TBD","TBD","Jul 11","Cuartos",true),
  mk("q2","TBD","TBD","Jul 11","Cuartos",true),
  mk("q3","TBD","TBD","Jul 12","Cuartos",true),
  mk("q4","TBD","TBD","Jul 12","Cuartos",true),
  // ── SEMIFINALES ───────────────────────────────────────────────
  mk("s1","TBD","TBD","Jul 15","Semifinal",true),
  mk("s2","TBD","TBD","Jul 16","Semifinal",true),
  // ── TERCER LUGAR ──────────────────────────────────────────────
  mk("t1","TBD","TBD","Jul 18","3er Lugar",true),
  // ── FINAL ─────────────────────────────────────────────────────
  mk("f1","TBD","TBD","Jul 19","Final",true),
];

// ── Storage helpers ───────────────────────────────────────────────
async function sget(key) {
  try { const r = await window.storage.get(key, true); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function sset(key, val) {
  try { await window.storage.set(key, JSON.stringify(val), true); } catch {}
}

// ── Simple hash ───────────────────────────────────────────────────
async function hash(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

// ─────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────
function Badge({ text, color }) {
  const c = { green:"#22c55e", yellow:"#f59e0b", gray:"#6b7280", blue:"#3b82f6", red:"#ef4444" };
  return (
    <span style={{background:`${c[color]}22`,color:c[color],border:`1px solid ${c[color]}44`}}
      className="text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">{text}</span>
  );
}

// ── Auth ──────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [tab, setTab]   = useState("login");
  const [form, setForm] = useState({ nombre:"", user:"", pass:"", pass2:"" });
  const [err, setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true); setErr("");
    const usuarios = await sget("usuarios") || [];
    const h = await hash(form.pass);
    const u = usuarios.find(x => x.username === form.user && x.passwordHash === h);
    if (!u) { setErr("Usuario o contraseña incorrectos"); setLoading(false); return; }
    onLogin(u);
    setLoading(false);
  }

  async function handleRegister() {
    if (!form.nombre || !form.user || !form.pass) { setErr("Completa todos los campos"); return; }
    if (form.pass !== form.pass2) { setErr("Las contraseñas no coinciden"); return; }
    setLoading(true); setErr("");
    const usuarios = await sget("usuarios") || [];
    if (usuarios.find(x => x.username === form.user)) { setErr("Ese usuario ya existe"); setLoading(false); return; }
    const isAdmin = usuarios.length === 0;
    if (isAdmin) await sset("partidos", PARTIDOS_SEED);
    const h = await hash(form.pass);
    const newUser = { id: `u_${Date.now()}`, nombre: form.nombre, username: form.user, passwordHash: h, isAdmin };
    await sset("usuarios", [...usuarios, newUser]);
    onLogin(newUser);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background:"linear-gradient(135deg,#0a0f1e,#1a2744,#0d1b2a)"}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-3xl font-black text-white">QUINIELA</h1>
          <h2 className="text-2xl font-black" style={{color:"#f59e0b"}}>INMORTALES 2026</h2>
          <p className="text-gray-400 text-sm mt-1">¡El mejor pronóstico gana!</p>
        </div>
        <div className="rounded-2xl p-6" style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
          <div className="flex mb-5 rounded-xl overflow-hidden" style={{background:"rgba(0,0,0,0.3)"}}>
            {["login","register"].map(t => (
              <button key={t} onClick={() => { setTab(t); setErr(""); }}
                className="flex-1 py-2 text-sm font-bold"
                style={tab===t?{background:"#f59e0b",color:"#000"}:{color:"#9ca3af"}}>
                {t==="login"?"Entrar":"Registrarse"}
              </button>
            ))}
          </div>
          {tab==="register" && (
            <input className="w-full mb-3 px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)"}}
              placeholder="Tu nombre" value={form.nombre}
              onChange={e => setForm({...form,nombre:e.target.value})} />
          )}
          <input className="w-full mb-3 px-4 py-3 rounded-xl text-white text-sm outline-none"
            style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)"}}
            placeholder="Usuario" value={form.user}
            onChange={e => setForm({...form,user:e.target.value})} />
          <input type="password" className="w-full mb-3 px-4 py-3 rounded-xl text-white text-sm outline-none"
            style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)"}}
            placeholder="Contraseña" value={form.pass}
            onChange={e => setForm({...form,pass:e.target.value})} />
          {tab==="register" && (
            <input type="password" className="w-full mb-3 px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)"}}
              placeholder="Confirmar contraseña" value={form.pass2}
              onChange={e => setForm({...form,pass2:e.target.value})} />
          )}
          {err && <p className="text-red-400 text-xs text-center mb-3">{err}</p>}
          <button disabled={loading}
            onClick={tab==="login"?handleLogin:handleRegister}
            className="w-full py-3 rounded-xl font-black text-black text-sm"
            style={{background:"linear-gradient(135deg,#f59e0b,#ef4444)",opacity:loading?0.7:1}}>
            {loading?"...":tab==="login"?"ENTRAR":"CREAR CUENTA"}
          </button>
          {tab==="register" &&
            <p className="text-gray-500 text-xs text-center mt-3">El primer usuario registrado será administrador</p>}
        </div>
      </div>
    </div>
  );
}

// ── Partido Card ──────────────────────────────────────────────────
function PartidoCard({ partido, miPron, onSave, allProns, usuarios }) {
  const iniciado = partido.estado !== "pendiente";
  const [form, setForm] = useState({
    res_simple:   miPron?.res_simple   || "",
    goles_local:  miPron?.goles_local  ?? "",
    goles_visita: miPron?.goles_visita ?? "",
    empate90:     miPron?.empate90     || false,
    gana_penales: miPron?.gana_penales || "",
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSave(partido.id, form);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  const pts = calcPuntos(miPron, partido);

  return (
    <div className="rounded-2xl p-4 mb-4"
      style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <Badge text={partido.fase} color={partido.fase==="Final"?"yellow":partido.fase==="Grupos"?"blue":"green"} />
        <span className="text-xs text-gray-400">{partido.fecha}</span>
        <Badge text={partido.estado==="pendiente"?"Pendiente":partido.estado==="en_curso"?"En curso":"Finalizado"}
          color={partido.estado==="pendiente"?"gray":partido.estado==="en_curso"?"yellow":"green"} />
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="text-center flex-1">
          <div className="text-3xl mb-1">{flag(partido.local)}</div>
          <div className="text-white font-bold text-sm">{partido.local}</div>
        </div>
        {partido.estado==="finalizado" ? (
          <div className="text-center">
            <div className="text-2xl font-black text-white">{partido.goles_local} – {partido.goles_visita}</div>
            {partido.gana_penales && <div className="text-xs text-yellow-400">Pen: {flag(partido.gana_penales)} {partido.gana_penales}</div>}
          </div>
        ) : <div className="text-gray-500 font-bold text-xl">VS</div>}
        <div className="text-center flex-1">
          <div className="text-3xl mb-1">{flag(partido.visita)}</div>
          <div className="text-white font-bold text-sm">{partido.visita}</div>
        </div>
      </div>

      {!iniciado ? (
        partido.local === "TBD" ? (
          <p className="text-gray-600 text-xs text-center py-2 italic">⏳ Equipos por definir</p>
        ) :
        <div>
          <p className="text-gray-400 text-xs text-center mb-3">🔒 Solo tú ves tu pronóstico hasta que inicie</p>
          <div className="flex gap-2 mb-3">
            {["local","empate","visita"].map(r => (
              <button key={r} onClick={() => setForm({...form,res_simple:r})}
                className="flex-1 py-2 rounded-xl text-xs font-bold"
                style={form.res_simple===r?{background:"#f59e0b",color:"#000"}:{background:"rgba(255,255,255,0.07)",color:"#9ca3af"}}>
                {r==="local"?`${flag(partido.local)} Gana`:r==="visita"?`${flag(partido.visita)} Gana`:"Empate"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 mb-3 justify-center">
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">{partido.local}</p>
              <input type="number" min="0" placeholder="0"
                className="w-14 text-center py-2 rounded-xl text-white font-bold outline-none"
                style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)"}}
                value={form.goles_local} onChange={e => setForm({...form,goles_local:e.target.value})} />
            </div>
            <span className="text-gray-400 font-bold mt-4">–</span>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">{partido.visita}</p>
              <input type="number" min="0" placeholder="0"
                className="w-14 text-center py-2 rounded-xl text-white font-bold outline-none"
                style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)"}}
                value={form.goles_visita} onChange={e => setForm({...form,goles_visita:e.target.value})} />
            </div>
          </div>
          {partido.penales && (
            <div className="rounded-xl p-3 mb-3"
              style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)"}}>
              <p className="text-yellow-400 text-xs font-bold mb-2">⚡ Fase eliminatoria</p>
              <label className="flex items-center gap-2 text-sm text-gray-300 mb-2 cursor-pointer">
                <input type="checkbox" checked={form.empate90}
                  onChange={e => setForm({...form,empate90:e.target.checked,gana_penales:""})} />
                Empate en 90 min (+1 pt)
              </label>
              {form.empate90 && (
                <div>
                  <p className="text-gray-400 text-xs mb-2">¿Quién gana en penales? (+3 pts)</p>
                  <div className="flex gap-2">
                    {[partido.local,partido.visita].map(eq => (
                      <button key={eq} onClick={() => setForm({...form,gana_penales:eq})}
                        className="flex-1 py-2 rounded-xl text-xs font-bold"
                        style={form.gana_penales===eq?{background:"#f59e0b",color:"#000"}:{background:"rgba(255,255,255,0.07)",color:"#9ca3af"}}>
                        {flag(eq)} {eq}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <button onClick={handleSave}
            className="w-full py-2.5 rounded-xl font-black text-black text-sm"
            style={{background:saved?"#22c55e":"linear-gradient(135deg,#f59e0b,#ef4444)"}}>
            {saved?"✓ Guardado":"Guardar pronóstico"}
          </button>
        </div>
      ) : (
        <div>
          {miPron ? (
            <div className="mb-3 p-3 rounded-xl" style={{background:"rgba(255,255,255,0.05)"}}>
              <p className="text-gray-400 text-xs mb-1">Tu pronóstico</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white text-sm font-bold">
                  {miPron.res_simple==="local"?`${flag(partido.local)} ${partido.local}`:
                   miPron.res_simple==="visita"?`${flag(partido.visita)} ${partido.visita}`:"🤝 Empate"}
                </span>
                {miPron.goles_local!==""&&miPron.goles_visita!==""&&
                  <span className="text-yellow-400 text-sm font-bold">{miPron.goles_local}–{miPron.goles_visita}</span>}
                {miPron.empate90&&<Badge text="Empate 90'" color="blue"/>}
                {miPron.gana_penales&&<span className="text-xs text-gray-300">Pen: {flag(miPron.gana_penales)} {miPron.gana_penales}</span>}
                {partido.estado==="finalizado"&&<Badge text={`+${pts} pts`} color={pts>0?"green":"gray"}/>}
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-xs text-center mb-3">No pusiste pronóstico para este partido</p>
          )}
          {allProns.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs mb-2">📋 Pronósticos del grupo</p>
              {allProns.map((p,i) => {
                const u = usuarios.find(x => x.id===p.userId);
                const pp = calcPuntos(p, partido);
                return (
                  <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg mb-1"
                    style={{background:"rgba(255,255,255,0.04)"}}>
                    <span className="text-gray-300 font-medium">{u?.nombre||"?"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white">
                        {p.res_simple==="local"?flag(partido.local):p.res_simple==="visita"?flag(partido.visita):"🤝"}
                        {p.goles_local!==""&&p.goles_visita!==""?` ${p.goles_local}–${p.goles_visita}`:""}
                      </span>
                      {p.empate90&&<span className="text-blue-400">Pen:{flag(p.gana_penales)}</span>}
                      {partido.estado==="finalizado"&&<Badge text={`+${pp}`} color={pp>0?"green":"gray"}/>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Admin ─────────────────────────────────────────────────────────
function AdminPanel({ partidos, onUpdate }) {
  const [sel, setSel]   = useState(null);
  const [form, setForm] = useState({});

  function selectP(p) {
    setSel(p.id);
    setForm({ goles_local:p.goles_local??"", goles_visita:p.goles_visita??"", gana_penales:p.gana_penales||"", estado:p.estado });
  }

  return (
    <div>
      <h2 className="text-white font-black text-lg mb-4">⚙️ Panel de Admin</h2>
      <p className="text-gray-400 text-sm mb-4">Toca un partido para actualizar su estado y resultado.</p>
      {partidos.map(p => (
        <div key={p.id} onClick={() => selectP(p)} className="rounded-xl p-3 mb-3 cursor-pointer"
          style={{background:sel===p.id?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.04)",
                  border:sel===p.id?"1px solid rgba(245,158,11,0.4)":"1px solid rgba(255,255,255,0.08)"}}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-white text-sm font-bold">{flag(p.local)} {p.local} vs {p.visita} {flag(p.visita)}</span>
            <Badge text={p.estado} color={p.estado==="pendiente"?"gray":p.estado==="en_curso"?"yellow":"green"}/>
          </div>
          {p.estado==="finalizado"&&
            <div className="text-yellow-400 text-xs mt-1">{p.goles_local}–{p.goles_visita}{p.gana_penales?` | Pen: ${p.gana_penales}`:""}</div>}
        </div>
      ))}
      {sel && (() => {
        const p = partidos.find(x => x.id===sel);
        return (
          <div className="rounded-2xl p-4 mt-2"
            style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.3)"}}>
            <h3 className="text-yellow-400 font-bold mb-3">{flag(p.local)} {p.local} vs {p.visita} {flag(p.visita)}</h3>
            <div className="mb-3">
              <label className="text-gray-400 text-xs mb-1 block">Estado</label>
              <div className="flex gap-2">
                {["pendiente","en_curso","finalizado"].map(s => (
                  <button key={s} onClick={() => setForm({...form,estado:s})}
                    className="flex-1 py-2 rounded-xl text-xs font-bold"
                    style={form.estado===s?{background:"#f59e0b",color:"#000"}:{background:"rgba(255,255,255,0.07)",color:"#9ca3af"}}>
                    {s==="pendiente"?"Pendiente":s==="en_curso"?"En curso":"Finalizado"}
                  </button>
                ))}
              </div>
            </div>
            {(form.estado==="en_curso"||form.estado==="finalizado") && (
              <div className="flex items-center gap-3 mb-3 justify-center">
                <div className="text-center">
                  <label className="text-gray-400 text-xs block mb-1">{p.local}</label>
                  <input type="number" min="0"
                    className="w-14 text-center py-2 rounded-xl text-white font-bold outline-none"
                    style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)"}}
                    value={form.goles_local} onChange={e => setForm({...form,goles_local:e.target.value})} />
                </div>
                <span className="text-gray-400 mt-4">–</span>
                <div className="text-center">
                  <label className="text-gray-400 text-xs block mb-1">{p.visita}</label>
                  <input type="number" min="0"
                    className="w-14 text-center py-2 rounded-xl text-white font-bold outline-none"
                    style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)"}}
                    value={form.goles_visita} onChange={e => setForm({...form,goles_visita:e.target.value})} />
                </div>
              </div>
            )}
            {p.penales && form.estado==="finalizado" && Number(form.goles_local)===Number(form.goles_visita) && (
              <div className="mb-3">
                <label className="text-gray-400 text-xs mb-2 block">¿Quién ganó en penales?</label>
                <div className="flex gap-2">
                  {[p.local,p.visita].map(eq => (
                    <button key={eq} onClick={() => setForm({...form,gana_penales:eq})}
                      className="flex-1 py-2 rounded-xl text-xs font-bold"
                      style={form.gana_penales===eq?{background:"#f59e0b",color:"#000"}:{background:"rgba(255,255,255,0.07)",color:"#9ca3af"}}>
                      {flag(eq)} {eq}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => { onUpdate(sel,form); setSel(null); }}
              className="w-full py-2.5 rounded-xl font-black text-black text-sm"
              style={{background:"linear-gradient(135deg,#f59e0b,#ef4444)"}}>
              Actualizar partido
            </button>
          </div>
        );
      })()}
    </div>
  );
}

// ── Tabla ─────────────────────────────────────────────────────────
function Tabla({ usuarios, partidos, pronosticos }) {
  const ranking = [...usuarios].map(u => ({
    ...u,
    puntos: partidos.reduce((acc,p) => {
      const pron = pronosticos.find(x => x.userId===u.id && x.partidoId===p.id);
      return acc + calcPuntos(pron,p);
    },0)
  })).sort((a,b) => b.puntos-a.puntos);
  const medallas = ["🥇","🥈","🥉"];
  return (
    <div>
      <h2 className="text-white font-black text-lg mb-4">🏆 Tabla de Posiciones</h2>
      {ranking.length===0
        ? <p className="text-gray-500 text-center py-8">Aún no hay participantes</p>
        : ranking.map((u,i) => (
          <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl mb-2"
            style={{background:i===0?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.04)",
                    border:i===0?"1px solid rgba(245,158,11,0.3)":"1px solid rgba(255,255,255,0.06)"}}>
            <span className="text-2xl w-8 text-center">{medallas[i]||i+1}</span>
            <div className="flex-1">
              <div className="text-white font-bold">{u.nombre}</div>
              <div className="text-gray-400 text-xs">@{u.username}</div>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-black text-xl">{u.puntos}</div>
              <div className="text-gray-500 text-xs">pts</div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ── Reglas ────────────────────────────────────────────────────────
function Reglas() {
  const items = [
    { icon:"🎯", t:"Resultado correcto", d:"Aciertas quién gana o el empate (G/E/P)", pts:"+1 pt",  c:"#3b82f6" },
    { icon:"🔮", t:"Marcador exacto",    d:"Aciertas el marcador exacto del partido", pts:"+3 pts", c:"#8b5cf6" },
    { icon:"⚡", t:"Empate en 90 min",   d:"Solo eliminatoria: aciertas que habrá empate al finalizar el tiempo reglamentario", pts:"+1 pt",  c:"#f59e0b" },
    { icon:"🏅", t:"Ganador en penales", d:"Solo si hay empate en 90 min: aciertas quién gana la tanda de penales", pts:"+3 pts", c:"#ef4444" },
  ];
  return (
    <div>
      <h2 className="text-white font-black text-lg mb-4">📖 Sistema de Puntuación</h2>
      {items.map(r => (
        <div key={r.t} className="rounded-xl p-4 mb-3"
          style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{r.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-white font-bold text-sm">{r.t}</span>
                <span className="font-black text-sm px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{color:r.c,background:`${r.c}22`}}>{r.pts}</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">{r.d}</p>
            </div>
          </div>
        </div>
      ))}
      <div className="rounded-xl p-4" style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)"}}>
        <h3 className="text-yellow-400 font-bold text-sm mb-2">📌 Reglas importantes</h3>
        <ul className="text-gray-300 text-xs space-y-1.5">
          <li>• Los pronósticos son privados hasta que inicia el partido</li>
          <li>• No puedes modificar tu pronóstico una vez iniciado el partido</li>
          <li>• El pronóstico de penales se hace antes del partido (no durante)</li>
          <li>• Los puntos de penales solo aplican si hay empate en 90 minutos</li>
          <li>• Marcador exacto acumula con resultado (máximo 4 pts por partido)</li>
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user,        setUser]        = useState(null);
  const [tab,         setTab]         = useState("partidos");
  const [partidos,    setPartidos]    = useState([]);
  const [pronosticos, setPronosticos] = useState([]);
  const [usuarios,    setUsuarios]    = useState([]);
  const [loading,     setLoading]     = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [p, pr, u] = await Promise.all([
      sget("partidos"), sget("pronosticos"), sget("usuarios")
    ]);
    setPartidos(p || []);
    setPronosticos(pr || []);
    setUsuarios(u || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  // Refresca datos al volver a la pestaña
  useEffect(() => {
    const onFocus = () => { if (user) loadData(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, loadData]);

  async function savePron(partidoId, form) {
    const partido = partidos.find(p => p.id===partidoId);
    if (!partido || partido.estado!=="pendiente") return;
    const existing = pronosticos.find(p => p.userId===user.id && p.partidoId===partidoId);
    let updated;
    if (existing) {
      updated = pronosticos.map(p => p.userId===user.id && p.partidoId===partidoId ? {...p,...form} : p);
    } else {
      updated = [...pronosticos, { userId:user.id, partidoId, ...form }];
    }
    setPronosticos(updated);
    await sset("pronosticos", updated);
  }

  async function updatePartido(id, form) {
    const updated = partidos.map(p => p.id===id
      ? { ...p, estado:form.estado, goles_local:Number(form.goles_local),
          goles_visita:Number(form.goles_visita), gana_penales:form.gana_penales||null }
      : p);
    setPartidos(updated);
    await sset("partidos", updated);
  }

  if (!user) return <AuthScreen onLogin={u => { setUser(u); }} />;

  const tabs = [
    { id:"partidos", icon:"⚽", label:"Partidos" },
    { id:"tabla",    icon:"🏆", label:"Tabla"    },
    { id:"reglas",   icon:"📖", label:"Puntos"   },
    ...(user.isAdmin?[{ id:"admin", icon:"⚙️", label:"Admin" }]:[]),
  ];

  return (
    <div className="min-h-screen pb-24"
      style={{background:"linear-gradient(135deg,#0a0f1e,#1a2744,#0d1b2a)"}}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{background:"rgba(10,15,30,0.9)",backdropFilter:"blur(10px)",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <div>
          <h1 className="text-white font-black text-sm">QUINIELA INMORTALES</h1>
          <p className="font-black text-xs" style={{color:"#f59e0b"}}>2026 🏆</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-300 text-xs font-medium">{user.nombre}</span>
          {user.isAdmin&&<Badge text="Admin" color="yellow"/>}
          <button onClick={() => setUser(null)}
            className="text-gray-500 text-xs px-2 py-1 rounded-lg"
            style={{background:"rgba(255,255,255,0.06)"}}>Salir</button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {loading ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">⚽</div>
            <p className="text-gray-400">Cargando...</p>
          </div>
        ) : (
          <>
            {tab==="partidos" && partidos.map(p => {
              const miPron   = pronosticos.find(x => x.userId===user.id && x.partidoId===p.id);
              const allProns = p.estado!=="pendiente" ? pronosticos.filter(x => x.partidoId===p.id) : [];
              return <PartidoCard key={p.id} partido={p} miPron={miPron} onSave={savePron} allProns={allProns} usuarios={usuarios}/>;
            })}
            {tab==="tabla"  && <Tabla usuarios={usuarios} partidos={partidos} pronosticos={pronosticos}/>}
            {tab==="reglas" && <Reglas/>}
            {tab==="admin"  && user.isAdmin && <AdminPanel partidos={partidos} onUpdate={updatePartido}/>}
          </>
        )}
      </div>

      {/* Botón refrescar */}
      <button onClick={loadData}
        className="fixed bottom-20 right-4 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg"
        style={{background:"rgba(245,158,11,0.9)",color:"#000"}}>
        🔄
      </button>

      {/* Nav */}
      <div className="fixed bottom-0 left-0 right-0 flex"
        style={{background:"rgba(10,15,30,0.95)",backdropFilter:"blur(10px)",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); loadData(); }}
            className="flex-1 py-3 flex flex-col items-center gap-1"
            style={tab===t.id?{color:"#f59e0b"}:{color:"#6b7280"}}>
            <span className="text-xl">{t.icon}</span>
            <span className="text-xs font-bold">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}