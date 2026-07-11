import React, { useState, useRef, useEffect, useCallback } from "react";

/* ─────────────── 한글 오토마타 테이블 ─────────────── */
const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
const JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

const JONG_COMBINE = { "ㄱㅅ":"ㄳ","ㄴㅈ":"ㄵ","ㄴㅎ":"ㄶ","ㄹㄱ":"ㄺ","ㄹㅁ":"ㄻ","ㄹㅂ":"ㄼ","ㄹㅅ":"ㄽ","ㄹㅌ":"ㄾ","ㄹㅍ":"ㄿ","ㄹㅎ":"ㅀ","ㅂㅅ":"ㅄ" };
const JONG_SPLIT = { "ㄳ":["ㄱ","ㅅ"],"ㄵ":["ㄴ","ㅈ"],"ㄶ":["ㄴ","ㅎ"],"ㄺ":["ㄹ","ㄱ"],"ㄻ":["ㄹ","ㅁ"],"ㄼ":["ㄹ","ㅂ"],"ㄽ":["ㄹ","ㅅ"],"ㄾ":["ㄹ","ㅌ"],"ㄿ":["ㄹ","ㅍ"],"ㅀ":["ㄹ","ㅎ"],"ㅄ":["ㅂ","ㅅ"] };
const JUNG_COMBINE = { "ㅗㅏ":"ㅘ","ㅗㅐ":"ㅙ","ㅗㅣ":"ㅚ","ㅜㅓ":"ㅝ","ㅜㅔ":"ㅞ","ㅜㅣ":"ㅟ","ㅡㅣ":"ㅢ" };
const JUNG_SPLIT = { "ㅘ":["ㅗ","ㅏ"],"ㅙ":["ㅗ","ㅐ"],"ㅚ":["ㅗ","ㅣ"],"ㅝ":["ㅜ","ㅓ"],"ㅞ":["ㅜ","ㅔ"],"ㅟ":["ㅜ","ㅣ"],"ㅢ":["ㅡ","ㅣ"] };

const isVowel = (c) => JUNG.includes(c);

/* ─────────────── 사보타주: 키보드상 인접 자모 ─────────────── */
const NEIGHBORS = {
  ㅂ:["ㅈ","ㅁ"], ㅈ:["ㅂ","ㄷ","ㄴ"], ㄷ:["ㅈ","ㄱ","ㅇ"], ㄱ:["ㄷ","ㅅ","ㄹ"], ㅅ:["ㄱ","ㅎ"],
  ㅁ:["ㄴ","ㅋ","ㅂ"], ㄴ:["ㅁ","ㅇ","ㅌ"], ㅇ:["ㄴ","ㄹ","ㅊ"], ㄹ:["ㅇ","ㅎ","ㅍ"], ㅎ:["ㄹ","ㅅ"],
  ㅋ:["ㅌ","ㅁ"], ㅌ:["ㅋ","ㅊ","ㄴ"], ㅊ:["ㅌ","ㅍ","ㅇ"], ㅍ:["ㅊ","ㄹ"],
  ㅛ:["ㅕ"], ㅕ:["ㅛ","ㅑ","ㅗ"], ㅑ:["ㅕ","ㅐ","ㅓ"], ㅐ:["ㅑ","ㅔ","ㅏ"], ㅔ:["ㅐ","ㅣ"],
  ㅗ:["ㅓ","ㅕ","ㅠ"], ㅓ:["ㅗ","ㅏ","ㅜ"], ㅏ:["ㅓ","ㅣ","ㅡ"], ㅣ:["ㅏ","ㅔ","ㅡ"],
  ㅠ:["ㅜ","ㅗ"], ㅜ:["ㅠ","ㅡ","ㅓ"], ㅡ:["ㅜ","ㅣ","ㅏ"],
};
const SABOTAGE_RATE = 0.38;

function sabotage(jamo) {
  const n = NEIGHBORS[jamo];
  if (!n || Math.random() > SABOTAGE_RATE) return jamo;
  return n[Math.floor(Math.random() * n.length)];
}

