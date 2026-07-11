import React, { useState, useRef, useEffect, useCallback } from "react";

/* ─────────────── 한글 오토마타 테이블 ─────────────── */
const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
const JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

const JONG_COMBINE = { "ㄱㅅ":"ㄳ","ㄴㅈ":"ㄵ","ㄴㅎ":"ㄶ","ㄹㄱ":"ㄺ","ㄹㅁ":"ㄻ","ㄹㅂ":"ㄼ","ㄹㅅ":"ㄽ","ㄹㅌ":"ㄾ","ㄹㅍ":"ㄿ","ㄹㅎ":"ㅀ","ㅂㅅ":"ㅄ" };
const JONG_SPLIT   = { "ㄳ":["ㄱ","ㅅ"],"ㄵ":["ㄴ","ㅈ"],"ㄶ":["ㄴ","ㅎ"],"ㄺ":["ㄹ","ㄱ"],"ㄻ":["ㄹ","ㅁ"],"ㄼ":["ㄹ","ㅂ"],"ㄽ":["ㄹ","ㅅ"],"ㄾ":["ㄹ","ㅌ"],"ㄿ":["ㄹ","ㅍ"],"ㅀ":["ㄹ","ㅎ"],"ㅄ":["ㅂ","ㅅ"] };
const JUNG_COMBINE = { "ㅗㅏ":"ㅘ","ㅗㅐ":"ㅙ","ㅗㅣ":"ㅚ","ㅜㅓ":"ㅝ","ㅜㅔ":"ㅞ","ㅜㅣ":"ㅟ","ㅡㅣ":"ㅢ" };
const JUNG_SPLIT   = { "ㅘ":["ㅗ","ㅏ"],"ㅙ":["ㅗ","ㅐ"],"ㅚ":["ㅗ","ㅣ"],"ㅝ":["ㅜ","ㅓ"],"ㅞ":["ㅜ","ㅔ"],"ㅟ":["ㅜ","ㅣ"],"ㅢ":["ㅡ","ㅣ"] };

const isVowel = (c) => JUNG.includes(c);

/* ── 물리 키 → 자모 (두벌식). e.code를 쓰므로 한/영 상태 무관 ── */
const LAYOUT = {
  KeyQ:["ㅂ","ㅃ"], KeyW:["ㅈ","ㅉ"], KeyE:["ㄷ","ㄸ"], KeyR:["ㄱ","ㄲ"], KeyT:["ㅅ","ㅆ"],
  KeyY:["ㅛ","ㅛ"], KeyU:["ㅕ","ㅕ"], KeyI:["ㅑ","ㅑ"], KeyO:["ㅐ","ㅒ"], KeyP:["ㅔ","ㅖ"],
  KeyA:["ㅁ","ㅁ"], KeyS:["ㄴ","ㄴ"], KeyD:["ㅇ","ㅇ"], KeyF:["ㄹ","ㄹ"], KeyG:["ㅎ","ㅎ"],
  KeyH:["ㅗ","ㅗ"], KeyJ:["ㅓ","ㅓ"], KeyK:["ㅏ","ㅏ"], KeyL:["ㅣ","ㅣ"],
  KeyZ:["ㅋ","ㅋ"], KeyX:["ㅌ","ㅌ"], KeyC:["ㅊ","ㅊ"], KeyV:["ㅍ","ㅍ"],
  KeyB:["ㅠ","ㅠ"], KeyN:["ㅜ","ㅜ"], KeyM:["ㅡ","ㅡ"],
};
const ROWS = [
  ["KeyQ","KeyW","KeyE","KeyR","KeyT","KeyY","KeyU","KeyI","KeyO","KeyP"],
  ["KeyA","KeyS","KeyD","KeyF","KeyG","KeyH","KeyJ","KeyK","KeyL"],
  ["KeyZ","KeyX","KeyC","KeyV","KeyB","KeyN","KeyM"],
];

/* ─────────────── 사보타주 ─────────────── */
const NEIGHBORS = {
  ㅂ:["ㅈ","ㅁ"], ㅈ:["ㅂ","ㄷ","ㄴ"], ㄷ:["ㅈ","ㄱ","ㅇ"], ㄱ:["ㄷ","ㅅ","ㄹ"], ㅅ:["ㄱ","ㅎ"],
  ㅁ:["ㄴ","ㅋ","ㅂ"], ㄴ:["ㅁ","ㅇ","ㅌ"], ㅇ:["ㄴ","ㄹ","ㅊ"], ㄹ:["ㅇ","ㅎ","ㅍ"], ㅎ:["ㄹ","ㅅ"],
  ㅋ:["ㅌ","ㅁ"], ㅌ:["ㅋ","ㅊ","ㄴ"], ㅊ:["ㅌ","ㅍ","ㅇ"], ㅍ:["ㅊ","ㄹ"],
  ㅛ:["ㅕ"], ㅕ:["ㅛ","ㅑ","ㅗ"], ㅑ:["ㅕ","ㅐ","ㅓ"], ㅐ:["ㅑ","ㅔ","ㅏ"], ㅔ:["ㅐ","ㅣ"],
  ㅗ:["ㅓ","ㅕ","ㅠ"], ㅓ:["ㅗ","ㅏ","ㅜ"], ㅏ:["ㅓ","ㅣ","ㅡ"], ㅣ:["ㅏ","ㅔ","ㅡ"],
  ㅠ:["ㅜ","ㅗ"], ㅜ:["ㅠ","ㅡ","ㅓ"], ㅡ:["ㅜ","ㅣ","ㅏ"],
};

