import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";
import { generarExamen } from "./preguntas.js";

// ─── STORE ────────────────────────────────────────────────────────────────────
const useStore = create((set, get) => ({
  pantalla: "inicio",
  modo: "examen",
  preguntaActual: 0,
  respuestas: {},
  tiempoRestante: 45 * 60,
  preguntas: [],

  iniciar: (modo) => set({
    pantalla: "examen",
    modo,
    preguntaActual: 0,
    respuestas: {},
    tiempoRestante: 45 * 60,
    preguntas: generarExamen(35),
  }),

  reiniciar: () => set({ pantalla: "inicio", preguntaActual: 0, respuestas: {}, tiempoRestante: 45 * 60, preguntas: [] }),

  responder: (i) => {
    const { preguntaActual, respuestas, modo, preguntas } = get();
    if (respuestas[preguntaActual] !== undefined) return;
    const nuevas = { ...respuestas, [preguntaActual]: i };
    set({ respuestas: nuevas });
    if (modo === "examen") {
      setTimeout(() => {
        const { preguntaActual: pa } = get();
        if (pa < preguntas.length - 1) set({ preguntaActual: pa + 1 });
        else set({ pantalla: "resultado" });
      }, 500);
    }
  },

  siguiente: () => {
    const { preguntaActual, preguntas } = get();
    if (preguntaActual < preguntas.length - 1) set({ preguntaActual: preguntaActual + 1 });
    else set({ pantalla: "resultado" });
  },

  tick: () => {
    const { tiempoRestante } = get();
    if (tiempoRestante <= 1) set({ pantalla: "resultado" });
    else set({ tiempoRestante: tiempoRestante - 1 });
  },
}));

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// ─── TOP BAR MÓVIL ────────────────────────────────────────────────────────────
function TopBar({ onMenuToggle, showMenu }) {
  const { tiempoRestante, modo } = useStore();
  const urgente = tiempoRestante < 120;
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-black text-white text-base">Maneja<span className="text-blue-400">CL</span></span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${modo === "examen" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>
          {modo === "examen" ? "Examen" : "Estudio"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <motion.span animate={{ color: urgente ? "#f87171" : "#e2e8f0" }} className="font-mono font-black text-sm">
          {fmt(tiempoRestante)}
        </motion.span>
        <button onClick={onMenuToggle} className="w-8 h-8 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400">
          {showMenu
            ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            : <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          }
        </button>
      </div>
    </div>
  );
}