/* ─────────────── 오토마타 ─────────────── */
const EMPTY = { cho: null, jung: null, jong: 0 };

function renderBuf(b) {
  if (b.cho !== null && b.jung !== null)
    return String.fromCharCode(0xac00 + b.cho * 588 + b.jung * 28 + b.jong);
  if (b.cho !== null) return CHO[b.cho];
  if (b.jung !== null) return JUNG[b.jung];
  return "";
}

/** 자모 하나를 넣고 {text, buf} 반환 */
function pushJamo(text, buf, jamo) {
  const flush = (b) => text + renderBuf(b);

  if (isVowel(jamo)) {
    const vi = JUNG.indexOf(jamo);
    if (buf.cho === null && buf.jung === null) return { text, buf: { ...EMPTY, jung: vi } };
    if (buf.cho !== null && buf.jung === null) return { text, buf: { ...buf, jung: vi } };
    if (buf.jong === 0) {
      const merged = JUNG_COMBINE[JUNG[buf.jung] + jamo];
      if (merged) return { text, buf: { ...buf, jung: JUNG.indexOf(merged) } };
      return { text: flush(buf), buf: { ...EMPTY, jung: vi } };
    }
    // 받침을 다음 글자 초성으로 넘김
    const jchar = JONG[buf.jong];
    const split = JONG_SPLIT[jchar];
    const keep = split ? JONG.indexOf(split[0]) : 0;
    const move = split ? split[1] : jchar;
    return {
      text: flush({ ...buf, jong: keep }),
      buf: { cho: CHO.indexOf(move), jung: vi, jong: 0 },
    };
  }

  const ci = CHO.indexOf(jamo);
  if (buf.cho === null && buf.jung === null) return { text, buf: { ...EMPTY, cho: ci } };
  if (buf.jung === null) return { text: flush(buf), buf: { ...EMPTY, cho: ci } };
  if (buf.cho === null) return { text: flush(buf), buf: { ...EMPTY, cho: ci } };
  if (buf.jong === 0) {
    const ji = JONG.indexOf(jamo);
    if (ji > 0) return { text, buf: { ...buf, jong: ji } };
    return { text: flush(buf), buf: { ...EMPTY, cho: ci } };
  }
  const merged = JONG_COMBINE[JONG[buf.jong] + jamo];
  if (merged) return { text, buf: { ...buf, jong: JONG.indexOf(merged) } };
  return { text: flush(buf), buf: { ...EMPTY, cho: ci } };
}

function backspace(text, buf) {
  if (buf.jong !== 0) {
    const split = JONG_SPLIT[JONG[buf.jong]];
    return { text, buf: { ...buf, jong: split ? JONG.indexOf(split[0]) : 0 } };
  }
  if (buf.jung !== null) {
    const split = JUNG_SPLIT[JUNG[buf.jung]];
    return { text, buf: { ...buf, jung: split ? JUNG.indexOf(split[0]) : null } };
  }
  if (buf.cho !== null) return { text, buf: { ...EMPTY } };
  return { text: text.slice(0, -1), buf: { ...EMPTY } };
}

/* ─────────────── 더미 답장 ─────────────── */
const REPLIES = [
  "ㅇㅇ?", "뭐라고", "??", "한국어로 말해줄래", "지금 취했어?",
  "폰 고장났나봐", "무슨 소린지 하나도 모르겠는데", "ㅋㅋㅋㅋㅋㅋㅋ 뭐야",
  "야 진지하게 병원 가봐", "그만해", "번역기 돌려도 안 나와",
];

const KEYS = [
  ["ㅂ","ㅈ","ㄷ","ㄱ","ㅅ","ㅛ","ㅕ","ㅑ","ㅐ","ㅔ"],
  ["ㅁ","ㄴ","ㅇ","ㄹ","ㅎ","ㅗ","ㅓ","ㅏ","ㅣ"],
  ["ㅋ","ㅌ","ㅊ","ㅍ","ㅠ","ㅜ","ㅡ"],
];