/* ★ 워밍업 곡선 — 처음 5타는 멀쩡하게 나오다가 서서히 무너진다.
   처음부터 망가지면 사람들이 웃고 넘어간다. 희망을 줘야 화가 난다. */
const GRACE = 5;
const RATE_MAX = 0.55;
const rateAt = (n) => (n < GRACE ? 0 : Math.min(RATE_MAX, (n - GRACE) * 0.045));

function sabotage(jamo, keystrokes) {
  const n = NEIGHBORS[jamo];
  if (!n || Math.random() > rateAt(keystrokes)) return jamo;
  return n[Math.floor(Math.random() * n.length)];
}

/* ★ 백스페이스 배신 — 지우려는데 가끔 하나 더 붙는다 */
const BETRAY_RATE = 0.25;
const ALL_JAMO = [...CHO.slice(0, 12), ...JUNG.slice(0, 12)];
const randomJamo = () => ALL_JAMO[Math.floor(Math.random() * ALL_JAMO.length)];

/* ★ 전송 실패 — 그 고생을 하고 눌렀는데 안 간다 */
const SEND_FAIL_RATE = 0.3;

const DODGE_LIMIT = 6;

const SORRY = [
  "죄송합니다 😊", "미안 ><", "일부러 그런 거 아니야", "손이 미끄러졌어요",
  "최선을 다했어요", "저도 마음이 아파요", "다음엔 잘할게요 (안 함)",
];

/* ─────────────── 오토마타 ─────────────── */
const EMPTY = { cho: null, jung: null, jong: 0 };

function renderBuf(b) {
  if (b.cho !== null && b.jung !== null)
    return String.fromCharCode(0xac00 + b.cho * 588 + b.jung * 28 + b.jong);
  if (b.cho !== null) return CHO[b.cho];
  if (b.jung !== null) return JUNG[b.jung];
  return "";
}

function pushJamo(text, buf, jamo) {
  const flush = (b) => text + renderBuf(b);

  if (isVowel(jamo)) {
    const vi = JUNG.indexOf(jamo);
    if (buf.cho === null && buf.jung === null) return { text, buf: { ...EMPTY, jung: vi } };
    if (buf.cho !== null && buf.jung === null) return { text, buf: { ...buf, jung: vi } };
    if (buf.jong === 0) {
      const m = JUNG_COMBINE[JUNG[buf.jung] + jamo];
      if (m) return { text, buf: { ...buf, jung: JUNG.indexOf(m) } };
      return { text: flush(buf), buf: { ...EMPTY, jung: vi } };
    }
    const jchar = JONG[buf.jong];
    const sp = JONG_SPLIT[jchar];
    const keep = sp ? JONG.indexOf(sp[0]) : 0;
    const move = sp ? sp[1] : jchar;
    return { text: flush({ ...buf, jong: keep }), buf: { cho: CHO.indexOf(move), jung: vi, jong: 0 } };
  }

  const ci = CHO.indexOf(jamo);
  if (buf.cho === null && buf.jung === null) return { text, buf: { ...EMPTY, cho: ci } };
  if (buf.jung === null || buf.cho === null) return { text: flush(buf), buf: { ...EMPTY, cho: ci } };
  if (buf.jong === 0) {
    const ji = JONG.indexOf(jamo);
    if (ji > 0) return { text, buf: { ...buf, jong: ji } };
    return { text: flush(buf), buf: { ...EMPTY, cho: ci } };
  }
  const m = JONG_COMBINE[JONG[buf.jong] + jamo];
  if (m) return { text, buf: { ...buf, jong: JONG.indexOf(m) } };
  return { text: flush(buf), buf: { ...EMPTY, cho: ci } };
}

