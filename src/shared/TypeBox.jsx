import React, { useEffect, useRef, useState } from 'react';

export default function TypeBox({ content, mode = 'text', limitSec = 60, onFinish, onProgress }) {
  // pos = nombre de caractères CORRECTS déjà validés
  const [pos, setPos] = useState(0);
  const [hasError, setHasError] = useState(false); // erreur active à corriger (Backspace obligatoire)
  const [errors, setErrors] = useState(0);
  const [typed, setTyped] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);

  const inputRef = useRef(null);
  const rafRef = useRef(null);

  // Timer + progress
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
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, finished, mode, limitSec, pos, errors, hasError, onProgress]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const onBeforeInput = (e) => {
    const allowed = ['insertText', 'deleteContentBackward'];
    if (!allowed.includes(e.inputType)) e.preventDefault();
  };

  const onKeyDown = (e) => {
    if (finished) return;

    if (e.key === 'Backspace') {
      setTyped(t => t + 1);
      if (hasError) {
        // efface l’erreur courante (caret reste au même endroit)
        setHasError(false);
      } else if (pos > 0) {
        // recule d’un caractère correct
        setPos(p => p - 1);
      }
      e.preventDefault();
      return;
    }

    // On ignore toute autre touche spéciale
    if (e.key.length !== 1) return;

    if (!startedAt) setStartedAt(Date.now());

    // Tant qu’il y a une erreur active, on ignore toute frappe sauf Backspace
    if (hasError) {
      e.preventDefault();
      return;
    }

    // frappe normale (pas d’erreur active)
    setTyped(t => t + 1);

    const expected = content[pos] ?? '';
    const ms = startedAt ? (Date.now() - startedAt) : 0;

    if (e.key === expected) {
      const next = pos + 1;
      setPos(next);
      onProgress && onProgress(next, errors, ms);
      if (mode === 'text' && next >= content.length) {
        setFinished(true);
        onFinish && onFinish(stats(ms));
      }
    } else {
      // mauvaise touche : on marque une erreur et on BLOQUE jusqu’au Backspace
      setHasError(true);
      setErrors(er => er + 1);
      onProgress && onProgress(pos, errors + 1, ms);
    }

    e.preventDefault();
  };

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
    <div className="mono" onClick={() => inputRef.current?.focus()}>
      <p style={{ lineHeight: 1.8, fontSize: 20 }}>
        {content.split('').map((ch, i) => {
          let cls = '';
          if (i < pos) cls = 'ok';
          else if (i === pos) cls = hasError ? 'err caret' : 'caret';
          return <span key={i} className={cls}>{ch}</span>;
        })}
      </p>

      <input
        ref={inputRef}
        onKeyDown={onKeyDown}
        onBeforeInput={onBeforeInput}
        onPaste={e => e.preventDefault()}
        onDrop={e => e.preventDefault()}
        autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        style={{ opacity: 0, position: 'absolute' }}
      />

      <div style={{ marginTop: 12 }}>
        <strong>WPM:</strong> {wpm} • <strong>Précision:</strong> {(acc * 100).toFixed(1)}% • <strong>Frappes:</strong> {typed} • <strong>Temps:</strong> {(elapsed/1000).toFixed(1)}s
      </div>

      {finished && (
        <div style={{ marginTop: 8 }}>
          ✅ Terminé — <button className="btn" onClick={() => window.location.reload()}>Rejouer</button>
        </div>
      )}
    </div>
  );
}
