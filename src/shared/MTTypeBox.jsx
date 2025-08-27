import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

export default function MTTypeBox({ content, mode = 'time', limitSec = 60, onFinish, onProgress }) {
  const [pos, setPos] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errors, setErrors] = useState(0);
  const [typed, setTyped] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [focused, setFocused] = useState(false);

  const viewportRef = useRef(null);
  const measureRef = useRef(null);
  const [cols, setCols] = useState(60);

  // --- RAF timer
  const rafRef = useRef(null);
  useEffect(() => {
    if (!startedAt || finished) return;
    const tick = () => {
      const ms = Date.now() - startedAt;
      setElapsed(ms);
      onProgress && onProgress(pos, errors + (hasError ? 1 : 0), ms);
      if (mode === 'time' && ms >= limitSec * 1000) {
        setFinished(true);
        onFinish && onFinish(stats(ms));
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [startedAt, finished, mode, limitSec, pos, errors, hasError, onProgress]);

  // --- Normalisation robuste (source et saisie)
  const normalizeString = (s) => {
    if (!s) return '';
    return s
      // unifier retours
      .replace(/\r\n?/g, '\n')
      // espaces insécables et fines -> espace normal
      .replace(/[\u00A0\u2007\u202F]/g, ' ')
      // guillemets/apostrophes “ ” ‘ ’ ʼ ′ -> versions ASCII
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019\u02BC\u2032]/g, "'")
      // accents morts transformés en caractère équivalent si jamais composés
      .normalize('NFC');
  };

  const src = useMemo(() => normalizeString(content), [content]);

  // ---- tokenisation (mots + espaces) basée sur src
  const tokens = useMemo(() => {
    const parts = src.split(' ');
    const arr = [];
    parts.forEach((w, i) => {
      arr.push(w);
      if (i < parts.length - 1) arr.push(' ');
    });
    return arr;
  }, [src]);

  // ---- calcul des lignes en fonction de `cols`
  const lines = useMemo(() => {
    const out = [];
    let idx = 0;
    let currentLen = 0;
    let lineStart = 0;

    const flushLine = () => {
      out.push({ start: lineStart, end: idx });
      lineStart = idx;
      currentLen = 0;
    };

    for (const t of tokens) {
      const len = t.length;

      if (len > cols && currentLen === 0) {
        let remaining = len;
        while (remaining > cols) {
          idx += cols;
          flushLine();
          remaining -= cols;
        }
        idx += remaining;
        currentLen = remaining;
        continue;
      }

      if (currentLen === 0) {
        idx += len;
        currentLen = len;
      } else if (currentLen + len <= cols) {
        idx += len;
        currentLen += len;
      } else {
        flushLine();
        idx += len;
        currentLen = len;
      }
    }
    if (idx > lineStart) out.push({ start: lineStart, end: idx });
    return out;
  }, [tokens, cols]);

  const currentLine = useMemo(() => {
    let i = 0;
    while (i < lines.length && pos >= lines[i].end) i++;
    return Math.min(i, Math.max(0, lines.length - 1));
  }, [pos, lines]);

  const visibleLines = useMemo(() => {
    const start = currentLine;
    const end = Math.min(lines.length, currentLine + 3);
    return lines.slice(start, end);
  }, [lines, currentLine]);

  // ---- mesure fiable des colonnes
  useLayoutEffect(() => {
    const measure = () => {
      const box = viewportRef.current;
      const span = measureRef.current;
      if (!box || !span) return;

      span.textContent = 'MMMMMMMMMM';

      const cs = getComputedStyle(box);
      const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const innerWidth = Math.max(0, (box.clientWidth || 0) - padX);

      const w10 = span.getBoundingClientRect().width || 80;
      const charW = w10 / 10;

      const c = Math.max(10, Math.floor(innerWidth / charW) - 1);
      setCols(c);

      span.textContent = '';
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // ---- focus input
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const ensureStarted = () => {
    if (!startedAt) setStartedAt(Date.now());
  };

  // ---- helpers de saisie (un seul endroit)
  const commitProgress = (nextPos, nextErrors, ms) => {
    onProgress && onProgress(nextPos, nextErrors, ms);
  };

  const typeChar = (rawCh) => {
    if (finished) return;

    // Si une erreur est active, on force Backspace d'abord (comportement inchangé)
    if (hasError) return;

    const ch = normalizeString(rawCh);
    if (!startedAt) setStartedAt(Date.now());
    setTyped((t) => t + 1);

    const expected = src[pos] ?? '';
    const ms = startedAt ? (Date.now() - startedAt) : 0;

    if (ch === expected) {
      const next = pos + 1;
      setPos(next);
      commitProgress(next, errors, ms);
      if (mode === 'text' && next >= src.length) {
        setFinished(true);
        onFinish && onFinish(stats(ms));
      }
    } else {
      setHasError(true);
      setErrors((er) => {
        const val = er + 1;
        commitProgress(pos, val, ms);
        return val;
      });
    }
  };

  const handleBackspace = () => {
    if (finished) return;
    setTyped((t) => t + 1);
    if (hasError) setHasError(false);
    else if (pos > 0) setPos((p) => p - 1);
  };

  // ---- onBeforeInput : source de vérité
  const onBeforeInput = (e) => {
    const it = e.inputType;
    // On gère tout ici
    if (it === 'insertText' || it === 'insertCompositionText') {
      e.preventDefault();
      ensureStarted();
      const data = e.data ?? '';
      // Peut contenir plusieurs caractères (ex. collage ou saisie composition)
      for (const ch of data) typeChar(ch);
      return;
    }

    if (it === 'deleteContentBackward') {
      e.preventDefault();
      handleBackspace();
      return;
    }

    // Bloquer toute autre action (coller, supprimer mot, etc.)
    e.preventDefault();
  };

  // ---- Fallback onKeyDown (utile sur certains cas Firefox / IME)
  const onKeyDown = (e) => {
    if (finished) return;

    // Ne pas double-traiter la composition
    if (e.isComposing) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
      return;
    }

    // Si beforeinput ne passe pas et que c'est un caractère imprimable simple
    if (e.key.length === 1) {
      e.preventDefault();
      ensureStarted();
      typeChar(e.key);
      return;
    }
  };

  // ---- stats
  const minutes = Math.max(0.001, elapsed / 60000);
  const correct = pos;
  const wpm = Math.round((correct / 5) / minutes);
  const acc = typed > 0 ? Math.max(0, Math.min(1, correct / typed)) : 1;

  const stats = (msOverride) => ({
    wpm, acc, typed, correct,
    errors: errors + (hasError ? 1 : 0),
    elapsed: msOverride ?? elapsed,
    finishedBy: mode === 'text' ? 'text' : 'time'
  });

  return (
    <div
      className="mono"
      tabIndex={-1}
      onMouseDown={(e) => { e.preventDefault(); inputRef.current?.focus(); }}
      onClick={() => inputRef.current?.focus()}
    >
      <style>{`
        .caret { position: relative; }
        .caret.focused::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 100%;
          height: 2px;
          background: #e2b714; /* jaune comme demandé précédemment */
          animation: blink 1s steps(1) infinite;
        }
        @keyframes blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }
        .words.active { box-shadow: 0 0 0 2px #0002; }
      `}</style>

      <div className="hud" style={{ marginBottom: 8, justifyContent: 'center' }}>
        <span>MPM <span className="v">{wpm}</span></span>
        <span>Précision <span className="v">{(acc * 100).toFixed(1)}%</span></span>
        <span>Temps <span className="v">{(elapsed / 1000).toFixed(1)}s</span></span>
      </div>

      <div
        ref={viewportRef}
        className={`words ${focused ? 'active' : ''}`}
        style={{
          display: 'grid',
          gridAutoRows: '1.6em',
          gap: 0,
          overflow: 'hidden',
          height: 'calc(1.6em * 3)',
          textAlign: 'center',
          border: '2px solid transparent',
          borderRadius: '8px',
          transition: 'border 0.2s ease, box-shadow 0.2s ease',
          padding: '0 12px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
        }}
      >
        {/* span de mesure (invisible) */}
        <span
          ref={measureRef}
          className="mono"
          style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'pre', pointerEvents: 'none' }}
        />

        {visibleLines.map((ln) => (
          <div key={ln.start} className="line" style={{ whiteSpace: 'pre', height: '1.6em', overflow: 'hidden' }}>
            {Array.from({ length: ln.end - ln.start }, (_, k) => {
              const i = ln.start + k;
              let cls = '';
              if (i < pos) cls = 'ok';
              else if (i === pos) cls = hasError ? 'err caret' : 'caret';
              if (cls.includes('caret') && focused) cls += ' focused';
              const ch = src[i] ?? '';
              return (
                <span key={i} className={cls}>
                  {ch === ' ' ? <span className="space"> </span> : ch}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        onKeyDown={onKeyDown}
        onBeforeInput={onBeforeInput}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        // Input caché mais focusable
        style={{
          opacity: 0,
          position: 'absolute',
          width: 0,
          height: 0,
          pointerEvents: 'none',
        }}
      />

      {finished && (
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          ✅ Terminé — <button className="btn" onClick={() => window.location.reload()}>Rejouer</button>
        </div>
      )}
    </div>
  );
}
