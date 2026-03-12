import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

// ═══════════════════════════════════════════════════════════════
// DESIGN SYSTEM — 純白 × ゴールド × 深墨
// クリーンな白を基調に、ゴールドで重厚感を演出
// ═══════════════════════════════════════════════════════════════
const D = {
  parchment: "#F7F7F8",   // ページ背景（ごく薄いグレー）
  cream:     "#FFFFFF",   // カード背景（純白）
  ivory:     "#F5F5F7",   // サブエリア
  vellum:    "#EFEFF2",   // ホバー・強調
  linen:     "#E2E2E8",   // 区切り線
  rim:       "#E4E4EA",   // 通常ボーダー
  rimSoft:   "#EEEEEF",   // 最薄ボーダー
  rimGold:   "rgba(184,145,42,0.28)",
  // ── テキスト：全部グレー系、階調で差をつける ──
  sumi:      "#1C1C22",   // 最も濃い（タイトル）
  charcoal:  "#2E2E38",   // 本文（ほぼ黒グレー）
  sepia:     "#4A4A58",   // サブテキスト（中グレー）
  dust:      "#6A6A7A",   // 補足テキスト（グレー）
  faint:     "#9090A0",   // 最薄（日付・ラベル補足）
  gold:      "#B8912A",
  goldHi:    "#D4A830",
  goldDeep:  "#8A6A18",
  goldPale:  "#E8CC80",
  goldBg:    "rgba(184,145,42,0.06)",
  goldBdr:   "rgba(184,145,42,0.25)",
  goldGlow:  "rgba(184,145,42,0.18)",
  goldSheen: "rgba(232,204,128,0.25)",
  moss:      "#3A7A4A",
  mossBg:    "rgba(58,122,74,0.07)",
  mossBdr:   "rgba(58,122,74,0.22)",
  amber:     "#B86018",
  amberBg:   "rgba(184,96,24,0.07)",
  tags: {
    仕事: { bg:"rgba(184,145,42,0.07)", color:"#8A6A18", bdr:"rgba(184,145,42,0.22)" },
    学習: { bg:"rgba(50,80,180,0.06)",  color:"#3050A8", bdr:"rgba(50,80,180,0.18)"  },
    健康: { bg:"rgba(40,120,70,0.07)",  color:"#286A42", bdr:"rgba(40,120,70,0.2)"   },
    副業: { bg:"rgba(160,80,20,0.07)",  color:"#904810", bdr:"rgba(160,80,20,0.2)"   },
    個人: { bg:"rgba(110,50,160,0.07)", color:"#6E3CA0", bdr:"rgba(110,50,160,0.18)" },
  },
};

const CARD_BG  = "#FFFFFF";
const GOLD_BTN = `linear-gradient(135deg, ${D.goldHi} 0%, ${D.gold} 55%, ${D.goldDeep} 100%)`;
const NOISE    = "";

// ── Data ─────────────────────────────────────────────────────
const uid   = () => `id-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
const today = () => new Date().toISOString().slice(0,10);
const fmtDate = d => new Date(d+"T00:00").toLocaleDateString("ja-JP",{month:"short",day:"numeric",weekday:"short"});

const INIT = [
  {
    id:"g1", title:"SNSフォロワー10万人を達成する", tag:"副業",
    horizon:"2026-06-30", createdAt:"2026-01-01",
    bigTasks:[{
      id:"b1", title:"動画コンテンツ量産体制の確立",
      midTasks:[
        { id:"m1", title:"ショート動画フォーマット確立",
          dailyTasks:[
            {id:"d1",label:"猫ダンス動画を2本撮影・編集",done:false,tag:"副業",date:"2026-03-12"},
            {id:"d2",label:"TikTok / Reels 同時投稿",done:false,tag:"副業",date:"2026-03-12"},
            {id:"d3",label:"サムネイルA/Bテスト設計",done:true,tag:"副業",date:"2026-03-11"},
          ]},
        { id:"m2", title:"競合分析 & 勝ちパターン抽出",
          dailyTasks:[
            {id:"d4",label:"競合TOP10チャンネルを分析",done:true,tag:"副業",date:"2026-03-10"},
            {id:"d5",label:"フック別CTRをスプシ整理",done:false,tag:"副業",date:"2026-03-13"},
          ]},
      ]}],
  },
  {
    id:"g2", title:"月収50万円をオンラインで達成する", tag:"副業",
    horizon:"2026-09-30", createdAt:"2026-01-01",
    bigTasks:[{
      id:"b2", title:"マネタイズ導線の設計と構築",
      midTasks:[
        { id:"m3", title:"LP & ファネル構築",
          dailyTasks:[
            {id:"d6",label:"LP構成を書き出す（A4×3枚）",done:false,tag:"副業",date:"2026-03-12"},
            {id:"d7",label:"ファン向けDM施策の検討",done:false,tag:"副業",date:"2026-03-14"},
          ]},
      ]}],
  },
];

const calcPct    = ts  => ts.length ? Math.round(ts.filter(t=>t.done).length/ts.length*100) : 0;
const allDailyOf = g   => g.bigTasks.flatMap(b=>b.midTasks.flatMap(m=>m.dailyTasks));
const goalPct    = g   => calcPct(allDailyOf(g));

// ═══════════════════════════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════════════════════════

/* 細いゴールドの飾り線 */
function GoldRule({ my=16 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:`${my}px 0` }}>
      <div style={{ flex:1, height:1,
        background:`linear-gradient(90deg, transparent, ${D.rimGold} 60%, transparent)` }}/>
      <div style={{ width:3, height:3, borderRadius:"50%",
        background:D.goldPale, opacity:0.8 }}/>
      <div style={{ flex:1, height:1,
        background:`linear-gradient(90deg, transparent, ${D.rimGold} 60%, transparent)`,
        transform:"scaleX(-1)" }}/>
    </div>
  );
}

/* ラベル — 小文字スパン */
function Eyebrow({ children, color=D.sepia }) {
  return (
    <span style={{
      fontSize:11, letterSpacing:"0.15em", color, fontWeight:700,
      fontFamily:"'Cormorant Garamond', 'Shippori Mincho', serif",
      textTransform:"uppercase", fontStyle:"italic",
    }}>{children}</span>
  );
}

/* タグバッジ */
function Tag({ label }) {
  const s = D.tags[label] || D.tags["個人"];
  return (
    <span style={{
      fontSize:11, padding:"3px 10px", borderRadius:4,
      background:s.bg, color:s.color, border:`1px solid ${s.bdr}`,
      fontFamily:"'Noto Sans JP', sans-serif",
      letterSpacing:"0.06em",
      whiteSpace:"nowrap", fontWeight:600,
    }}>{label}</span>
  );
}

/* ゴールド数値 */
function GoldNum({ value, size=11 }) {
  return (
    <span style={{
      fontSize:size, color:D.gold,
      fontFamily:"'Cormorant Garamond', serif",
      fontWeight:600, letterSpacing:"0.05em",
      fontStyle:"italic",
    }}>{value}<span style={{ fontSize:size*0.75, opacity:0.75 }}>%</span></span>
  );
}

/* リング */
function Ring({ pct, size, stroke, color=D.gold }) {
  const r = (size-stroke)/2, c = 2*Math.PI*r, o = c-(pct/100)*c;
  return (
    <svg width={size} height={size}
      style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={D.rimSoft} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={o}
        style={{
          transition:"stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)",
          filter:`drop-shadow(0 0 3px ${D.goldGlow})`,
        }}/>
    </svg>
  );
}

/* プログレスバー */
function BarTrack({ pct, color=D.gold, h=2 }) {
  return (
    <div style={{ height:h, background:D.rim, borderRadius:99, overflow:"hidden" }}>
      <div style={{
        height:"100%", width:`${pct}%`, borderRadius:99,
        background:`linear-gradient(90deg, ${D.goldDeep}, ${color})`,
        transition:"width 1s cubic-bezier(.4,0,.2,1)",
        boxShadow: pct>0 ? `0 0 6px ${D.goldSheen}` : "none",
      }}/>
    </div>
  );
}

/* チェックボックス */
function Checkbox({ done, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width:20, height:20, borderRadius:4, flexShrink:0,
      border:`1.5px solid ${done ? D.moss : D.linen}`,
      background: done ? D.mossBg : "transparent",
      cursor:"pointer",
      display:"flex", alignItems:"center", justifyContent:"center",
      transition:"all 0.18s ease",
    }}>
      {done && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l3 3 5-6" stroke={D.moss}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

/* アイコンボタン */
function IconBtn({ onClick, children, gold, style={} }) {
  return (
    <button onClick={onClick} style={{
      width:30, height:30, borderRadius:8, cursor:"pointer",
      border:`1px solid ${gold ? D.goldBdr : D.rim}`,
      background: gold ? D.goldBg : "transparent",
      display:"flex", alignItems:"center", justifyContent:"center",
      color: gold ? D.gold : D.sepia,
      fontSize:13, transition:"all 0.15s ease",
      flexShrink:0, ...style,
    }}>{children}</button>
  );
}

// ═══════════════════════════════════════════════════════════════
// AI PANEL
// ═══════════════════════════════════════════════════════════════
function AIPanel({ goal, onAccept, onClose }) {
  const [loading, setLoading] = useState(true);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const [raw,     setRaw]     = useState("");

  const goalTitle = goal.title;
  const daysLeft  = goal.horizon
    ? Math.ceil((new Date(goal.horizon) - new Date()) / 86400000) : null;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            system: `あなたは目標達成のための戦略コンサルタントです。