// ─── SIDEBAR CONTENT ──────────────────────────────────────────────────────────
function SidebarContent({ onClose }) {
  const { preguntaActual, respuestas, tiempoRestante, modo, preguntas } = useStore();
  const urgente = tiempoRestante < 120;
  const correctasHasta = Object.entries(respuestas).filter(([i, r]) => preguntas[+i]?.correcta === r).length;

  return (
    <div className="flex flex-col p-5 gap-4 h-full overflow-y-auto">
      {/* Logo — solo desktop */}
      <div className="hidden md:flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-black text-white text-lg">Maneja<span className="text-blue-400">CL</span></span>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${modo === "examen" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>
          {modo === "examen" ? "Examen" : "Estudio"}
        </span>
      </div>

      {/* Timer — solo desktop */}
      <div className={`hidden md:block rounded-2xl border p-4 text-center ${urgente ? "border-red-500/40 bg-red-500/5" : "border-slate-700/60 bg-slate-800/40"}`}>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Tiempo restante</p>
        <motion.p animate={{ color: urgente ? "#f87171" : "#ffffff" }} className="text-3xl font-black font-mono">
          {fmt(tiempoRestante)}
        </motion.p>
        {urgente && <p className="text-xs text-red-400 mt-1 font-medium">¡Apúrate!</p>}
      </div>

      {/* Progreso */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Progreso</span>
          <span>{preguntaActual + 1} / {preguntas.length}</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
          <motion.div
            className={`h-full rounded-full ${modo === "examen" ? "bg-blue-500" : "bg-amber-500"}`}
            animate={{ width: `${((preguntaActual + 1) / preguntas.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        {modo === "estudio" && (
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400 font-semibold">{correctasHasta} correctas</span>
            <span className="text-red-400 font-semibold">{Object.keys(respuestas).length - correctasHasta} incorrectas</span>
          </div>
        )}
      </div>

      {/* Grid preguntas */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Preguntas</p>
        <div className="grid grid-cols-7 gap-1.5">
          {preguntas.map((_, i) => {
            const resp = respuestas[i];
            const esActual = i === preguntaActual;
            const respondida = resp !== undefined;
            const correcta = modo === "estudio" && resp === preguntas[i]?.correcta;
            const incorrecta = modo === "estudio" && respondida && resp !== preguntas[i]?.correcta;
            return (
              <button
                key={i}
                onClick={() => {
                  if (modo === "estudio") {
                    useStore.setState({ preguntaActual: i });
                    if (onClose) onClose();
                  }
                }}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  esActual ? (modo === "examen" ? "bg-blue-500 text-white scale-110" : "bg-amber-500 text-white scale-110") :
                  correcta ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" :
                  incorrecta ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                  respondida ? "bg-slate-600/40 text-slate-400 border border-slate-600/40" :
                  "bg-slate-800 text-slate-500 border border-slate-700"
                } ${modo === "examen" ? "cursor-default" : "hover:border-slate-500"}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        {modo === "examen" && (
          <p className="text-xs text-slate-600 mt-3">No puedes navegar entre preguntas en modo examen.</p>
        )}
      </div>

      <button
        onClick={() => useStore.getState().reiniciar()}
        className="md:hidden mt-4 border border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 text-sm font-semibold py-2.5 rounded-xl transition-all"
      >
        ← Salir al inicio
      </button>
    </div>
  );
}

// ─── INFO PANEL (categoría + feedback + stats) ────────────────────────────────
function InfoPanel({ pregunta, respuestaGuardada, yaRespondida, correctasHasta, preguntas, respuestas }) {
  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={`cat-${pregunta.pregunta}`}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4"
        >
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Categoría</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg flex-shrink-0">
              {pregunta.icono}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{pregunta.categoria}</p>
              <div className="flex gap-1 mt-1.5">
                {[1,2,3,4,5].map((n) => (
                  <div key={n} className={`h-1.5 w-4 rounded-full ${n <= pregunta.dificultad ? "bg-amber-400" : "bg-slate-700"}`} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {yaRespondida ? (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`rounded-2xl border p-4 ${
              respuestaGuardada === pregunta.correcta ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${
              respuestaGuardada === pregunta.correcta ? "text-emerald-400" : "text-red-400"
            }`}>
              {respuestaGuardada === pregunta.correcta ? "✓ Correcto" : "✗ Incorrecto"}
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">{pregunta.explicacion}</p>
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-slate-700/40 bg-slate-800/20 p-5 flex flex-col items-center justify-center text-center gap-3 min-h-36"
          >
            <div className="w-10 h-10 rounded-full border-2 border-slate-700 flex items-center justify-center text-slate-600 text-xl">?</div>
            <p className="text-slate-600 text-sm">Responde para ver la explicación</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Rendimiento</p>
        <div className="space-y-3">
          {[
            { label: "Respondidas", valor: Object.keys(respuestas).length, color: "bg-blue-500" },
            { label: "Correctas", valor: correctasHasta, color: "bg-emerald-500" },
            { label: "Incorrectas", valor: Object.keys(respuestas).length - correctasHasta, color: "bg-red-500" },
          ].map(({ label, valor, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-300 font-semibold">{valor}/{preguntas.length}</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <motion.div className={`h-full ${color} rounded-full`} animate={{ width: `${(valor / preguntas.length) * 100}%` }} transition={{ duration: 0.5 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MODO EXAMEN ──────────────────────────────────────────────────────────────
function ModoExamen() {
  const { preguntaActual, respuestas, tick, preguntas } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [tick]);

  const pregunta = preguntas[preguntaActual];
  if (!pregunta) return null;
  const respuestaGuardada = respuestas[preguntaActual];
  const yaRespondida = respuestaGuardada !== undefined;

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden md:flex w-64 flex-shrink-0 border-r border-slate-800 flex-col">
        <SidebarContent />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuToggle={() => setMenuOpen(!menuOpen)} showMenu={menuOpen} />

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-slate-800 overflow-hidden bg-slate-900/95 flex-shrink-0"
              style={{ maxHeight: "60vh", overflowY: "auto" }}
            >
              <SidebarContent onClose={() => setMenuOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-10 flex flex-col justify-start pt-8 md:pt-20 max-w-4xl mx-auto w-full pb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={preguntaActual}
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-blue-400 text-sm md:text-base font-bold uppercase tracking-widest mb-4 md:mb-6 block">
                  Pregunta {preguntaActual + 1} de {preguntas.length}
                </span>
                <p className="text-slate-400 text-xs md:text-sm mb-2">
                  {Math.round(((preguntaActual + 1) / preguntas.length) * 100)}% completado
                </p>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-6 md:mb-10">
                  <motion.div className="h-full bg-blue-400" initial={false} animate={{ width: `${((preguntaActual + 1) / preguntas.length) * 100}%` }} transition={{ duration: 0.35, ease: "easeOut" }} />
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-white leading-relaxed max-w-3xl mb-7 md:mb-12 tracking-tight">
                  {pregunta.pregunta}
                </h2>

                <div className="flex flex-col gap-2.5 md:gap-3">
                  {pregunta.opciones.map((op, i) => (
                    <motion.button
                      key={i}
                      onClick={() => !yaRespondida && useStore.getState().responder(i)}
                      disabled={yaRespondida}
                      whileTap={!yaRespondida ? { scale: 0.97 } : {}}
                      whileHover={!yaRespondida ? { scale: 1.015 } : {}}
                      className={`text-left px-4 md:px-8 py-4 md:py-6 rounded-2xl border-2 transition-all duration-150 text-base md:text-xl font-medium ${
                        yaRespondida && i === respuestaGuardada
                          ? "border-blue-500 bg-blue-500/10 text-blue-200"
                          : yaRespondida
                          ? "border-slate-700/30 bg-slate-800/20 text-slate-500 cursor-default"
                          : "border-slate-700/60 bg-slate-800/40 text-slate-200 hover:border-blue-400 hover:bg-slate-700/60 hover:shadow-lg hover:shadow-blue-500/10"
                      }`}
                    >
                      <span className="flex items-center gap-3 md:gap-4">
                        <span className={`w-8 h-8 md:w-9 md:h-9 rounded-xl border-2 border-current flex items-center justify-center flex-shrink-0 font-black text-sm ${
                          yaRespondida && i === respuestaGuardada ? "bg-blue-500/20" : ""
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {op}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence>
                  {yaRespondida && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-6 md:mt-8 text-slate-500 text-sm flex items-center gap-2"
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Respuesta registrada · Pasando a la siguiente pregunta...
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MODO ESTUDIO ─────────────────────────────────────────────────────────────
function ModoEstudio() {
  const { preguntaActual, respuestas, tick, siguiente, preguntas } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [tick]);

  const pregunta = preguntas[preguntaActual];
  if (!pregunta) return null;
  const respuestaGuardada = respuestas[preguntaActual];
  const yaRespondida = respuestaGuardada !== undefined;
  const correctasHasta = Object.entries(respuestas).filter(([i, r]) => preguntas[+i]?.correcta === r).length;

  const estadoOpcion = (i) => {
    if (!yaRespondida) return "neutro";
    if (i === pregunta.correcta) return "correcta";
    if (i === respuestaGuardada) return "incorrecta";
    return "neutro";
  };

  const estilos = {
    neutro: "border-slate-700/60 bg-slate-800/40 text-slate-200 hover:border-amber-400 hover:bg-slate-700/60 cursor-pointer",
    correcta: "border-emerald-500 bg-emerald-500/10 text-emerald-300 cursor-default",
    incorrecta: "border-red-500 bg-red-500/10 text-red-300 cursor-default",
    deshabilitado: "border-slate-700/30 bg-slate-800/20 text-slate-500 cursor-default",
  };

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden md:flex w-64 flex-shrink-0 border-r border-slate-800 flex-col">
        <SidebarContent />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuToggle={() => setMenuOpen(!menuOpen)} showMenu={menuOpen} />

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-slate-800 overflow-hidden bg-slate-900/95 flex-shrink-0"
              style={{ maxHeight: "60vh", overflowY: "auto" }}
            >
              <SidebarContent onClose={() => setMenuOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row min-h-full">
            {/* Preguntas */}
            <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800/60">
              <div className="flex-1 px-4 md:px-10 flex flex-col pt-8 md:pt-20 max-w-4xl mx-auto w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={preguntaActual}
                    initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.22 }}
                  >
                    <span className="text-amber-400 text-sm md:text-base font-bold uppercase tracking-widest mb-4 md:mb-6 block">
                      Pregunta {preguntaActual + 1} de {preguntas.length}
                    </span>
                    <p className="text-slate-400 text-xs md:text-sm mb-2">
                      {Math.round(((preguntaActual + 1) / preguntas.length) * 100)}% completado
                    </p>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-6 md:mb-10">
                      <motion.div className="h-full bg-blue-400" animate={{ width: `${((preguntaActual + 1) / preguntas.length) * 100}%` }} transition={{ duration: 0.35, ease: "easeOut" }} initial={false} />
                    </div>
                    <h2 className="text-2xl md:text-4xl font-bold text-white leading-relaxed max-w-3xl mb-7 md:mb-12 tracking-tight">
                      {pregunta.pregunta}
                    </h2>

                    <div className="flex flex-col gap-2.5 md:gap-4">
                      {pregunta.opciones.map((op, i) => {
                        const estado = estadoOpcion(i);
                        return (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            key={i}
                            onClick={() => !yaRespondida && useStore.getState().responder(i)}
                            disabled={yaRespondida}
                            className={`text-left px-4 md:px-8 py-4 md:py-5 rounded-2xl border-2 transition-all duration-200 text-base md:text-lg font-medium ${
                              yaRespondida && estado === "neutro" ? estilos.deshabilitado : estilos[estado]
                            }`}
                            animate={
                              estado === "correcta" ? { scale: [1, 1.015, 1] } :
                              estado === "incorrecta" ? { x: [0, -8, 8, -5, 5, 0] } : {}
                            }
                            whileHover={!yaRespondida ? { scale: 1.015 } : {}}
                            transition={{ duration: 0.35 }}
                          >
                            <span className="flex items-center gap-3 md:gap-4">
                              <span className={`w-8 h-8 md:w-9 md:h-9 rounded-xl border-2 border-current flex items-center justify-center flex-shrink-0 font-black text-sm ${
                                estado === "correcta" ? "bg-emerald-500/20" :
                                estado === "incorrecta" ? "bg-red-500/20" : ""
                              }`}>
                                {estado === "correcta" ? "✓" : estado === "incorrecta" ? "✗" : String.fromCharCode(65 + i)}
                              </span>
                              {op}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Info panel en móvil (debajo opciones) */}
                    <div className="lg:hidden mt-6 mb-4">
                      <InfoPanel
                        pregunta={pregunta}
                        respuestaGuardada={respuestaGuardada}
                        yaRespondida={yaRespondida}
                        correctasHasta={correctasHasta}
                        preguntas={preguntas}
                        respuestas={respuestas}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navegación */}
              <div className="flex items-center justify-between px-4 md:px-10 py-4 md:py-6 border-t border-slate-800 flex-shrink-0">
                <button
                  onClick={() => useStore.setState({ preguntaActual: Math.max(0, preguntaActual - 1) })}
                  disabled={preguntaActual === 0}
                  className="px-4 md:px-5 py-2.5 md:py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold text-sm md:text-base"
                >
                  ← Anterior
                </button>
                <AnimatePresence>
                  {yaRespondida && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      onClick={siguiente}
                      className="px-6 md:px-8 py-2.5 md:py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm md:text-base"
                    >
                      {preguntaActual < preguntas.length - 1 ? "Siguiente →" : "Ver resultado"}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Panel derecho — solo desktop/tablet grande */}
            <div className="hidden lg:flex w-72 flex-shrink-0 flex-col gap-4 p-5 overflow-y-auto">
              <InfoPanel
                pregunta={pregunta}
                respuestaGuardada={respuestaGuardada}
                yaRespondida={yaRespondida}
                correctasHasta={correctasHasta}
                preguntas={preguntas}
                respuestas={respuestas}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INICIO ───────────────────────────────────────────────────────────────────
function Inicio() {
  const iniciar = useStore((s) => s.iniciar);

  return (
    <div className="flex items-center justify-center w-full h-full overflow-y-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center max-w-2xl w-full px-5 md:px-8"
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-6 md:mb-8"
        >
          <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-5xl md:text-6xl font-black text-white tracking-tight mb-3"
        >
          Maneja<span className="text-blue-400">CL</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-slate-400 text-center text-base md:text-lg mb-8 md:mb-12 max-w-md leading-relaxed"
        >
          Practica el examen teórico CONASET completamente gratis. Preguntas oficiales, sin límites.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-4 gap-3 md:gap-16 mb-8 md:mb-14 w-full max-w-xs md:max-w-none"
        >
          {[["200+", "Preguntas"], ["100%", "Gratis"], ["45 min", "Examen"], ["2025", "Actualizado"]].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="text-lg md:text-3xl font-black text-white mb-1">{v}</div>
              <div className="text-xs text-slate-500">{l}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full max-w-xl"
        >
          <button
            onClick={() => iniciar("examen")}
            className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 border-2 border-blue-500/40 hover:border-blue-500 text-left p-5 md:p-6 rounded-2xl transition-all hover:-translate-y-1 active:scale-95"
          >
            <div className="text-2xl md:text-3xl mb-2 md:mb-3">📋</div>
            <p className="text-white font-black text-base md:text-lg mb-1">Modo Examen</p>
            <p className="text-slate-400 text-sm leading-snug mb-3 md:mb-4">Sin retroalimentación. Idéntico al examen real del CONASET.</p>
            <span className="text-blue-400 text-sm font-semibold">Iniciar →</span>
          </button>

          <button
            onClick={() => iniciar("estudio")}
            className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border-2 border-amber-500/40 hover:border-amber-500 text-left p-5 md:p-6 rounded-2xl transition-all hover:-translate-y-1 active:scale-95"
          >
            <div className="text-2xl md:text-3xl mb-2 md:mb-3">💡</div>
            <p className="text-white font-black text-base md:text-lg mb-1">Modo Estudio</p>
            <p className="text-slate-400 text-sm leading-snug mb-3 md:mb-4">Feedback inmediato y explicaciones detalladas en cada pregunta.</p>
            <span className="text-amber-400 text-sm font-semibold">Estudiar →</span>
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-xs text-slate-600 mt-8 md:mt-10 text-center"
        >
          Preguntas oficiales del Cuestionario Base CONASET · Chile
        </motion.p>
      </motion.div>
    </div>
  );
}

// ─── RESULTADO ────────────────────────────────────────────────────────────────
function Resultado() {
  const { respuestas, reiniciar, modo, iniciar, preguntas } = useStore();
  const correctas = Object.entries(respuestas).filter(([i, r]) => preguntas[+i]?.correcta === r).length;
  const total = preguntas.length;
  const pct = Math.round((correctas / total) * 100);
  const aprobado = correctas >= Math.ceil(total * 0.7);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex w-full h-full overflow-hidden flex-col md:flex-row"
    >
      {/* Score panel */}
      <div className="md:w-96 flex-shrink-0 md:border-r border-slate-800 flex flex-col items-center justify-center p-6 md:p-10 border-b md:border-b-0">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 180, delay: 0.1 }} className="text-5xl md:text-7xl mb-4 md:mb-6">
          {aprobado ? "🎉" : "📚"}
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={`text-3xl md:text-4xl font-black mb-2 ${aprobado ? "text-emerald-400" : "text-red-400"}`}>
          {aprobado ? "¡Aprobaste!" : "No aprobaste"}
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-slate-500 text-center text-sm mb-5 md:mb-8 leading-relaxed">
          {aprobado ? "Excelente. Estás listo para el examen real." : "Sigue practicando, ya casi lo logras."}
        </motion.p>

        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}
          className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 flex flex-col items-center justify-center mb-5 md:mb-8 ${
            aprobado ? "border-emerald-500 shadow-emerald-500/20" : "border-red-500 shadow-red-500/20"
          } shadow-2xl`}>
          <span className="text-4xl md:text-5xl font-black text-white">{pct}%</span>
          <span className="text-xs md:text-sm text-slate-500 mt-1">{correctas} / {total}</span>
        </motion.div>

        <div className="flex gap-6 md:gap-8 mb-5 md:mb-8">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-black text-emerald-400">{correctas}</div>
            <div className="text-xs text-slate-500 mt-1">Correctas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-black text-red-400">{total - correctas}</div>
            <div className="text-xs text-slate-500 mt-1">Incorrectas</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs md:max-w-none">
          <button onClick={() => iniciar(modo)}
            className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/20">
            Intentar de nuevo
          </button>
          <button onClick={reiniciar}
            className="w-full border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 font-semibold py-3.5 rounded-2xl transition-all">
            Cambiar modo
          </button>
        </div>
      </div>

      {/* Revisión */}
      <div className="flex-1 overflow-y-auto flex justify-center px-4 md:px-16 py-6 md:py-10">
        <div className="w-full max-w-4xl">
          <h3 className="text-2xl md:text-3xl font-black text-white mb-5 md:mb-8">Revisión de respuestas</h3>
          <div className="space-y-4 md:space-y-6">
            {preguntas.map((p, i) => {
              const ok = respuestas[i] === p.correcta;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`rounded-2xl border ${ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}
                >
                  <div className="px-4 md:px-8 pt-5 md:pt-8 pb-4 md:pb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-sm font-bold uppercase tracking-widest ${ok ? "text-emerald-400" : "text-red-400"}`}>
                        {ok ? "✓ Correcta" : "✗ Incorrecta"} · Pregunta {i + 1}
                      </span>
                    </div>
                    <p className="text-white font-black text-lg md:text-2xl leading-snug">{p.pregunta}</p>
                  </div>

                  <div className="flex flex-col gap-2 md:gap-3 px-4 md:px-8 pb-4 md:pb-6">
                    {p.opciones.map((op, j) => {
                      const esCorrecta = j === p.correcta;
                      const esRespuesta = j === respuestas[i];
                      const esIncorrecta = esRespuesta && !esCorrecta;
                      return (
                        <div key={j} className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-2xl border-2 text-sm md:text-lg font-medium ${
                          esCorrecta ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" :
                          esIncorrecta ? "border-red-500 bg-red-500/10 text-red-300" :
                          "border-slate-700/40 bg-slate-800/20 text-slate-500"
                        }`}>
                          <span className={`w-7 h-7 md:w-9 md:h-9 rounded-xl border-2 border-current flex items-center justify-center flex-shrink-0 font-black text-xs md:text-sm ${
                            esCorrecta ? "bg-emerald-500/20" : esIncorrecta ? "bg-red-500/20" : ""
                          }`}>
                            {esCorrecta ? "✓" : esIncorrecta ? "✗" : String.fromCharCode(65 + j)}
                          </span>
                          {op}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mx-4 md:mx-8 mb-5 md:mb-8 px-4 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-800/60 border border-slate-700/40">
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">💡 Explicación</p>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed">{p.explicacion}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { pantalla, modo } = useStore();

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#0a0f1a" }}>
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 15% 50%, #0f2040 0%, transparent 55%), radial-gradient(ellipse at 85% 10%, #0d1f3c 0%, transparent 50%)",
      }} />
      <div className="relative z-10 flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {pantalla === "inicio" && <Inicio key="inicio" />}
          {pantalla === "examen" && (
            <motion.div key="examen" className="flex w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {modo === "examen" ? <ModoExamen /> : <ModoEstudio />}
            </motion.div>
          )}
          {pantalla === "resultado" && <Resultado key="resultado" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