const DODGE_LIMIT = 6;

/* ─────────────── 물리 키보드(두벌식) 매핑 ─────────────── */
const PHYS_KEY_MAP = {
  KeyQ: "ㅂ", KeyW: "ㅈ", KeyE: "ㄷ", KeyR: "ㄱ", KeyT: "ㅅ",
  KeyY: "ㅛ", KeyU: "ㅕ", KeyI: "ㅑ", KeyO: "ㅐ", KeyP: "ㅔ",
  KeyA: "ㅁ", KeyS: "ㄴ", KeyD: "ㅇ", KeyF: "ㄹ", KeyG: "ㅎ",
  KeyH: "ㅗ", KeyJ: "ㅓ", KeyK: "ㅏ", KeyL: "ㅣ",
  KeyZ: "ㅋ", KeyX: "ㅌ", KeyC: "ㅊ", KeyV: "ㅍ", KeyB: "ㅠ",
  KeyN: "ㅜ", KeyM: "ㅡ",
};
const PHYS_KEY_MAP_SHIFT = {
  KeyQ: "ㅃ", KeyW: "ㅉ", KeyE: "ㄸ", KeyR: "ㄲ", KeyT: "ㅆ",
  KeyO: "ㅒ", KeyP: "ㅖ",
};

export default function CursedChat() {
  const [msgs, setMsgs] = useState([{ me: false, t: "왔어? 어디쯤이야" }]);
  const [text, setText] = useState("");
  const [buf, setBuf] = useState(EMPTY);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dodges, setDodges] = useState(0);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  const btnRef = useRef(null);
  const screenRef = useRef(null);
  const replyIdx = useRef(0);

  const display = text + renderBuf(buf);
  const caught = dodges >= DODGE_LIMIT;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [msgs, typing]);

  /* 실제 키보드 입력 */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;

      if (e.code === "Backspace") {
        e.preventDefault();
        del();
        return;
      }
      if (e.code === "Enter") {
        e.preventDefault();
        send();
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setText((t) => t + " ");
        setBuf(EMPTY);
        return;
      }
      const jamo = e.shiftKey ? PHYS_KEY_MAP_SHIFT[e.code] : PHYS_KEY_MAP[e.code];
      if (jamo) {
        e.preventDefault();
        tap(jamo);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [text, buf, display]);

  const tap = (jamo) => {
    const r = pushJamo(text, buf, sabotage(jamo));
    setText(r.text);
    setBuf(r.buf);
  };

  const del = () => {
    const r = backspace(text, buf);
    setText(r.text);
    setBuf(r.buf);
  };

  const send = () => {
    if (!display.trim()) return;
    setMsgs((m) => [...m, { me: true, t: display }]);
    setText("");
    setBuf(EMPTY);
    setPos({ x: 0, y: 0 });
    setDodges(0);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { me: false, t: REPLIES[replyIdx.current++ % REPLIES.length] }]);
    }, 1100);
  };

  /* 도망가는 전송 버튼 */
  const dodge = useCallback(
    (e) => {
      if (caught || !display.trim()) return;
      const b = btnRef.current?.getBoundingClientRect();
      const s = screenRef.current?.getBoundingClientRect();
      if (!b || !s) return;
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      const dx = cx - e.clientX;
      const dy = cy - e.clientY;
      const dist = Math.hypot(dx, dy);
      if (dist > 70) return;

      const ang = Math.atan2(dy, dx) || Math.random() * 6.28;
      const jump = 90 - dodges * 10;
      let nx = pos.x + Math.cos(ang) * jump;
      let ny = pos.y + Math.sin(ang) * jump;
      // 폰 화면 밖으로 못 나가게
      const maxX = s.right - b.right + pos.x - 8;
      const minX = s.left - b.left + pos.x + 8;
      const maxY = s.bottom - b.bottom + pos.y - 8;
      const minY = s.top - b.top + pos.y + 8;
      nx = Math.max(minX, Math.min(maxX, nx));
      ny = Math.max(minY, Math.min(maxY, ny));
      setPos({ x: nx, y: ny });
      setDodges((d) => d + 1);
    },
    [pos, dodges, caught, display]
  );

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center gap-6 py-10"
      style={{ background: "radial-gradient(circle at 50% 0%, #23202b 0%, #131118 60%)" }}
      onPointerMove={dodge}
    >
      <h1 className="text-neutral-400 text-sm tracking-[0.3em] uppercase">저주받은 메신저</h1>

      {/* 폰 목업 */}
      <div className="relative rounded-[42px] p-3 shadow-2xl" style={{ background: "#2b2833", boxShadow: "0 0 0 2px #4a4557, 0 30px 60px rgba(0,0,0,.6)" }}>
        <div
          ref={screenRef}
          className="relative w-[330px] h-[640px] rounded-[32px] overflow-hidden flex flex-col"
          style={{ background: "#b2c7d9" }}
        >
          {/* 상단바 */}
          <div className="h-11 shrink-0 flex items-center justify-center relative" style={{ background: "#9bb0c2" }}>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-[#2b2833]" />
            <span className="mt-3 text-xs font-semibold text-slate-800">엄마</span>
          </div>

          {/* 대화 */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[75%] px-3 py-2 rounded-2xl text-[15px] leading-snug break-all shadow-sm"
                  style={
                    m.me
                      ? { background: "#fae100", color: "#191600" }
                      : { background: "#fff", color: "#191919" }
                  }
                >
                  {m.t}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl bg-white text-neutral-400 text-sm">···</div>
              </div>
            )}
          </div>

          {/* 입력창 */}
          <div className="shrink-0 px-2 py-2 flex items-end gap-2" style={{ background: "#f7f7f8" }}>
            <div className="flex-1 min-h-[38px] max-h-24 overflow-y-auto bg-white rounded-2xl px-3 py-2 text-[15px] break-all border border-neutral-200">
              {display ? (
                <>
                  {text}
                  <span className="bg-yellow-200/70 rounded">{renderBuf(buf)}</span>
                </>
              ) : (
                <span className="text-neutral-400">메시지 입력</span>
              )}
            </div>
            <button
              ref={btnRef}
              onClick={send}
              onPointerDown={dodge}
              disabled={!display.trim()}
              className="shrink-0 w-[38px] h-[38px] rounded-full text-sm font-bold disabled:opacity-40 z-20"
              style={{
                background: caught ? "#fae100" : "#e6e6e8",
                color: "#191919",
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                transition: "transform 140ms cubic-bezier(.34,1.56,.64,1)",
              }}
            >
              ↑
            </button>
          </div>

          {/* 자체 키보드 */}
          <div className="shrink-0 px-1.5 pb-3 pt-2 select-none" style={{ background: "#d1d3d9" }}>
            {KEYS.map((row, ri) => (
              <div key={ri} className="flex justify-center gap-1 mb-1">
                {row.map((k) => (
                  <button
                    key={k}
                    onClick={() => tap(k)}
                    className="flex-1 max-w-[30px] h-10 rounded-md bg-white text-[15px] font-medium shadow-sm active:bg-neutral-300 active:scale-95 transition"
                  >
                    {k}
                  </button>
                ))}
              </div>
            ))}
            <div className="flex justify-center gap-1">
              <button
                onClick={() => { setText((t) => t + " "); setBuf(EMPTY); }}
                className="flex-[5] h-10 rounded-md bg-white text-xs text-neutral-500 shadow-sm active:bg-neutral-300"
              >
                스페이스
              </button>
              <button
                onClick={del}
                className="flex-[2] h-10 rounded-md bg-[#adb3bd] text-white text-sm shadow-sm active:bg-neutral-500"
              >
                ⌫
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-neutral-500 text-xs max-w-[330px] text-center leading-relaxed">
        키를 누르면 {Math.round(SABOTAGE_RATE * 100)}% 확률로 옆 자모가 대신 입력됩니다.
        전송 버튼은 {DODGE_LIMIT}번 피한 뒤 포기합니다.
      </p>
    </div>
  );
}