ユーザーの具体的なゴールに対して、現実的で実行可能なタスク計画をJSON形式で出力してください。
重要：必ずJSONのみを出力し、説明文・マークダウン記号(\`\`\`)は一切含めないこと。`,
            messages: [{
              role: "user",
              content: `以下のゴール情報をもとに、達成のための階層的タスク計画を作成してください。

【ゴール】${goalTitle}
【タグ/カテゴリ】${goal.tag || "未設定"}
【期限】${daysLeft !== null ? `${daysLeft}日後（${goal.horizon}）` : "未設定"}
【現在のタスク数】${goal.bigTasks?.flatMap(b=>b.midTasks?.flatMap(m=>m.dailyTasks)||[]).length || 0}件登録済み

このゴールを達成するために：
1. bigTasks（大タスク）: ゴール達成に必要な主要フェーズ・柱を2〜3個
2. midTasks（中タスク/マイルストーン）: 各bigTaskの中で達成すべき具体的なマイルストーンを1〜2個
3. dailyTasks（日次アクション）: 今日から始められる、30分以内で完了できる具体的な行動を2〜3個

条件：
- タスク名はこのゴール「${goalTitle}」に直接関係する具体的な内容にすること
- 汎用的・抽象的な表現（「計画を立てる」「調査する」）は避け、固有名詞や数値を含めること
- minsは実際の所要時間（15〜60の数値）

出力形式（JSONのみ、他の文字は不要）:
{"bigTasks":[{"title":"大タスク名","midTasks":[{"title":"中タスク名","dailyTasks":[{"label":"具体的なアクション（数値や固有名詞含む）","mins":30}]}]}]}`
            }],
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);

        const text = data.content?.find(b => b.type === "text")?.text || "";
        setRaw(text);

        // JSON抽出：コードブロック除去 → trim → パース
        const cleaned = text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        const parsed = JSON.parse(cleaned);

        // バリデーション
        if (!parsed.bigTasks || !Array.isArray(parsed.bigTasks))
          throw new Error("bigTasks が配列ではありません");
        for (const b of parsed.bigTasks) {
          if (!b.title) throw new Error("bigTask に title がありません");
          if (!Array.isArray(b.midTasks)) throw new Error("midTasks が配列ではありません");
        }
        setResult(parsed);
      } catch (e) {
        setError(`生成エラー: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ position:"fixed",inset:0,zIndex:400,display:"flex",alignItems:"flex-end" }}>
      <div onClick={onClose} style={{
        position:"absolute",inset:0,
        background:"rgba(15,15,20,0.45)",
        backdropFilter:"blur(14px)",
      }}/>
      <div style={{
        position:"relative",zIndex:1,
        width:"100%",maxWidth:430,margin:"0 auto",
        background:"#fff",
        borderRadius:"24px 24px 0 0",
        border:`1px solid ${D.linen}`,
        borderBottom:"none",
        padding:"0 24px 48px",
        maxHeight:"84vh",overflowY:"auto",
        animation:"sheetUp 0.32s cubic-bezier(.4,0,.2,1)",
        boxShadow:`0 -8px 48px rgba(15,15,20,0.18)`,
      }}>
        {/* ゴールドトップライン */}
        <div style={{
          height:2,margin:"0 -24px",
          background:`linear-gradient(90deg, transparent, ${D.goldPale} 30%, ${D.goldHi} 50%, ${D.goldPale} 70%, transparent)`,
          opacity:0.9,
        }}/>
        <div style={{ width:36,height:3,borderRadius:99,background:D.rim,margin:"14px auto 26px" }}/>

        <Eyebrow color={D.goldDeep}>✦ AI Task Decomposition</Eyebrow>
        <div style={{
          fontFamily:"'Shippori Mincho B1','Noto Serif JP',serif",
          fontSize:20,fontWeight:700,color:D.sumi,
          margin:"8px 0 4px",lineHeight:1.4,
        }}>タスクを自動生成</div>

        {/* ゴール情報カード */}
        <div style={{
          background:D.ivory,borderRadius:10,
          border:`1px solid ${D.rim}`,
          padding:"12px 14px",marginBottom:22,
        }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
            <Tag label={goal.tag}/>
            {daysLeft!==null && (
              <span style={{ fontSize:11.5,fontWeight:600,color:D.dust,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic" }}>
                残 {daysLeft} 日
              </span>
            )}
          </div>
          <div style={{ fontSize:13,color:D.charcoal,fontFamily:"'Shippori Mincho B1',serif",lineHeight:1.5 }}>
            {goalTitle}
          </div>
        </div>

        {loading && (
          <div style={{ padding:"50px 0",textAlign:"center" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              {[0,0.15,0.3].map((delay,i) => (
                <div key={i} style={{
                  width:8,height:8,borderRadius:"50%",background:D.gold,
                  animation:`dot 1.2s ease-in-out ${delay}s infinite`,
                }}/>
              ))}
            </div>
            <div style={{
              fontSize:12,fontWeight:600,color:D.dust,
              fontFamily:"'Cormorant Garamond',serif",
              letterSpacing:"0.22em",marginTop:16,fontStyle:"italic",
            }}>Analyzing your goal...</div>
          </div>
        )}

        {error && (
          <div style={{
            color:D.amber,fontSize:12.5,padding:"16px",textAlign:"center",
            background:D.amberBg,borderRadius:10,border:`1px solid rgba(184,96,24,0.2)`,
          }}>
            {error}
            <div style={{ fontSize:11.5,fontWeight:600,color:D.dust,marginTop:6 }}>
              ページを再読み込みするか、もう一度お試しください
            </div>
          </div>
        )}

        {result && (
          <>
            <div style={{ marginBottom:16 }}>
              {result.bigTasks.map((b,bi) => (
                <div key={bi} style={{
                  marginBottom:16,
                  borderRadius:12,
                  border:`1px solid ${D.rim}`,
                  overflow:"hidden",
                }}>
                  {/* BIG ヘッダー */}
                  <div style={{
                    padding:"10px 14px",
                    background:`linear-gradient(90deg, ${D.goldBg}, transparent)`,
                    borderBottom:`1px solid ${D.rim}`,
                    display:"flex",alignItems:"center",gap:8,
                  }}>
                    <span style={{
                      fontSize:8,fontFamily:"'Cormorant Garamond',serif",
                      color:D.gold,background:D.goldBg,border:`1px solid ${D.goldBdr}`,
                      padding:"2px 8px",borderRadius:3,letterSpacing:"0.18em",
                      fontWeight:700,fontStyle:"italic",flexShrink:0,
                    }}>BIG</span>
                    <span style={{
                      fontSize:13,fontWeight:700,color:D.sumi,
                      fontFamily:"'Shippori Mincho B1',serif",
                    }}>{b.title}</span>
                  </div>

                  {b.midTasks.map((m,mi) => (
                    <div key={mi} style={{ padding:"10px 14px",borderBottom:mi<b.midTasks.length-1?`1px solid ${D.rimSoft}`:"none" }}>
                      <div style={{
                        fontSize:13,fontWeight:600,color:D.sepia,
                        fontFamily:"'Noto Sans JP',sans-serif",
                        marginBottom:8,fontWeight:500,
                        display:"flex",alignItems:"center",gap:6,
                      }}>
                        <span style={{
                          fontSize:7.5,background:D.vellum,color:D.dust,
                          padding:"1px 6px",borderRadius:3,letterSpacing:"0.12em",
                          fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",
                        }}>MID</span>
                        {m.title}
                      </div>
                      {m.dailyTasks.map((d,di) => (
                        <div key={di} style={{
                          display:"flex",alignItems:"center",gap:8,
                          padding:"5px 0 5px 10px",
                          borderLeft:`2px solid ${D.goldBdr}`,
                          marginLeft:4,marginBottom:di<m.dailyTasks.length-1?4:0,
                        }}>
                          <div style={{ width:4,height:4,borderRadius:"50%",background:D.goldPale,flexShrink:0 }}/>
                          <span style={{ fontSize:13,fontWeight:500,color:D.charcoal,fontFamily:"'Noto Sans JP',sans-serif",flex:1,lineHeight:1.5 }}>{d.label}</span>
                          <span style={{ fontSize:11.5,fontWeight:500,color:D.dust,fontFamily:"'Cormorant Garamond',serif",flexShrink:0 }}>{d.mins}m</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button onClick={() => onAccept(result)} style={{
              width:"100%",height:52,borderRadius:14,
              background:GOLD_BTN,color:"#fff",
              border:"none",fontSize:14,fontWeight:700,cursor:"pointer",
              fontFamily:"'Shippori Mincho B1',serif",
              letterSpacing:"0.1em",
              boxShadow:`0 4px 20px ${D.goldGlow}`,
              textShadow:"0 1px 2px rgba(0,0,0,0.2)",
            }}>このプランを適用する</button>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DAILY TASK ROW
// ═══════════════════════════════════════════════════════════════
function DailyRow({ task, onToggle, onDelete }) {
  const [hov, setHov] = useState(false);
  const isOld = task.date && task.date < today() && !task.done;
  const isTdy = task.date && task.date === today();

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"11px 14px", borderRadius:9,
        background: hov ? D.vellum : "transparent",
        borderLeft:`2.5px solid ${isTdy?D.gold:isOld?D.amber:"transparent"}`,
        transition:"background 0.15s ease",
      }}
    >
      <Checkbox done={task.done} onToggle={() => onToggle(task.id)}/>
      <span style={{
        flex:1, fontSize:14, lineHeight:1.65,
        color: task.done ? D.faint : D.charcoal,
        fontFamily:"'Noto Sans JP',sans-serif",
        fontWeight:500,
        letterSpacing:"0.025em",
        textDecoration: task.done ? "line-through" : "none",
        textDecorationColor: D.faint,
        transition:"color 0.2s",
      }}>{task.label}</span>
      <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
        {task.tag && <Tag label={task.tag}/>}
        {task.date && (
          <span style={{
            fontSize:11.5,color:isOld&&!task.done?D.amber:D.sepia,
            fontFamily:"'Noto Sans JP',sans-serif",fontWeight:600,
          }}>{fmtDate(task.date)}</span>
        )}
        {hov && (
          <button onClick={() => onDelete(task.id)} style={{
            width:18,height:18,border:"none",background:"transparent",
            cursor:"pointer",color:D.faint,fontSize:11,
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>✕</button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INLINE ADD TASK
// ═══════════════════════════════════════════════════════════════
function InlineAdd({ midId, onAdd, defaultTag }) {
  const [open,  setOpen]  = useState(false);
  const [label, setLabel] = useState("");
  const [tag,   setTag]   = useState(defaultTag||"副業");
  const [date,  setDate]  = useState(today());
  const ref = useRef();
  useEffect(() => { if(open) setTimeout(()=>ref.current?.focus(),80); },[open]);

  const submit = () => {
    if(!label.trim()) return;
    onAdd(midId,{id:uid(),label:label.trim(),done:false,tag,date});
    setLabel(""); setOpen(false);
  };

  if(!open) return (
    <button onClick={() => setOpen(true)} style={{
      width:"100%",padding:"9px 14px",borderRadius:8,
      border:`1px dashed ${D.rimGold}`,background:"transparent",
      color:D.dust,fontSize:12,cursor:"pointer",
      fontFamily:"'Noto Sans JP',sans-serif",letterSpacing:"0.05em",
      textAlign:"left",display:"flex",alignItems:"center",gap:8,
      transition:"all 0.15s ease",
    }}>
      <span style={{ fontSize:16,lineHeight:1,color:D.goldPale }}>+</span>
      タスクを追加する
    </button>
  );

  return (
    <div style={{
      borderRadius:10,border:`1px solid ${D.goldBdr}`,
      background:D.goldBg,padding:"12px 14px",
    }}>
      <input ref={ref} value={label} onChange={e=>setLabel(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter")submit();if(e.key==="Escape")setOpen(false);}}
        placeholder="タスク名を入力..."
        style={{
          width:"100%",background:"transparent",border:"none",
          fontSize:13,color:D.charcoal,
          fontFamily:"'Noto Sans JP',sans-serif",
          outline:"none",marginBottom:10,letterSpacing:"0.03em",
        }}/>
      <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{
          fontSize:10.5,border:`1px solid ${D.rim}`,borderRadius:5,
          padding:"4px 8px",background:D.cream,color:D.sepia,
          fontFamily:"'Cormorant Garamond',serif",cursor:"pointer",outline:"none",
        }}/>
        <select value={tag} onChange={e=>setTag(e.target.value)} style={{
          fontSize:10.5,border:`1px solid ${D.rim}`,borderRadius:5,
          padding:"4px 8px",background:D.cream,color:D.sepia,
          fontFamily:"'Cormorant Garamond',serif",cursor:"pointer",outline:"none",
        }}>
          {Object.keys(D.tags).map(t=><option key={t}>{t}</option>)}
        </select>
        <div style={{flex:1}}/>
        <button onClick={()=>setOpen(false)} style={{
          fontSize:12.5,fontWeight:600,color:D.dust,background:"none",border:"none",cursor:"pointer",
          fontFamily:"'Noto Sans JP',sans-serif",
        }}>キャンセル</button>
        <button onClick={submit} style={{
          fontSize:11,background:GOLD_BTN,color:"#fff",
          border:"none",borderRadius:6,padding:"5px 14px",cursor:"pointer",
          fontFamily:"'Shippori Mincho B1',serif",fontWeight:700,letterSpacing:"0.06em",
          textShadow:"0 1px 2px rgba(0,0,0,0.15)",
        }}>追加</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MID BLOCK
// ═══════════════════════════════════════════════════════════════
function MidBlock({ mid, bigId, goalId, expanded, onToggleExpand,
  onToggleTask, onAddTask, onDeleteTask }) {
  const pct      = calcPct(mid.dailyTasks);
  const complete = pct===100;
  const doneN    = mid.dailyTasks.filter(d=>d.done).length;
  const todayN   = mid.dailyTasks.filter(d=>d.date===today()).length;

  return (
    <div style={{
      borderRadius:12,overflow:"hidden",
      border:`1px solid ${complete?D.mossBdr:D.rim}`,
      background: complete
        ? `linear-gradient(160deg, rgba(74,103,65,0.05), rgba(74,103,65,0.02))`
        : D.cream,
      transition:"all 0.25s ease",
      boxShadow:`0 1px 6px rgba(26,23,20,0.04)`,
    }}>
      <button onClick={onToggleExpand} style={{
        width:"100%",padding:"12px 15px",
        display:"flex",alignItems:"center",gap:11,
        background:"none",border:"none",cursor:"pointer",textAlign:"left",
      }}>
        {/* 完了インジケーター */}
        <div style={{
          width:22,height:22,borderRadius:5,flexShrink:0,
          background: complete ? D.mossBg : D.ivory,
          border:`1.5px solid ${complete?D.moss:D.linen}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          transition:"all 0.2s",
        }}>
          {complete
            ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke={D.moss} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            : <div style={{ width:5,height:5,borderRadius:"50%",background:D.goldPale }}/>
          }
        </div>

        <div style={{ flex:1,minWidth:0 }}>
          <div style={{
            fontSize:14,fontWeight:700,
            color:complete?D.faint:D.charcoal,
            fontFamily:"'Shippori Mincho B1','Noto Serif JP',serif",
            letterSpacing:"0.03em",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
            textDecoration:complete?"line-through":"none",
            textDecorationColor:D.faint,
          }}>{mid.title}</div>
          <div style={{
            fontSize:11.5,fontWeight:500,color:D.dust,
            fontFamily:"'Cormorant Garamond',serif",
            marginTop:2,fontStyle:"italic",
          }}>
            {doneN}/{mid.dailyTasks.length} 完了
            {todayN>0 && <span style={{ color:D.goldDeep,marginLeft:8 }}>· 今日 {todayN}件</span>}
          </div>
        </div>

        <div style={{ display:"flex",alignItems:"center",gap:9,flexShrink:0 }}>
          <GoldNum value={pct}/>
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none"
            style={{ transform:expanded?"rotate(90deg)":"rotate(0)", transition:"transform 0.22s ease" }}>
            <path d="M2 2l4 4.5-4 4.5" stroke={D.linen} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      <div style={{ padding:"0 15px 10px" }}>
        <BarTrack pct={pct} color={complete?D.moss:D.gold} h={1.5}/>
      </div>

      {expanded && (
        <div style={{
          borderTop:`1px solid ${D.rimSoft}`,
          padding:"8px 10px 12px",
          display:"flex",flexDirection:"column",gap:2,
          background:D.parchment,
        }}>
          {mid.dailyTasks.map(d=>(
            <DailyRow key={d.id} task={d}
              onToggle={id=>onToggleTask(goalId,bigId,mid.id,id)}
              onDelete={id=>onDeleteTask(goalId,bigId,mid.id,id)}/>
          ))}
          <div style={{ marginTop:6 }}>
            <InlineAdd midId={mid.id} defaultTag={mid.dailyTasks[0]?.tag||"副業"}
              onAdd={(mId,t)=>onAddTask(goalId,bigId,mId,t)}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BIG BLOCK
// ═══════════════════════════════════════════════════════════════
function BigBlock({ big, goalId, expandedMids, onToggleMid,
  onToggleTask, onAddTask, onDeleteTask }) {
  const allD = big.midTasks.flatMap(m=>m.dailyTasks);
  const pct  = calcPct(allD);

  return (
    <div style={{
      borderRadius:14,overflow:"hidden",
      background:D.ivory,
      border:`1px solid ${D.rim}`,
      marginBottom:10,
    }}>
      {/* BIG ヘッダー */}
      <div style={{
        padding:"13px 15px",
        display:"flex",alignItems:"center",gap:10,
        borderBottom:`1px solid ${D.rimSoft}`,
        background:`linear-gradient(90deg, ${D.goldBg}, transparent 60%)`,
      }}>
        <span style={{
          fontSize:8.5,fontFamily:"'Cormorant Garamond',serif",
          color:D.gold,background:D.goldBg,border:`1px solid ${D.goldBdr}`,
          padding:"2px 9px",borderRadius:3,letterSpacing:"0.2em",
          fontWeight:700,fontStyle:"italic",flexShrink:0,
        }}>Big Task</span>
        <div style={{
          flex:1,
          fontSize:15,fontWeight:700,color:D.charcoal,
          fontFamily:"'Shippori Mincho B1','Noto Serif JP',serif",
          letterSpacing:"0.03em",
          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
        }}>{big.title}</div>
        <GoldNum value={pct}/>
      </div>

      <div style={{ padding:"12px",display:"flex",flexDirection:"column",gap:7 }}>
        <Eyebrow>Milestones</Eyebrow>
        <div style={{ display:"flex",flexDirection:"column",gap:6,marginTop:4 }}>
          {big.midTasks.map(mid=>(
            <MidBlock key={mid.id} mid={mid} bigId={big.id} goalId={goalId}
              expanded={expandedMids.includes(mid.id)}
              onToggleExpand={()=>onToggleMid(mid.id)}
              onToggleTask={onToggleTask}
              onAddTask={onAddTask}
              onDeleteTask={onDeleteTask}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GOAL CARD
// ═══════════════════════════════════════════════════════════════
function GoalCard({ goal, collapsed, onCollapse, expandedMids, onToggleMid,
  onToggleTask, onAddTask, onDeleteTask, onAI }) {
  const pct      = goalPct(goal);
  const allD     = allDailyOf(goal);
  const doneN    = allD.filter(d=>d.done).length;
  const daysLeft = goal.horizon
    ? Math.ceil((new Date(goal.horizon)-new Date())/86400000) : null;

  return (
    <div style={{
      borderRadius:20,overflow:"hidden",
      background:CARD_BG,
      border:`1px solid ${D.linen}`,
      boxShadow:`0 4px 24px rgba(26,23,20,0.08), 0 1px 4px rgba(26,23,20,0.06)`,
      backgroundImage:NOISE,
    }}>
      {/* トップゴールドライン */}
      <div style={{
        height:2,
        background:`linear-gradient(90deg, transparent 5%, ${D.goldPale} 40%, ${D.goldHi} 50%, ${D.goldPale} 60%, transparent 95%)`,
        opacity:0.7,
      }}/>

      {/* ゴールヘッダー */}
      <div style={{ padding:"22px 22px 16px" }}>
        <div style={{ display:"flex",alignItems:"flex-start",gap:16,marginBottom:16 }}>
          {/* リング */}
          <div style={{ position:"relative",flexShrink:0 }}>
            <Ring pct={pct} size={56} stroke={2.5}/>
            <span style={{
              position:"absolute",inset:0,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:12,color:D.gold,
              fontFamily:"'Cormorant Garamond',serif",
              fontWeight:600,fontStyle:"italic",
            }}>{pct}%</span>
          </div>

          {/* テキスト */}
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:7 }}>
              <Tag label={goal.tag}/>
              {daysLeft!==null && (
                <span style={{
                  fontSize:9.5,
                  color:daysLeft<30?D.amber:D.faint,
                  fontFamily:"'Cormorant Garamond',serif",
                  fontStyle:"italic",
                }}>残 {daysLeft} 日</span>
              )}
            </div>
            <h2 style={{
              fontFamily:"'Shippori Mincho B1','Noto Serif JP',serif",
              fontSize:18,fontWeight:800,color:D.sumi,
              lineHeight:1.55,letterSpacing:"0.04em",
            }}>{goal.title}</h2>
            <div style={{
              fontSize:13,fontWeight:600,color:D.dust,
              fontFamily:"'Noto Sans JP',sans-serif",
              marginTop:5,fontWeight:500,
            }}>{doneN} / {allD.length} 完了</div>
          </div>

          {/* コントロール */}
          <div style={{ display:"flex",flexDirection:"column",gap:6,flexShrink:0 }}>
            <IconBtn onClick={onAI} gold title="AIでタスクを生成">✦</IconBtn>
            <IconBtn onClick={onCollapse}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                style={{ transform:collapsed?"rotate(0)":"rotate(180deg)", transition:"transform 0.25s ease" }}>
                <path d="M2 4l3 3 3-3" stroke={D.sepia} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </IconBtn>
          </div>
        </div>

        <BarTrack pct={pct} h={3}/>
      </div>

      {/* Big Tasks */}
      {!collapsed && (
        <div style={{
          borderTop:`1px solid ${D.rimSoft}`,
          padding:"16px 16px 18px",
          background:`rgba(26,23,20,0.015)`,
        }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"0 2px" }}>
            <Eyebrow>Big Tasks</Eyebrow>
            <div style={{
              flex:1,height:1,
              background:`linear-gradient(90deg, ${D.rimGold}, transparent)`,
            }}/>
          </div>
          {goal.bigTasks.map(b=>(
            <BigBlock key={b.id} big={b} goalId={goal.id}
              expandedMids={expandedMids} onToggleMid={onToggleMid}
              onToggleTask={onToggleTask} onAddTask={onAddTask} onDeleteTask={onDeleteTask}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TODAY VIEW
// ═══════════════════════════════════════════════════════════════
function TodayView({ goals, onToggleTask, onDeleteTask }) {
  const todayTasks = goals.flatMap(g=>
    g.bigTasks.flatMap(b=>
      b.midTasks.flatMap(m=>
        m.dailyTasks
          .filter(d=>d.date===today())
          .map(d=>({...d,goalId:g.id,bigId:b.id,midId:m.id,goalTitle:g.title,goalTag:g.tag}))
      )
    )
  );
  const overdue = goals.flatMap(g=>
    g.bigTasks.flatMap(b=>
      b.midTasks.flatMap(m=>
        m.dailyTasks
          .filter(d=>d.date&&d.date<today()&&!d.done)
          .map(d=>({...d,goalId:g.id,bigId:b.id,midId:m.id}))
      )
    )
  );

  const done  = todayTasks.filter(d=>d.done).length;
  const total = todayTasks.length;
  const pct   = total ? Math.round(done/total*100) : 0;

  // 継続日数計算
  const tmap = {};
  goals.forEach(g=>g.bigTasks.forEach(b=>b.midTasks.forEach(m=>m.dailyTasks.forEach(d=>{
    if(!d.date) return;
    if(!tmap[d.date]) tmap[d.date]={total:0,done:0};
    tmap[d.date].total++;
    if(d.done) tmap[d.date].done++;
  }))));
  const streakMap_ = buildStreakMap(tmap);
  const todayStreak = streakMap_[today()]?.streakCount || (() => {
    const keys = Object.keys(streakMap_).filter(k=>k<today()).sort();
    const last  = keys[keys.length-1];
    return (last && streakMap_[last]?.state==="streak") ? streakMap_[last].streakCount : 0;
  })();

  return (
    <div>
      {/* ── ヒーローヘッダー ── */}
      <div style={{
        borderRadius:20,
        background:"#fff",
        border:`1px solid ${D.rim}`,
        padding:"24px 22px 20px",
        marginBottom:16,
        boxShadow:`0 2px 20px rgba(15,15,20,0.07), 0 0 0 1px ${D.rimSoft}`,
        position:"relative",overflow:"hidden",
      }}>
        {/* ゴールドアクセントライン */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,height:3,
          background:`linear-gradient(90deg, transparent 5%, ${D.goldPale} 30%, ${D.goldHi} 50%, ${D.goldPale} 70%, transparent 95%)`,
        }}/>

        {/* 日付 + 連続 */}
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20 }}>
          <div>
            <div style={{
              fontSize:11,fontWeight:700,color:D.gold,fontFamily:"'Noto Sans JP',sans-serif",
              letterSpacing:"0.15em",marginBottom:4,
            }}>TODAY</div>
            <div style={{
              fontFamily:"'Shippori Mincho B1',serif",
              fontSize:18,fontWeight:700,color:D.sumi,
              letterSpacing:"0.04em",lineHeight:1.3,
            }}>
              {new Date().toLocaleDateString("ja-JP",{month:"long",day:"numeric",weekday:"long"})}
            </div>
          </div>
          {/* ストリーク */}
          {todayStreak > 0 && (
            <div style={{
              display:"flex",flexDirection:"column",alignItems:"center",
              background:D.goldBg,borderRadius:12,
              border:`1px solid ${D.goldBdr}`,
              padding:"8px 12px",gap:2,
            }}>
              <span style={{ fontSize:18,lineHeight:1 }}>🔥</span>
              <span style={{
                fontSize:18,fontFamily:"'Noto Sans JP',sans-serif",
                fontWeight:700,color:D.gold,lineHeight:1,
              }}>{todayStreak}</span>
              <span style={{
                fontSize:10.5,color:D.goldDeep,fontFamily:"'Noto Sans JP',sans-serif",
                fontWeight:600,
              }}>days</span>
            </div>
          )}
        </div>

        {/* 今日の達成率 大型表示 */}
        <div style={{ display:"flex",alignItems:"center",gap:18,marginBottom:18 }}>
          {/* 大リング */}
          <div style={{ position:"relative",flexShrink:0 }}>
            <Ring pct={pct} size={72} stroke={4}/>
            <div style={{
              position:"absolute",inset:0,
              display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",
              gap:0,
            }}>
              <span style={{
                fontSize:18,fontFamily:"'Cormorant Garamond',serif",
                fontWeight:700,color:D.gold,fontStyle:"italic",lineHeight:1,
              }}>{pct}</span>
              <span style={{
                fontSize:11,fontFamily:"'Noto Sans JP',sans-serif",
                color:D.dust,fontWeight:500,
              }}>%</span>
            </div>
          </div>

          {/* 数値3列 */}
          <div style={{ flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0 }}>
            {[
              {l:"TOTAL",v:total,c:D.charcoal},
              {l:"DONE", v:done, c:D.moss},
              {l:"LEFT", v:total-done, c:total-done>0?D.sepia:D.moss},
            ].map((s,i)=>(
              <div key={s.l} style={{
                paddingLeft:i?16:0,
                borderLeft:i?`1px solid ${D.rim}`:"none",
              }}>
                <div style={{
                  fontSize:11,color:D.dust,fontFamily:"'Noto Sans JP',sans-serif",
                  letterSpacing:"0.08em",fontWeight:700,marginBottom:4,
                }}>{s.l}</div>
                <div style={{
                  fontSize:28,fontFamily:"'Noto Sans JP',sans-serif",
                  fontWeight:700,color:s.c,lineHeight:1,
                }}>{s.v}</div>
                <div style={{
                  fontSize:12,fontWeight:500,color:D.dust,fontFamily:"'Noto Sans JP',sans-serif",
                }}>件</div>
              </div>
            ))}
          </div>
        </div>

        {/* バー */}
        <BarTrack pct={pct} h={4}/>
        {pct===100 && (
          <div style={{
            marginTop:10,textAlign:"center",
            fontSize:11,color:D.moss,
            fontFamily:"'Shippori Mincho B1',serif",letterSpacing:"0.08em",
          }}>✓ 今日のタスクをすべて完了しました</div>
        )}
      </div>

      {/* ── 目標別進捗（一目でわかる） ── */}
      <div style={{
        borderRadius:16,background:"#fff",
        border:`1px solid ${D.rim}`,
        padding:"14px 18px",marginBottom:16,
        boxShadow:`0 1px 10px rgba(15,15,20,0.05)`,
      }}>
        <div style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,
        }}>
          <Eyebrow color={D.goldDeep}>目標への進捗</Eyebrow>
          <span style={{
            fontSize:12,fontWeight:500,color:D.dust,fontFamily:"'Noto Sans JP',sans-serif",
          }}>全タスク基準</span>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {goals.map(g=>{
            const gPct = goalPct(g);
            const allD = allDailyOf(g);
            const gDone = allD.filter(d=>d.done).length;
            const daysLeft = g.horizon
              ? Math.ceil((new Date(g.horizon)-new Date())/86400000) : null;
            return (
              <div key={g.id}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}>
                  <Tag label={g.tag}/>
                  <div style={{
                    flex:1,fontSize:14,color:D.charcoal,
                    fontFamily:"'Noto Sans JP',sans-serif",
                    whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
                    fontWeight:500,
                  }}>{g.title}</div>
                  <div style={{ display:"flex",alignItems:"center",gap:6,flexShrink:0 }}>
                    <span style={{
                      fontSize:13,color:D.gold,
                      fontFamily:"'Noto Sans JP',sans-serif",fontWeight:700,
                    }}>{gPct}%</span>
                    {daysLeft!==null && (
                      <span style={{
                        fontSize:11.5,color:daysLeft<30?D.amber:D.dust,
                        fontFamily:"'Noto Sans JP',sans-serif",fontWeight:600,
                      }}>残{daysLeft}日</span>
                    )}
                  </div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <BarTrack pct={gPct} h={5}/>
                  <span style={{
                    fontSize:12,fontWeight:600,color:D.dust,fontFamily:"'Noto Sans JP',sans-serif",
                    whiteSpace:"nowrap",flexShrink:0,
                  }}>{gDone}/{allD.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 期限切れ警告 */}
      {overdue.length>0 && (
        <div style={{
          borderRadius:12,background:D.amberBg,
          border:`1px solid rgba(184,96,24,0.2)`,
          padding:"11px 16px",marginBottom:14,
          display:"flex",alignItems:"center",gap:12,
        }}>
          <span style={{ fontSize:14,flexShrink:0 }}>⚠</span>
          <div>
            <div style={{
              fontSize:12,fontWeight:600,color:D.amber,
              fontFamily:"'Shippori Mincho B1',serif",
            }}>{overdue.length}件の期限切れタスク</div>
            <div style={{ fontSize:12,fontWeight:600,color:D.sepia,fontFamily:"'Noto Sans JP',sans-serif",marginTop:1 }}>
              目標タブから確認・更新してください
            </div>
          </div>
        </div>
      )}

      {/* ── 今日のタスクリスト ── */}
      {todayTasks.length>0 ? (
        <div style={{
          borderRadius:16,background:"#fff",
          border:`1px solid ${D.rim}`,
          overflow:"hidden",
          boxShadow:`0 1px 10px rgba(15,15,20,0.05)`,
        }}>
          <div style={{
            padding:"12px 18px 10px",
            borderBottom:`1px solid ${D.rimSoft}`,
            display:"flex",alignItems:"center",justifyContent:"space-between",
          }}>
            <Eyebrow color={D.goldDeep}>今日のタスク</Eyebrow>
            <div style={{ display:"flex",alignItems:"center",gap:6 }}>
              <div style={{
                width:8,height:8,borderRadius:"50%",
                background: done===total && total>0 ? D.moss : D.goldBdr,
              }}/>
              <span style={{ fontSize:11.5,fontWeight:600,color:D.dust,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic" }}>
                {done}/{total}
              </span>
            </div>
          </div>
          <div style={{ padding:"4px 8px 8px",display:"flex",flexDirection:"column",gap:1 }}>
            {todayTasks.map(d=>(
              <DailyRow key={d.id} task={d}
                onToggle={()=>onToggleTask(d.goalId,d.bigId,d.midId,d.id)}
                onDelete={()=>onDeleteTask(d.goalId,d.bigId,d.midId,d.id)}/>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign:"center",padding:"60px 0" }}>
          <div style={{
            fontSize:28,opacity:0.12,marginBottom:12,
            color:D.gold,fontFamily:"'Cormorant Garamond',serif",
          }}>✦</div>
          <div style={{
            fontFamily:"'Shippori Mincho B1',serif",
            fontSize:15,color:D.sepia,letterSpacing:"0.06em",
          }}>今日のタスクはありません</div>
          <GoldRule my={18}/>
          <div style={{ fontSize:13,fontWeight:500,color:D.dust,fontFamily:"'Noto Sans JP',sans-serif" }}>
            目標タブからタスクを追加してください
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GOALS VIEW
// ═══════════════════════════════════════════════════════════════
function GoalsView({ goals, collapsedGoals, onCollapse, expandedMids, onToggleMid,
  onToggleTask, onAddTask, onDeleteTask, onAI, onAddGoal }) {

  return (
    <div>
      {/* サマリー */}
      <div style={{
        borderRadius:16,
        background:CARD_BG,
        border:`1px solid ${D.linen}`,
        padding:"18px 20px",marginBottom:18,
        boxShadow:`0 2px 14px rgba(26,23,20,0.07)`,
        backgroundImage:NOISE,
      }}>
        <Eyebrow color={D.goldDeep}>Goals Overview</Eyebrow>
        <div style={{ display:"flex",flexDirection:"column",gap:12,marginTop:14 }}>
          {goals.map(g=>(
            <div key={g.id} style={{ display:"flex",alignItems:"center",gap:12 }}>
              <Tag label={g.tag}/>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{
                  fontSize:13,fontWeight:500,color:D.charcoal,
                  fontFamily:"'Shippori Mincho B1','Noto Serif JP',serif",
                  letterSpacing:"0.03em",
                  whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:5,
                }}>{g.title}</div>
                <BarTrack pct={goalPct(g)} h={2}/>
              </div>
              <GoldNum value={goalPct(g)}/>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        {goals.map(g=>(
          <GoalCard key={g.id} goal={g}
            collapsed={collapsedGoals.includes(g.id)}
            onCollapse={()=>onCollapse(g.id)}
            expandedMids={expandedMids} onToggleMid={onToggleMid}
            onToggleTask={onToggleTask} onAddTask={onAddTask} onDeleteTask={onDeleteTask}
            onAI={()=>onAI(g)}/>
        ))}
      </div>

      <button onClick={onAddGoal} style={{
        width:"100%",marginTop:14,padding:"14px 0",borderRadius:14,
        border:`1px dashed ${D.rimGold}`,background:"transparent",
        color:D.faint,fontSize:13,cursor:"pointer",
        fontFamily:"'Shippori Mincho B1',serif",letterSpacing:"0.08em",
        transition:"all 0.15s ease",
      }}>＋ 新しいゴールを追加</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CALENDAR VIEW
// ═══════════════════════════════════════════════════════════════
// ── ストリーク計算ユーティリティ ─────────────────────────────────
// 各日付に対して「その日時点での連続日数」と「状態」を返す
// state: "streak" | "broken" | "today-ok" | "today-partial" | "future" | "empty"
function buildStreakMap(tmap) {
  const todayKey = today();

  // 過去〜今日の全タスク日付を収集してソート
  const allKeys = Object.keys(tmap).filter(k => k <= todayKey).sort();

  // 各日を「完全完了 / 未完了あり」に分類
  // ※タスクがない日は streak に影響しない（空白日）
  // 「タスクあり・未完了」の日だけがリセットトリガー
  const streakMap = {}; // date -> { state, streakCount }

  let streakCount = 0;
  let prevKey     = null;

  for (const key of allKeys) {
    const info    = tmap[key];
    const allDone = info.done === info.total && info.total > 0;

    if (key === todayKey) {
      // 今日はまだ進行中として特別扱い
      if (allDone) {
        streakCount++;
        streakMap[key] = { state:"today-ok", streakCount };
      } else if (info.done > 0) {
        // 一部完了
        streakMap[key] = { state:"today-partial", streakCount: streakCount+1 };
      } else {
        // 今日タスクがあるが未着手
        streakMap[key] = { state:"today-partial", streakCount: streakCount+1 };
      }
    } else {
      // 過去日
      if (allDone) {
        streakCount++;
        streakMap[key] = { state:"streak", streakCount };
      } else {
        // 未完了 → リセット
        streakCount = 0;
        streakMap[key] = { state:"broken", streakCount: 0 };
      }
    }
    prevKey = key;
  }

  return streakMap;
}

function CalendarView({ goals }) {
  const [cur, setCur] = useState(new Date());
  const year  = cur.getFullYear();
  const month = cur.getMonth();
  const firstDow    = (new Date(year,month,1).getDay()+6)%7;
  const daysInMonth = new Date(year,month+1,0).getDate();

  // 全タスクを日付マップに集約
  const tmap = {};
  goals.forEach(g=>g.bigTasks.forEach(b=>b.midTasks.forEach(m=>m.dailyTasks.forEach(d=>{
    if(!d.date) return;
    if(!tmap[d.date]) tmap[d.date]={total:0,done:0};
    tmap[d.date].total++;
    if(d.done) tmap[d.date].done++;
  }))));

  const streakMap = buildStreakMap(tmap);
  const todayKey  = today();

  // 現在の継続日数（今日時点）
  const currentStreak = (() => {
    const s = streakMap[todayKey];
    if (!s) {
      // 今日タスクがなければ直近の streak カウントを探す
      const pastKeys = Object.keys(streakMap).filter(k=>k<todayKey).sort();
      const last = pastKeys[pastKeys.length-1];
      if (last && streakMap[last].state==="streak") return streakMap[last].streakCount;
      return 0;
    }
    return s.streakCount;
  })();

  const cells = [];
  for(let i=0;i<firstDow;i++) cells.push(null);
  for(let i=1;i<=daysInMonth;i++) cells.push(i);

  // 状態ごとのスタイル定義
  const cellStyle = (state, isTdy, isFirst, isLast) => {
    // streak の連続帯：中間セルは左右に「橋」を伸ばす視覚表現
    const base = {
      aspectRatio:"1",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:2, position:"relative", overflow:"visible",
      transition:"all 0.15s ease",
    };

    if (isTdy && (state==="today-ok"||state==="today-partial")) {
      return { ...base,
        borderRadius:10,
        background: state==="today-ok" ? GOLD_BTN : D.cream,
        border:`2px solid ${D.gold}`,
        boxShadow:`0 2px 14px ${D.goldGlow}`,
      };
    }
    switch(state) {
      case "streak":
        return { ...base,
          borderRadius:10,
          background:`rgba(74,103,65,0.13)`,
          border:`1px solid rgba(74,103,65,0.35)`,
        };
      case "broken":
        return { ...base,
          borderRadius:10,
          background:`rgba(160,60,40,0.06)`,
          border:`1px dashed rgba(160,60,40,0.3)`,
        };
      default:
        return { ...base,
          borderRadius:10,
          background:D.cream,
          border:`1px solid ${D.rim}`,
        };
    }
  };

  return (
    <div>
      {/* 継続日数バナー */}
      <div style={{
        borderRadius:16,
        background: currentStreak > 0 ? `linear-gradient(135deg, rgba(74,103,65,0.1), rgba(172,130,56,0.08))` : D.cream,
        border:`1px solid ${currentStreak > 0 ? "rgba(74,103,65,0.3)" : D.rim}`,
        padding:"16px 20px", marginBottom:18,
        display:"flex", alignItems:"center", gap:16,
        boxShadow:`0 2px 12px rgba(26,23,20,0.06)`,
      }}>
        {/* 炎アイコン or リセットアイコン */}
        <div style={{
          width:48, height:48, borderRadius:12, flexShrink:0,
          background: currentStreak > 0
            ? `linear-gradient(135deg, rgba(74,103,65,0.15), rgba(172,130,56,0.12))`
            : `rgba(160,60,40,0.07)`,
          border:`1px solid ${currentStreak>0?"rgba(74,103,65,0.3)":"rgba(160,60,40,0.2)"}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22,
        }}>
          {currentStreak > 0 ? "🔥" : "○"}
        </div>
        <div style={{ flex:1 }}>
          <Eyebrow color={currentStreak>0 ? "#4A6741" : D.dust}>
            {currentStreak>0 ? "Current Streak" : "Streak Reset"}
          </Eyebrow>
          <div style={{
            fontFamily:"'Shippori Mincho B1',serif",
            fontSize:22, fontWeight:800,
            color: currentStreak>0 ? "#3A5533" : D.sepia,
            lineHeight:1.2, marginTop:4,
            letterSpacing:"0.02em",
          }}>
            {currentStreak > 0
              ? <><span style={{ fontSize:30, color:"#4A6741" }}>{currentStreak}</span> 日連続継続中</>
              : "継続記録なし"
            }
          </div>
          {currentStreak > 0 && (
            <div style={{
              fontSize:10.5, color:D.dust,
              fontFamily:"'Cormorant Garamond',serif",
              fontStyle:"italic", marginTop:2,
            }}>
              今日も完了すれば {currentStreak+1} 日目達成
            </div>
          )}
        </div>
      </div>

      {/* 月ナビ */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
        <button onClick={()=>setCur(d=>new Date(d.getFullYear(),d.getMonth()-1))} style={{
          width:36,height:36,borderRadius:9,border:`1px solid ${D.rim}`,
          background:D.cream,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",color:D.sepia,
        }}>
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
            <path d="M5.5 1.5L1.5 6l4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{
          fontFamily:"'Shippori Mincho B1','Noto Serif JP',serif",
          fontSize:19,fontWeight:700,color:D.sumi,letterSpacing:"0.06em",
        }}>{year}年{month+1}月</div>
        <button onClick={()=>setCur(d=>new Date(d.getFullYear(),d.getMonth()+1))} style={{
          width:36,height:36,borderRadius:9,border:`1px solid ${D.rim}`,
          background:D.cream,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",color:D.sepia,
        }}>
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
            <path d="M1.5 1.5L5.5 6l-4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* 曜日ラベル */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6 }}>
        {["月","火","水","木","金","土","日"].map(d=>(
          <div key={d} style={{
            textAlign:"center",fontSize:12,fontWeight:600,color:D.dust,
            fontFamily:"'Cormorant Garamond',serif",
            fontStyle:"italic",padding:"4px 0",
          }}>{d}</div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4 }}>
        {cells.map((day,i)=>{
          if(!day) return <div key={i}/>;

          const key      = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const info     = tmap[key];
          const streak   = streakMap[key];
          const isTdy    = key===todayKey;
          const isFuture = key > todayKey;
          const state    = streak?.state || (isFuture?"future":"empty");
          const sCount   = streak?.streakCount || 0;
          const pct_     = info ? info.done/info.total : 0;
          const allDone  = info && info.done===info.total;

          // streak 連続帯の橋：左右セルとつながって見せる
          const isStreak    = state==="streak" || (isTdy&&state==="today-ok");
          const prevKey     = (() => { const d=new Date(key+"T00:00"); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })();
          const nextKey     = (() => { const d=new Date(key+"T00:00"); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); })();
          const prevStreak  = streakMap[prevKey]?.state==="streak";
          const nextStreak  = streakMap[nextKey]?.state==="streak" || (nextKey===todayKey&&streakMap[nextKey]?.state==="today-ok");
          const colPos      = (i - cells.indexOf(cells.find((_,ci)=>ci>=firstDow&&ci===i))) % 7;

          return (
            <div key={i} style={{ position:"relative" }}>
              {/* streak 連続橋（左） */}
              {isStreak && prevStreak && (
                <div style={{
                  position:"absolute", top:"50%", left:-4,
                  width:8, height:14,
                  transform:"translateY(-50%)",
                  background:"rgba(74,103,65,0.13)",
                  zIndex:0,
                }}/>
              )}
              {/* streak 連続橋（右） */}
              {isStreak && nextStreak && (
                <div style={{
                  position:"absolute", top:"50%", right:-4,
                  width:8, height:14,
                  transform:"translateY(-50%)",
                  background:"rgba(74,103,65,0.13)",
                  zIndex:0,
                }}/>
              )}

              <div style={{
                ...cellStyle(state, isTdy),
                position:"relative", zIndex:1,
              }}>
                {/* 日数 */}
                <span style={{
                  fontSize:14,
                  fontFamily:"'Noto Sans JP',sans-serif",fontWeight:600,
                  fontWeight: isTdy||isStreak ? 700 : 500,
                  fontStyle: isTdy ? "normal" : "italic",
                  color: isTdy&&state==="today-ok" ? "#fff"
                       : state==="streak"           ? "#3A5533"
                       : state==="broken"           ? "#8C3A28"
                       : state==="today-partial"    ? D.gold
                       : D.faint,
                  lineHeight:1,
                }}>{day}</span>

                {/* 状態インジケーター */}
                {state==="streak" && (
                  <div style={{ marginTop:2,display:"flex",alignItems:"center",gap:1 }}>
                    <div style={{
                      width:14,height:1.5,borderRadius:99,
                      background:"rgba(74,103,65,0.5)",
                    }}/>
                  </div>
                )}

                {state==="broken" && (
                  <div style={{ marginTop:2 }}>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1 1l8 4M9 1L1 5" stroke="rgba(160,60,40,0.45)"
                        strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}

                {(state==="today-ok"||state==="today-partial") && (
                  <span style={{
                    fontSize:7, marginTop:1, lineHeight:1,
                    color: state==="today-ok" ? "rgba(255,255,255,0.85)" : D.gold,
                    fontFamily:"'Cormorant Garamond',serif",
                    fontStyle:"italic",
                  }}>
                    {state==="today-ok"?"✓ today":"today"}
                  </span>
                )}

                {/* タスクあり・完了日（streak以外） */}
                {info && state==="today-partial" && (
                  <div style={{ marginTop:2,width:16,height:1.5,borderRadius:99,background:D.linen,overflow:"hidden" }}>
                    <div style={{ height:"100%",width:`${pct_*100}%`,background:D.gold,borderRadius:99 }}/>
                  </div>
                )}

                {/* streak カウント表示（節目のみ） */}
                {state==="streak" && sCount>0 && sCount%5===0 && (
                  <div style={{
                    position:"absolute", top:-8,
                    background:D.moss||"#4A6741", color:"#fff",
                    fontSize:7.5, borderRadius:4,
                    padding:"1px 4px",
                    fontFamily:"'Cormorant Garamond',serif",
                    fontWeight:700, whiteSpace:"nowrap",
                    boxShadow:"0 1px 4px rgba(0,0,0,0.2)",
                    zIndex:10,
                  }}>{sCount}日</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <GoldRule my={18}/>

      {/* 凡例 */}
      <div style={{ display:"flex",flexWrap:"wrap",alignItems:"center",gap:12 }}>
        {[
          { color:"rgba(74,103,65,0.3)",  border:"1px solid rgba(74,103,65,0.4)", label:"継続完了" },
          { color:`rgba(160,60,40,0.08)`, border:"1px dashed rgba(160,60,40,0.35)", label:"リセット（未完了）" },
          { color:D.cream,               border:`2px solid ${D.gold}`, label:"今日" },
          { color:D.cream,               border:`1px solid ${D.rim}`,  label:"タスクなし" },
        ].map(l=>(
          <div key={l.label} style={{ display:"flex",alignItems:"center",gap:6 }}>
            <div style={{
              width:13,height:13,borderRadius:3,
              background:l.color, border:l.border,
            }}/>
            <span style={{
              fontSize:12,fontWeight:600,color:D.sepia,
              fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",
            }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* 過去リセット履歴メッセージ */}
      {(() => {
        const brokenDays = Object.entries(streakMap)
          .filter(([,v])=>v.state==="broken")
          .map(([k])=>k).sort();
        if(brokenDays.length===0) return null;
        const lastBroken = brokenDays[brokenDays.length-1];
        const daysSince  = Math.floor((new Date(todayKey)-new Date(lastBroken+"T00:00"))/86400000);
        return (
          <div style={{
            marginTop:14,borderRadius:10,
            background:`rgba(160,60,40,0.05)`,
            border:`1px solid rgba(160,60,40,0.15)`,
            padding:"10px 14px",
            display:"flex",alignItems:"center",gap:10,
          }}>
            <span style={{ fontSize:13,flexShrink:0 }}>↺</span>
            <div>
              <div style={{
                fontSize:12,color:"#8C3A28",
                fontFamily:"'Shippori Mincho B1',serif",fontWeight:600,
              }}>
                {fmtDate(lastBroken)} にリセット
              </div>
              <div style={{
                fontSize:12,fontWeight:600,color:D.dust,
                fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",marginTop:1,
              }}>
                {daysSince>0 ? `${daysSince}日前` : "今日"} · 現在 {currentStreak} 日継続中
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HISTORY VIEW
// ═══════════════════════════════════════════════════════════════
function HistoryView({ goals }) {
  const tmap={};
  goals.forEach(g=>g.bigTasks.forEach(b=>b.midTasks.forEach(m=>m.dailyTasks.forEach(d=>{
    if(!d.date) return;
    if(!tmap[d.date]) tmap[d.date]={total:0,done:0};
    tmap[d.date].total++;
    if(d.done) tmap[d.date].done++;
  }))));

  const todayD=new Date();
  const todayDow=(todayD.getDay()+6)%7;
  const monday=new Date(todayD);
  monday.setDate(todayD.getDate()-todayDow);

  const weeks=[];
  for(let w=6;w>=0;w--){
    const week=[];
    for(let d=0;d<7;d++){
      const dd=new Date(monday);
      dd.setDate(monday.getDate()-w*7+d);
      const key=dd.toISOString().slice(0,10);
      week.push({date:key,...(tmap[key]||{total:0,done:0})});
    }
    weeks.push(week);
  }

  const completed=goals.flatMap(g=>
    g.bigTasks.flatMap(b=>
      b.midTasks.flatMap(m=>
        m.dailyTasks.filter(d=>d.done).map(d=>({...d,goalTitle:g.title,midTitle:m.title}))
      )
    )
  );
  const todayKey=today();

  return (
    <div>
      {/* ヒートマップ */}
      <div style={{
        borderRadius:16,background:CARD_BG,border:`1px solid ${D.linen}`,
        padding:"18px 18px",marginBottom:16,
        boxShadow:`0 2px 14px rgba(26,23,20,0.07)`,
        backgroundImage:NOISE,
      }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <Eyebrow color={D.goldDeep}>7-Week Activity</Eyebrow>
          <span style={{
            fontSize:10.5,color:D.gold,
            fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontWeight:600,
          }}>{completed.length} completed</span>
        </div>
        <div style={{ display:"flex",gap:4 }}>
          <div style={{ display:"flex",flexDirection:"column",gap:3,marginRight:4 }}>
            {["月","火","水","木","金","土","日"].map(d=>(
              <div key={d} style={{
                height:14,fontSize:8.5,color:D.faint,
                fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",
                display:"flex",alignItems:"center",
              }}>{d[0]}</div>
            ))}
          </div>
          {weeks.map((week,wi)=>(
            <div key={wi} style={{ flex:1,display:"flex",flexDirection:"column",gap:3 }}>
              {week.map((cell,di)=>{
                const isTdy=cell.date===todayKey;
                const pct_=cell.total?cell.done/cell.total:0;
                const has=cell.total>0;
                return (
                  <div key={di} style={{
                    height:14,borderRadius:3,
                    background:isTdy?D.gold:has?`rgba(172,130,56,${0.1+pct_*0.55})`:"transparent",
                    border:`1px solid ${isTdy?D.gold:has?D.goldBdr:D.rimSoft}`,
                    boxShadow:isTdy?`0 0 6px ${D.goldGlow}`:"none",
                    transition:"all 0.15s ease",
                  }}/>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 完了タスク */}
      {completed.length>0 ? (
        <div style={{
          borderRadius:16,background:CARD_BG,border:`1px solid ${D.linen}`,
          overflow:"hidden",backgroundImage:NOISE,
        }}>
          <div style={{ padding:"14px 18px 12px",borderBottom:`1px solid ${D.rimSoft}`,
            display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <Eyebrow color={D.goldDeep}>Completed</Eyebrow>
            <span style={{ fontSize:12,fontWeight:500,color:D.dust,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic" }}>
              {completed.length} tasks
            </span>
          </div>
          <div style={{ padding:"6px 10px 12px",display:"flex",flexDirection:"column",gap:2 }}>
            {completed.map(d=>(
              <div key={d.id} style={{
                display:"flex",alignItems:"center",gap:11,
                padding:"9px 10px",borderRadius:8,
              }}>
                <div style={{
                  width:18,height:18,borderRadius:4,flexShrink:0,
                  background:D.mossBg,border:`1px solid ${D.mossBdr}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                    <path d="M1 3.5l2 2.5 4-4" stroke={D.moss} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13.5,color:D.dust,textDecoration:"line-through",
                    fontFamily:"'Noto Sans JP',sans-serif",letterSpacing:"0.02em" }}>{d.label}</div>
                  <div style={{ fontSize:11.5,fontWeight:500,color:D.dust,
                    fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",marginTop:1 }}>{d.midTitle}</div>
                </div>
                {d.tag&&<Tag label={d.tag}/>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign:"center",padding:"60px 0" }}>
          <div style={{ fontFamily:"'Shippori Mincho B1',serif",fontSize:15,color:D.faint }}>完了タスクはまだありません</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS VIEW
// ═══════════════════════════════════════════════════════════════
function SettingsView() {
  const items=[
    {icon:"◎",label:"ゴールの管理",sub:"並び替え・アーカイブ"},
    {icon:"⟳",label:"定期タスクの設定",sub:"毎日・毎週繰り返し"},
    {icon:"⌁",label:"データのエクスポート",sub:"CSV・JSONで書き出し"},
    {icon:"⚙",label:"通知の設定",sub:"リマインダーをカスタマイズ"},
    {icon:"◈",label:"進捗を共有",sub:"URLリンクで共有"},
  ];
  return (
    <div>
      <div style={{
        fontFamily:"'Shippori Mincho B1','Noto Serif JP',serif",
        fontSize:22,fontWeight:700,color:D.sumi,marginBottom:22,letterSpacing:"0.04em",
      }}>設定</div>
      <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
        {items.map((r,i)=>(
          <button key={i} style={{
            width:"100%",padding:"15px 16px",borderRadius:13,
            border:`1px solid ${D.rim}`,background:D.cream,
            display:"flex",alignItems:"center",gap:14,
            cursor:"pointer",textAlign:"left",
            transition:"background 0.15s ease",
            boxShadow:`0 1px 4px rgba(26,23,20,0.04)`,
          }}>
            <div style={{
              width:38,height:38,borderRadius:10,
              background:D.ivory,border:`1px solid ${D.linen}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:15,color:D.sepia,flexShrink:0,
            }}>{r.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{
                fontSize:14,color:D.sumi,
                fontFamily:"'Shippori Mincho B1','Noto Serif JP',serif",
                fontWeight:600,letterSpacing:"0.03em",
              }}>{r.label}</div>
              <div style={{ fontSize:13,fontWeight:600,color:D.sepia,fontFamily:"'Noto Sans JP',sans-serif",marginTop:2,fontWeight:500 }}>{r.sub}</div>
            </div>
            <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
              <path d="M1.5 1.5l4 4-4 4" stroke={D.linen} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>
      <GoldRule my={24}/>
      <div style={{
        padding:"22px",borderRadius:16,
        border:`1px solid ${D.rimGold}`,
        background:`linear-gradient(160deg, ${D.goldBg}, rgba(212,184,112,0.04))`,
        textAlign:"center",backgroundImage:NOISE,
      }}>
        <div style={{
          fontFamily:"'Shippori Mincho B1','Noto Serif JP',serif",
          fontSize:15,color:D.sepia,lineHeight:2.2,
          letterSpacing:"0.08em",
        }}>
          小さな行動の積み重ねが<br/>
          <span style={{ color:D.gold,fontWeight:700 }}>大きな景色</span>をつくる
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADD GOAL SHEET
// ═══════════════════════════════════════════════════════════════
function AddGoalSheet({ onClose, onAdd, onAICreate }) {
  const [title,   setTitle]   = useState("");
  const [tag,     setTag]     = useState("副業");
  const [horizon, setHorizon] = useState("");
  const [useAI,   setUseAI]   = useState(false);
  const ref = useRef();
  useEffect(()=>{ setTimeout(()=>ref.current?.focus(),200); },[]);

  const handle = () => {
    if(!title.trim()) return;
    if(useAI){ onAICreate(title.trim(),tag,horizon); return; }
    onAdd({id:uid(),title:title.trim(),tag,horizon,createdAt:today(),bigTasks:[]});
    onClose();
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end" }}>
      <div onClick={onClose} style={{
        position:"absolute",inset:0,
        background:"rgba(26,23,20,0.5)",
        backdropFilter:"blur(14px)",
      }}/>
      <div style={{
        position:"relative",zIndex:1,
        width:"100%",maxWidth:430,margin:"0 auto",
        background:D.cream,
        borderRadius:"24px 24px 0 0",
        border:`1px solid ${D.linen}`,borderBottom:"none",
        padding:"0 24px 52px",
        animation:"sheetUp 0.32s cubic-bezier(.4,0,.2,1)",
        boxShadow:`0 -10px 60px rgba(26,23,20,0.2)`,
        backgroundImage:NOISE,
      }}>
        <div style={{
          height:2,margin:"0 -24px",
          background:`linear-gradient(90deg, transparent, ${D.goldPale}, transparent)`,
          opacity:0.7,
        }}/>
        <div style={{ width:36,height:3,borderRadius:99,background:D.linen,margin:"16px auto 28px" }}/>

        <Eyebrow color={D.goldDeep}>New Goal</Eyebrow>
        <div style={{
          fontFamily:"'Shippori Mincho B1','Noto Serif JP',serif",
          fontSize:22,fontWeight:700,color:D.sumi,
          margin:"8px 0 22px",lineHeight:1.4,letterSpacing:"0.04em",
        }}>新しいゴールを設定する</div>

        <input ref={ref} value={title} onChange={e=>setTitle(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handle()}
          placeholder="例：英語でビジネス会話ができるようになる"
          style={{
            width:"100%",height:52,borderRadius:12,
            border:`1.5px solid ${title?D.goldBdr:D.linen}`,
            background:D.parchment,color:D.charcoal,
            fontSize:14,padding:"0 16px",
            fontFamily:"'Noto Sans JP',sans-serif",
            marginBottom:18,letterSpacing:"0.03em",
            outline:"none",transition:"border-color 0.2s",
          }}/>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18 }}>
          <div>
            <Eyebrow>Tag</Eyebrow>
            <select value={tag} onChange={e=>setTag(e.target.value)} style={{
              width:"100%",height:42,marginTop:8,borderRadius:9,
              border:`1px solid ${D.linen}`,background:D.parchment,
              color:D.charcoal,fontSize:13,padding:"0 12px",
              fontFamily:"'Shippori Mincho B1',serif",cursor:"pointer",outline:"none",
            }}>
              {Object.keys(D.tags).map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Eyebrow>Deadline</Eyebrow>
            <input type="date" value={horizon} onChange={e=>setHorizon(e.target.value)} style={{
              width:"100%",height:42,marginTop:8,borderRadius:9,
              border:`1px solid ${D.linen}`,background:D.parchment,
              color:D.charcoal,fontSize:12,padding:"0 10px",
              fontFamily:"'Cormorant Garamond',serif",cursor:"pointer",outline:"none",
            }}/>
          </div>
        </div>

        <button onClick={()=>setUseAI(!useAI)} style={{
          width:"100%",height:48,borderRadius:12,marginBottom:12,
          border:`1.5px solid ${useAI?D.goldBdr:D.linen}`,
          background:useAI?D.goldBg:"transparent",
          color:useAI?D.gold:D.sepia,
          fontSize:13,cursor:"pointer",
          fontFamily:"'Shippori Mincho B1',serif",letterSpacing:"0.06em",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          transition:"all 0.18s ease",fontWeight:useAI?700:400,
        }}>
          <span>✦</span> AIでタスクを自動生成する
        </button>

        <button onClick={handle} disabled={!title.trim()} style={{
          width:"100%",height:52,borderRadius:14,
          background:title.trim()?GOLD_BTN:"transparent",
          color:title.trim()?"#fff":D.faint,
          border:`1.5px solid ${title.trim()?D.gold:D.linen}`,
          fontSize:14,cursor:title.trim()?"pointer":"default",
          fontFamily:"'Shippori Mincho B1','Noto Serif JP',serif",
          letterSpacing:"0.1em",fontWeight:700,
          transition:"all 0.18s ease",
          boxShadow:title.trim()?`0 4px 20px ${D.goldGlow}`:"none",
          textShadow:title.trim()?"0 1px 2px rgba(0,0,0,0.15)":"none",
        }}>
          {useAI?"AIでタスクを生成する →":"ゴールを追加する"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE HELPERS
// DBからデータを読み込み、ネストした goals 構造に変換する
// ═══════════════════════════════════════════════════════════════

// 暫定ユーザーID（認証実装前は固定値を使う）
const TEMP_USER_ID = "guest-user-001";

async function loadGoalsFromDB() {
  const { data: goals, error: ge } = await supabase
    .from("goals").select("*")
    .eq("user_id", TEMP_USER_ID)
    .order("sort_order");
  if (ge) throw ge;

  const { data: bigTasks } = await supabase
    .from("big_tasks").select("*").order("sort_order");
  const { data: midTasks } = await supabase
    .from("mid_tasks").select("*").order("sort_order");
  const { data: dailyTasks } = await supabase
    .from("daily_tasks").select("*").order("sort_order");

  // ネスト構造に組み立て
  return (goals || []).map(g => ({
    id: g.id, title: g.title, tag: g.tag,
    horizon: g.horizon, createdAt: g.created_at,
    bigTasks: (bigTasks || [])
      .filter(b => b.goal_id === g.id)
      .map(b => ({
        id: b.id, title: b.title,
        midTasks: (midTasks || [])
          .filter(m => m.big_task_id === b.id)
          .map(m => ({
            id: m.id, title: m.title,
            dailyTasks: (dailyTasks || [])
              .filter(d => d.mid_task_id === m.id)
              .map(d => ({
                id: d.id, label: d.label, done: d.done,
                tag: d.tag, date: d.date, mins: d.mins,
              })),
          })),
      })),
  }));
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [goals,          setGoals]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [expandedMids,   setExpandedMids]   = useState([]);
  const [collapsedGoals, setCollapsedGoals] = useState([]);
  const [tab,            setTab]            = useState("today");
  const [showAddGoal,    setShowAddGoal]    = useState(false);
  const [aiTarget,       setAiTarget]       = useState(null);

  // ── 初回ロード ──────────────────────────────────────────────
  useEffect(() => {
    loadGoalsFromDB()
      .then(data => {
        setGoals(data);
        // 最初のmidTaskを展開
        if (data[0]?.bigTasks[0]?.midTasks[0]) {
          setExpandedMids([data[0].bigTasks[0].midTasks[0].id]);
        }
      })
      .catch(err => console.error("DB読み込みエラー:", err))
      .finally(() => setLoading(false));
  }, []);

  const toggleMid  = id => setExpandedMids(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleGoal = id => setCollapsedGoals(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  // ── タスク完了トグル ────────────────────────────────────────
  const toggleTask = async (goalId,bigId,midId,taskId) => {
    // 楽観的UI更新（即座に画面を変える）
    setGoals(p=>p.map(g=>
      g.id!==goalId?g:{...g,bigTasks:g.bigTasks.map(b=>
        b.id!==bigId?b:{...b,midTasks:b.midTasks.map(m=>
          m.id!==midId?m:{...m,dailyTasks:m.dailyTasks.map(d=>
            d.id!==taskId?d:{...d,done:!d.done}
          )}
        )}
      )}
    ));
    // DBに反映
    const goal  = goals.find(g=>g.id===goalId);
    const task  = goal?.bigTasks.flatMap(b=>b.midTasks.flatMap(m=>m.dailyTasks))
                    .find(d=>d.id===taskId);
    if (task) {
      await supabase.from("daily_tasks")
        .update({ done: !task.done })
        .eq("id", taskId);
    }
  };

  // ── タスク追加 ───────────────────────────────────────────────
  const addTask = async (goalId,bigId,midId,task) => {
    // DBに保存
    const { error } = await supabase.from("daily_tasks").insert({
      id: task.id, mid_task_id: midId,
      label: task.label, done: false,
      tag: task.tag, date: task.date, mins: task.mins || 30,
    });
    if (error) { console.error("タスク追加エラー:", error); return; }
    // UI更新
    setGoals(p=>p.map(g=>
      g.id!==goalId?g:{...g,bigTasks:g.bigTasks.map(b=>
        b.id!==bigId?b:{...b,midTasks:b.midTasks.map(m=>
          m.id!==midId?m:{...m,dailyTasks:[...m.dailyTasks,task]}
        )}
      )}
    ));
  };

  // ── タスク削除 ───────────────────────────────────────────────
  const deleteTask = async (goalId,bigId,midId,taskId) => {
    await supabase.from("daily_tasks").delete().eq("id", taskId);
    setGoals(p=>p.map(g=>
      g.id!==goalId?g:{...g,bigTasks:g.bigTasks.map(b=>
        b.id!==bigId?b:{...b,midTasks:b.midTasks.map(m=>
          m.id!==midId?m:{...m,dailyTasks:m.dailyTasks.filter(d=>d.id!==taskId)}
        )}
      )}
    ));
  };

  // ── ゴール追加 ───────────────────────────────────────────────
  const addGoal = async (g) => {
    const { error } = await supabase.from("goals").insert({
      id: g.id, user_id: TEMP_USER_ID,
      title: g.title, tag: g.tag,
      horizon: g.horizon, created_at: g.createdAt,
      sort_order: goals.length,
    });
    if (error) { console.error("ゴール追加エラー:", error); return; }
    setGoals(p=>[...p, g]);
    setShowAddGoal(false);
    setTab("goals");
  };

  // ── AIタスク適用 ─────────────────────────────────────────────
  const applyAI = useCallback(async (goalId, result) => {
    const goal = goals.find(g=>g.id===goalId);
    if (!goal) return;

    const newBigTasks = result.bigTasks.map(b=>({
      id:uid(), title:b.title,
      midTasks:b.midTasks.map(m=>({
        id:uid(), title:m.title,
        dailyTasks:m.dailyTasks.map(d=>({
          id:uid(), label:d.label, done:false,
          tag:goal.tag, date:today(), mins:d.mins||30,
        })),
      })),
    }));

    // DBに一括保存
    for (const b of newBigTasks) {
      await supabase.from("big_tasks").insert({ id:b.id, goal_id:goalId, title:b.title, sort_order:0 });
      for (const m of b.midTasks) {
        await supabase.from("mid_tasks").insert({ id:m.id, big_task_id:b.id, title:m.title, sort_order:0 });
        for (const d of m.dailyTasks) {
          await supabase.from("daily_tasks").insert({
            id:d.id, mid_task_id:m.id, label:d.label,
            done:false, tag:d.tag, date:d.date, mins:d.mins,
          });
        }
      }
    }

    // UI更新
    setGoals(p=>p.map(g=>
      g.id!==goalId?g:{...g,bigTasks:[...g.bigTasks,...newBigTasks]}
    ));
    setAiTarget(null);
    setTab("goals");
  },[goals]);

  const handleAICreate = async (title,tag,horizon) => {
    const ng = {id:uid(),title,tag,horizon,createdAt:today(),bigTasks:[]};
    await addGoal(ng);
    setShowAddGoal(false);
    setAiTarget({goal:ng});
  };

  // ── ローディング画面 ─────────────────────────────────────────
  if (loading) return (
    <div style={{
      minHeight:"100dvh", display:"flex",
      flexDirection:"column", alignItems:"center", justifyContent:"center",
      background:"#F7F7F8", gap:16,
    }}>
      <div style={{ display:"flex",gap:8 }}>
        {[0,0.15,0.3].map((d,i)=>(
          <div key={i} style={{
            width:10,height:10,borderRadius:"50%",
            background:"#B8912A",
            animation:`dot 1.2s ease-in-out ${d}s infinite`,
          }}/>
        ))}
      </div>
      <div style={{
        fontSize:13,color:"#6A6A7A",
        fontFamily:"'Noto Sans JP',sans-serif",
      }}>データを読み込んでいます...</div>
      <style>{`@keyframes dot{0%,100%{opacity:0.2;transform:scale(0.8);}50%{opacity:1;transform:scale(1.1);}}`}</style>
    </div>
  );

  const NAV = [
    { id:"today",    label:"今日",
      icon:a=>(
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2.5" y="3.5" width="13" height="12" rx="2.5"
            stroke={a?D.gold:D.faint} strokeWidth="1.4"/>
          <path d="M6 2v3M12 2v3M2.5 8h13"
            stroke={a?D.gold:D.faint} strokeWidth="1.4" strokeLinecap="round"/>
          {a&&<rect x="5" y="10" width="3" height="2.5" rx="0.8" fill={D.gold} opacity="0.5"/>}
        </svg>
      )},
    { id:"goals",    label:"目標",
      icon:a=>(
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke={a?D.gold:D.faint} strokeWidth="1.4"/>
          <circle cx="9" cy="9" r="4" stroke={a?D.gold:D.faint} strokeWidth="1.4"/>
          <circle cx="9" cy="9" r="1.5" fill={a?D.gold:D.faint}/>
        </svg>
      )},
    { id:"calendar", label:"カレンダー",
      icon:a=>(
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2.5" y="3.5" width="13" height="12" rx="2.5"
            stroke={a?D.gold:D.faint} strokeWidth="1.4"/>
          <path d="M6 2v3M12 2v3M2.5 8h13"
            stroke={a?D.gold:D.faint} strokeWidth="1.4" strokeLinecap="round"/>
          {a&&<>
            <circle cx="6" cy="12" r="1.2" fill={D.gold}/>
            <circle cx="9" cy="12" r="1.2" fill={D.gold} opacity="0.5"/>
            <circle cx="12" cy="12" r="1.2" fill={D.gold} opacity="0.25"/>
          </>}
        </svg>
      )},
    { id:"history",  label:"履歴",
      icon:a=>(
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 5v4.5l2.5 2.5"
            stroke={a?D.gold:D.faint} strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M3.5 3.8A6.5 6.5 0 1 1 2 9"
            stroke={a?D.gold:D.faint} strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M2 4.5V9H6"
            stroke={a?D.gold:D.faint} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )},
    { id:"settings", label:"設定",
      icon:a=>(
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="2.5" stroke={a?D.gold:D.faint} strokeWidth="1.4"/>
          <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4"
            stroke={a?D.gold:D.faint} strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      )},
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Shippori+Mincho+B1:wght@400;600;700;800&family=Noto+Sans+JP:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        html,body{background:#F7F7F8;overscroll-behavior:none;}
        input,select{outline:none;caret-color:${D.gold};}
        input[type="date"]::-webkit-calendar-picker-indicator{opacity:0.4;cursor:pointer;}
        ::-webkit-scrollbar{width:0;}
        button{outline:none;}
        @keyframes sheetUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        @keyframes dot{0%,100%{opacity:0.2;transform:scale(0.8);}50%{opacity:1;transform:scale(1.1);}}
        .page{animation:fadeIn 0.42s cubic-bezier(.4,0,.2,1) both;}
      `}</style>

      <div style={{
        minHeight:"100dvh",
        background:D.parchment,
        maxWidth:430, margin:"0 auto",
        fontFamily:"'Noto Sans JP',sans-serif",
        color:D.charcoal, position:"relative",
      }}>

        {/* ── HEADER ── */}
        <div style={{
          position:"sticky",top:0,zIndex:80,
          background:D.parchment,
          borderBottom:`1px solid ${D.rimSoft}`,
          padding:"48px 22px 14px",
        }}>
          {/* ページ最上部のゴールドライン */}
          <div style={{
            position:"absolute",top:0,left:0,right:0,height:2,
            background:`linear-gradient(90deg, transparent 0%, ${D.goldPale} 35%, ${D.goldHi} 50%, ${D.goldPale} 65%, transparent 100%)`,
            opacity:0.6,
          }}/>

          <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12 }}>
            <div>
              <div style={{
                fontSize:8.5,color:D.faint,
                fontFamily:"'Cormorant Garamond',serif",
                fontStyle:"italic",letterSpacing:"0.2em",marginBottom:5,
              }}>
                {new Date().toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric",weekday:"short"})}
              </div>
              <h1 style={{
                fontFamily:"'Shippori Mincho B1','Noto Serif JP',serif",
                fontSize:24,fontWeight:800,color:D.sumi,
                letterSpacing:"0.04em",lineHeight:1.2,
              }}>
                {tab==="today"    ?"今日のタスク"
                :tab==="goals"   ?"目標 & タスク"
                :tab==="calendar"?"カレンダー"
                :tab==="history" ?"履歴"
                                 :"設定"}
              </h1>
            </div>
            {(tab==="today"||tab==="goals") && (
              <button onClick={()=>setShowAddGoal(true)} style={{
                height:36,padding:"0 16px",borderRadius:10,
                background:GOLD_BTN,color:"#fff",
                border:"none",fontSize:12.5,fontWeight:700,cursor:"pointer",
                fontFamily:"'Shippori Mincho B1',serif",letterSpacing:"0.08em",
                display:"flex",alignItems:"center",gap:6,flexShrink:0,
                boxShadow:`0 2px 14px ${D.goldGlow}`,
                textShadow:"0 1px 2px rgba(0,0,0,0.2)",
              }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 1v9M1 5.5h9" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                ゴール追加
              </button>
            )}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ padding:"20px 18px",paddingBottom:100 }}>
          <div className="page">
            {tab==="today"    && <TodayView goals={goals} onToggleTask={toggleTask} onDeleteTask={deleteTask}/>}
            {tab==="goals"    && <GoalsView goals={goals}
                collapsedGoals={collapsedGoals} onCollapse={toggleGoal}
                expandedMids={expandedMids} onToggleMid={toggleMid}
                onToggleTask={toggleTask} onAddTask={addTask} onDeleteTask={deleteTask}
                onAI={g=>setAiTarget({goal:g})} onAddGoal={()=>setShowAddGoal(true)}/>}
            {tab==="calendar" && <CalendarView goals={goals}/>}
            {tab==="history"  && <HistoryView goals={goals}/>}
            {tab==="settings" && <SettingsView/>}
          </div>
        </div>

        {/* ── BOTTOM NAV ── */}
        <div style={{
          position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:430,
          background:D.cream,
          borderTop:`1px solid ${D.rim}`,
          padding:"8px 10px 24px",
          zIndex:70,
          boxShadow:`0 -2px 20px rgba(26,23,20,0.08)`,
        }}>
          {/* ゴールドトップライン */}
          <div style={{
            position:"absolute",top:0,left:"8%",right:"8%",height:1,
            background:`linear-gradient(90deg, transparent, ${D.rimGold}, transparent)`,
          }}/>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:2 }}>
            {NAV.map(item=>{
              const active=tab===item.id;
              return (
                <button key={item.id} onClick={()=>setTab(item.id)} style={{
                  display:"flex",flexDirection:"column",alignItems:"center",
                  justifyContent:"center",padding:"7px 4px",
                  borderRadius:10,
                  background:active?D.goldBg:"transparent",
                  border:`1px solid ${active?D.goldBdr:"transparent"}`,
                  cursor:"pointer",gap:3,
                  transition:"all 0.18s ease",
                }}>
                  {item.icon(active)}
                  <span style={{
                    fontSize:9,fontFamily:"'Cormorant Garamond',serif",
                    color:active?D.gold:D.faint,
                    fontWeight:active?600:400,
                    letterSpacing:"0.06em",
                    fontStyle:active?"italic":"normal",
                  }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MODALS ── */}
        {showAddGoal && (
          <AddGoalSheet
            onClose={()=>setShowAddGoal(false)}
            onAdd={g=>addGoal(g)}
            onAICreate={handleAICreate}/>
        )}
        {aiTarget && (
          <AIPanel
            goal={aiTarget.goal}
            onAccept={r=>applyAI(aiTarget.goal.id,r)}
            onClose={()=>setAiTarget(null)}/>
        )}
      </div>
    </>
  );
}