function backspace(text, buf) {
  if (buf.jong !== 0) {
    const sp = JONG_SPLIT[JONG[buf.jong]];
    return { text, buf: { ...buf, jong: sp ? JONG.indexOf(sp[0]) : 0 } };
  }
  if (buf.jung !== null) {
    const sp = JUNG_SPLIT[JUNG[buf.jung]];
    return { text, buf: { ...buf, jung: sp ? JUNG.indexOf(sp[0]) : null } };
  }
  if (buf.cho !== null) return { text, buf: { ...EMPTY } };
  return { text: text.slice(0, -1), buf: { ...EMPTY } };
}

/* ─────────────── 더미 대화 (친구) ─────────────── */
const REPLIES = [
  "ㅇㅇ?",
  "뭐라고 친구야",
  "??? 한국어 맞아",
  "너 지금 취했지",
  "폰 고장났나봄 ㅋㅋㅋ",
  "무슨 소린지 하나도 모르겠는데",
  "ㅋㅋㅋㅋㅋㅋㅋㅋ 뭐야 이거",
  "야 진지하게 괜찮냐",
  "번역기 돌려도 안 나와",
  "그냥 전화해",
];

export default function SorryMessenger() {
  const [msgs, setMsgs] = useState([{ me: false, t: "야 내일 몇시에 봐?" }]);
  const [text, setText] = useState("");
  const [buf, setBuf] = useState(EMPTY);
  const [strokes, setStrokes] = useState(0);   // 워밍업 카운터
  const [attempts, setAttempts] = useState(0); // 전송 시도 횟수 (오기 유발)
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dodges, setDodges] = useState(0);
  const [revoked, setRevoked] = useState(false); // 항복 취소 소진 여부
  const [typing, setTyping] = useState(false);
  const [active, setActive] = useState(null);
  const [toast, setToast] = useState("");
  const [shake, setShake] = useState(false);

  const scrollRef = useRef(null);
  const btnRef = useRef(null);
  const screenRef = useRef(null);
  const replyIdx = useRef(0);
  const ref = useRef({});

  const display = text + renderBuf(buf);
  const caught = dodges >= DODGE_LIMIT;
  ref.current = { text, buf, strokes, caught, revoked, display };

  useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }); }, [msgs, typing]);

  const sorry = useCallback((msg) => {
    setToast(msg ?? SORRY[Math.floor(Math.random() * SORRY.length)]);
    setTimeout(() => setToast(""), 1100);
  }, []);

  /* 버튼 튕기기 */
  const jump = useCallback((cursor) => {
    const b = btnRef.current?.getBoundingClientRect();
    const s = screenRef.current?.getBoundingClientRect();
    if (!b || !s) return;
    setPos((p) => {
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const ang = cursor
        ? Math.atan2(cy - cursor.y, cx - cursor.x) || Math.random() * 6.28
        : Math.random() * Math.PI * 2;
      let x = p.x + Math.cos(ang) * 95;
      let y = p.y + Math.sin(ang) * 95;
      x = Math.max(s.left - b.left + p.x + 8, Math.min(s.right - b.right + p.x - 8, x));
      y = Math.max(s.top - b.top + p.y + 8, Math.min(s.bottom - b.bottom + p.y - 8, y));
      return { x, y };
    });
    setDodges((d) => d + 1);
  }, []);

  /* 전송 — 잡아도 30%는 실패한다 */
  const send = useCallback(() => {
    const { text: t, buf: b, caught: c, revoked: rv } = ref.current;
    const full = t + renderBuf(b);
    if (!full.trim()) return;

    // ★ 항복 취소: 노랗게 변해서 잡히는 줄 알았는데 딱 한 번 더 도망감
    if (c && !rv) {
      setRevoked(true);
      setDodges(DODGE_LIMIT - 1);
      jump(null);
      sorry("아 잠깐만");
      return;
    }
    if (!c) return;

    setAttempts((a) => a + 1);

    // ★ 전송 실패: 텍스트는 그대로 남고 버튼은 다시 도망 모드로
    if (Math.random() < SEND_FAIL_RATE) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setDodges(0);
      setRevoked(false);
      setPos({ x: 0, y: 0 });
      sorry("전송 실패. 미안 ><");
      return;
    }

    setMsgs((m) => [...m, { me: true, t: full }]);
    setText(""); setBuf(EMPTY);
    setStrokes(0); setDodges(0); setRevoked(false); setPos({ x: 0, y: 0 });
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { me: false, t: REPLIES[replyIdx.current++ % REPLIES.length] }]);
    }, 1100);
  }, [jump, sorry]);

  /* 물리 키보드 — input 요소가 없어서 OS IME가 개입하지 않음 */
  useEffect(() => {
    const onDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const { text: t, buf: b, strokes: s, caught: c, display: d } = ref.current;

      if (e.code === "Backspace") {
        e.preventDefault();
        setActive("Backspace");
        // ★ 백스페이스 배신
        if (Math.random() < BETRAY_RATE && (t || renderBuf(b))) {
          const r = pushJamo(t, b, randomJamo());
          setText(r.text); setBuf(r.buf);
          sorry("어? 손이 미끄러졌어요");
          return;
        }
        const r = backspace(t, b);
        setText(r.text); setBuf(r.buf);
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setActive("Space");
        setText(t + renderBuf(b) + " ");
        setBuf(EMPTY);
        return;
      }
      if (e.code === "Enter" || e.code === "NumpadEnter") {
        e.preventDefault();
        if (!d.trim()) return;
        if (c) return send();
        jump(null);
        sorry("엔터는 좀... 미안 ><");
        return;
      }
      const map = LAYOUT[e.code];
      if (!map) return;
      e.preventDefault();
      setActive(e.code);
      const r = pushJamo(t, b, sabotage(map[e.shiftKey ? 1 : 0], s));
      setText(r.text); setBuf(r.buf);
      setStrokes(s + 1);
    };
    const onUp = () => setActive(null);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [send, jump, sorry]);

  const onMove = (e) => {
    if (!display.trim() || (caught && revoked)) return;
    if (caught && !revoked) return; // 노란 상태에선 얌전히 기다리는 척
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    if (Math.hypot(cx - e.clientX, cy - e.clientY) > 70) return;
    jump({ x: e.clientX, y: e.clientY });
  };

  const key = (code, label, w) => (
    <div
      key={code}
      className="h-9 rounded-md flex items-center justify-center text-[13px] transition"
      style={{
        width: w ?? 36,
        background: active === code ? "#ffd6e0" : "#2b2833",
        color: active === code ? "#3d1424" : "#8b8697",
        border: "1px solid #3d3949",
      }}
    >
      {label}
    </div>
  );

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center gap-5 py-8"
      style={{ background: "radial-gradient(circle at 50% 0%, #2a2130 0%, #14101a 65%)" }}
      onPointerMove={onMove}
    >
      <div className="text-center">
        <h1 className="text-[#ffd6e0] text-lg font-bold tracking-tight">미안한 메신저</h1>
        <p className="text-neutral-500 text-[11px] mt-0.5">미안하다고는 합니다. 안 고칩니다.</p>
      </div>

      <div
        className="relative rounded-[44px] p-3"
        style={{ background: "#2b2833", boxShadow: "0 0 0 2px #4a4557, 0 30px 60px rgba(0,0,0,.6)" }}
      >
        <div
          ref={screenRef}
          className="relative w-[375px] h-[600px] rounded-[34px] overflow-hidden flex flex-col"
          style={{ background: "#b2c7d9", transform: shake ? "translateX(-4px)" : "none", transition: "transform 60ms" }}
        >
          <div className="h-11 shrink-0 flex items-center justify-center relative" style={{ background: "#9bb0c2" }}>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-[#2b2833]" />
            <span className="mt-3 text-xs font-semibold text-slate-800">지훈</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[75%] px-3 py-2 rounded-2xl text-[15px] leading-snug break-all shadow-sm"
                  style={m.me ? { background: "#fae100", color: "#191600" } : { background: "#fff", color: "#191919" }}
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

          {toast && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/75 text-white text-xs whitespace-nowrap z-30">
              {toast}
            </div>
          )}

          <div className="shrink-0 px-2 py-2 flex items-end gap-2" style={{ background: "#f7f7f8" }}>
            <div className="flex-1 min-h-[38px] max-h-28 overflow-y-auto bg-white rounded-2xl px-3 py-2 text-[15px] break-all border border-neutral-200">
              {display ? (
                <>
                  {text}
                  <span className="bg-yellow-200/70 rounded">{renderBuf(buf)}</span>
                  <span className="inline-block w-px h-[18px] bg-neutral-800 align-middle animate-pulse" />
                </>
              ) : (
                <span className="text-neutral-400">키보드로 입력하세요</span>
              )}
            </div>
            <button
              ref={btnRef}
              onClick={send}
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
        </div>
      </div>

      {/* 실제 키보드 상태 — 누른 키와 화면의 글자가 다른 게 눈에 보여야 개그가 완성됨 */}
      <div className="select-none">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1 mb-1" style={{ paddingLeft: ri * 14 }}>
            {row.map((code) => key(code, LAYOUT[code][0]))}
          </div>
        ))}
        <div className="flex justify-center gap-1">
          {key("Space", "space", 176)}
          {key("Backspace", "⌫", 64)}
        </div>
      </div>

      <p className="text-neutral-500 text-[11px] text-center">
        전송 시도 <span className="text-[#ffd6e0] font-bold">{attempts}</span>회 · 오타율{" "}
        <span className="text-[#ffd6e0] font-bold">{Math.round(rateAt(strokes) * 100)}%</span>
      </p>
    </div>
  );
}
