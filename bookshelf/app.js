// ============================================================
//  우리 반 책장 — 날마다 활동하는 10월 활동 책 템플릿
//  책은 이 브라우저(IndexedDB)에 저장됩니다. 다른 기기와 함께 쓰려면
//  [내보내기]로 받은 .json 파일을 옮겨 주세요.
// ============================================================

// 날짜별 주제 — 참고 자료의 기념일 예시입니다. 날짜와 이름을 확인해서 바꿔 쓰세요.
const DAY_TITLES = [
  "",
  "International Music Day", "National Custodian Day", "National Techies Day", "World Animal Day",
  "It's A Mystery!", "Mad Hatter Day", "World Architecture Day", "Ada Lovelace Day",
  "World Post Day", "National Book Month", "World Egg Day", "National Savings Day",
  "World Bullying Prevention Month", "Indigenous Peoples' Day", "Global Handwashing Day",
  "World Food Day", "National Pasta Day", "Alaska Day", "International Sloth Day",
  "Wolf Awareness Week", "National Reptile Day", "National Color Day", "Weird Al's Birthday",
  "Bat Appreciation Week", "National Fine Art Day", "National Pumpkin Day", "National Black Cat Day",
  "National First Responders Day", "Emotional Wellness Month", "National Checklist Day", "Halloween",
];
const WEEKS = [[1, 7], [8, 14], [15, 22], [23, 31]];
const CHECKLIST = [
  "주제에 대해 한 가지 찾아보기",
  "친구에게 알려 줄 사실 한 가지 쓰기",
  "사진이나 그림으로 표현하기",
  "내 생각을 한 줄로 쓰기",
  "오늘의 한 줄 소감 쓰기",
];
const DECO = ["🎃", "🦇", "🕸️", "👻", "🍂", "🌙"];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
const val = (p, key) => p.fields?.[key] ?? "";

let toastTimer = null;
function toast(msg, ms = 3000) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), ms);
}

// ---- 저장 (IndexedDB) -------------------------------------------
const DB_NAME = "classbook";
const STORE = "kv";
const BOOKS_KEY = "books";
let dbPromise = null;
let books = [];
let storageReady = true;   // 불러오기에 실패하면 덮어쓰기를 막기 위해 false
let saveTimer = null;
let dirty = false;

function getDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}
async function dbGet(key) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(key, value) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
async function loadBooks() {
  try {
    books = (await dbGet(BOOKS_KEY)) || [];
  } catch (e) {
    console.error("책 불러오기 실패", e);
    storageReady = false;
    toast("이 브라우저에서는 저장 공간을 쓸 수 없어요. 내보내기로 백업해 주세요", 6000);
  }
}
function scheduleSave() {
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveBooks, 400);
}
async function saveBooks() {
  clearTimeout(saveTimer);
  dirty = false;
  if (!storageReady) {
    toast("이 브라우저에서는 저장되지 않아요. 내보내기로 백업해 주세요", 5000);
    return;
  }
  try {
    await dbPut(BOOKS_KEY, books);
  } catch (e) {
    console.error("저장 실패", e);
    toast("저장에 실패했어요. 저장 공간을 확인하고 내보내기로 백업해 주세요", 6000);
  }
}
window.addEventListener("pagehide", () => { if (dirty) saveBooks(); });

// ---- 책 만들기 (10월 템플릿) -------------------------------------
function makePage(type, fields = {}, extra = {}) {
  return { id: uid(), type, fields, images: {}, ...extra };
}

function contentsFields() {
  const f = { title: "목차" };
  WEEKS.forEach(([from, to], i) => {
    const lines = [];
    for (let d = from; d <= to; d++) lines.push(`10월 ${d}일  ${DAY_TITLES[d]}`);
    f[`wt${i + 1}`] = `10월 ${from}일 ~ ${to}일`;
    f[`wl${i + 1}`] = lines.join("\n");
  });
  return f;
}

function dayPage(d) {
  const variant = ["A", "B", "C"][(d - 1) % 3];
  const title = DAY_TITLES[d];
  const fields = {
    date: `10월 ${d}일`,
    title: title || "오늘의 활동",
    prompt: title
      ? `주제 「${title}」와(과) 관련해 알고 있는 것과 새로 알게 된 것을 적어 보세요.`
      : "오늘 하루를 돌아보며 떠오른 생각을 적어 보세요.",
  };
  if (variant === "A") Object.assign(fields, { q1: "새로 알게 된 것은?", q2: "가장 기억에 남는 것은?", q3: "친구에게 한 문장으로 소개한다면?" });
  if (variant === "B") CHECKLIST.forEach((text, i) => { fields[`c${i + 1}`] = text; });
  if (variant === "C") fields.q1 = "오늘 나의 생각은?";
  return makePage("day", fields, { variant, day: d });
}

function makeBook(title) {
  const pages = [
    makePage("cover", { title, subtitle: "우리 반 10월 이야기", name: "(    )반  이름:" }),
    makePage("welcome", {
      title: "환영해요!",
      subtitle: "우리 반 10월 활동 책에 온 것을 환영해요",
      body: "10월 한 달 동안 매일 하나씩 활동하며 함께 배우고 생각해 봐요.\n날짜별 활동을 채우고, 마지막 쪽에서 한 달을 돌아봐요.",
      caption: "우리 반 사진을 넣어 보세요",
    }),
    makePage("contents", contentsFields()),
  ];
  for (let d = 1; d <= 31; d++) pages.push(dayPage(d));
  pages.push(makePage("closing", {
    title: "한 달을 돌아보며",
    prompt: "이번 달 활동 중 가장 기억에 남는 것을 골라 사진을 넣고 적어 보세요.",
    q1: "가장 기억에 남는 활동은?",
    a1: "",
    q2: "10월의 나에게 한마디!",
    a2: "",
  }));
  return { id: uid(), title, createdAt: Date.now(), pages };
}

function normalizePage(p) {
  return { ...p, id: p.id || uid(), type: String(p.type), fields: { ...(p.fields || {}) }, images: { ...(p.images || {}) } };
}

// ---- 화면 조각 만들기 ---------------------------------------------
// 글 칸: 누르면 바로 고칠 수 있는 편집 영역
function ed(p, key, { cls = "", ph = "", single = false } = {}) {
  return `<div class="ed ${cls}" contenteditable="true" spellcheck="false" data-f="${key}" data-ph="${esc(ph)}"${single ? " data-single" : ""}>${esc(val(p, key))}</div>`;
}

// 사진 칸: 누르면 사진을 고를 수 있고, 사진이 있으면 뺄 수 있음
function slot(p, key, label, cls = "") {
  const src = p.images?.[key];
  return `<div class="slot ${cls}" role="button" tabindex="0" data-slot="${key}" aria-label="${esc(label)} 넣기">${src ? `<img src="${esc(src)}" alt="${esc(label)}" />` : `<span class="ph">📷 ${esc(label)}<br />눌러서 넣기</span>`}${src ? `<button class="slot-x" data-clear="${key}" title="사진 빼기" aria-label="사진 빼기">✕</button>` : ""}</div>`;
}

// 표지의 스티커 장식 (이모지라서 어느 기기에서도 같게 보임)
function deco() {
  return `<div class="deco" aria-hidden="true">${DECO.map((e, i) => `<span style="top:${(i * 37) % 78 + 6}%;left:${(i * 53) % 84 + 4}%;transform:rotate(${i % 2 ? -14 : 12}deg)">${e}</span>`).join("")}</div>`;
}

function qa(p, i) {
  return `<div class="qa">${ed(p, `q${i}`, { cls: "q-label", single: true, ph: "질문" })}<div class="answer">${ed(p, `a${i}`, { cls: "a-text", ph: "여기에 답을 적어 주세요" })}</div></div>`;
}

function checkRow(p, i) {
  const on = val(p, `ck${i}`) === "1" ? " checked" : "";
  return `<div class="check-row"><input type="checkbox" data-ck="ck${i}"${on} aria-label="항목 ${i} 완료" />${ed(p, `c${i}`, { cls: "c-text", single: true, ph: "할 일" })}</div>`;
}

function wk(p, n) {
  return `<div class="wk wk${n}">${ed(p, `wt${n}`, { cls: "wk-t", single: true, ph: "기간" })}${ed(p, `wl${n}`, { cls: "wk-l", ph: "날짜별 주제" })}</div>`;
}

function dayParts(p) {
  const v = p.variant || "A";
  const head = `${ed(p, "date", { cls: "date-chip", single: true, ph: "날짜" })}${ed(p, "title", { cls: "h-day", single: true, ph: "오늘의 주제" })}${ed(p, "prompt", { cls: "prompt", ph: "활동 안내" })}`;
  if (v === "A") return [
    `<div class="page l">${head}${slot(p, "img1", "사진")}</div>`,
    `<div class="page r">${[1, 2, 3].map((i) => qa(p, i)).join("")}</div>`,
  ];
  if (v === "B") return [
    `<div class="page l">${head}<div class="two">${slot(p, "img1", "사진 1")}${slot(p, "img2", "사진 2")}</div></div>`,
    `<div class="page r check-page">${[1, 2, 3, 4, 5].map((i) => checkRow(p, i)).join("")}</div>`,
  ];
  return [
    `<div class="page l">${head}${slot(p, "img1", "사진")}</div>`,
    `<div class="page r">${qa(p, 1)}</div>`,
  ];
}

function spreadParts(p) {
  switch (p.type) {
    case "cover":
      return [
        `<div class="page l cover-art">${slot(p, "img1", "표지", "full")}${deco()}</div>`,
        `<div class="page r dark cover-right">${ed(p, "title", { cls: "cover-title", single: true, ph: "책 제목" })}${ed(p, "subtitle", { cls: "cover-sub", single: true, ph: "부제" })}${ed(p, "name", { cls: "cover-name", single: true, ph: "(    )반 이름" })}</div>`,
      ];
    case "welcome":
      return [
        `<div class="page l welcome-l">${ed(p, "title", { cls: "h-welcome", single: true, ph: "환영 인사" })}${ed(p, "subtitle", { cls: "w-sub", single: true, ph: "부제" })}${ed(p, "body", { cls: "w-body", ph: "인사말을 적어 주세요" })}</div>`,
        `<div class="page r dark">${slot(p, "img1", "우리 반 사진")}${ed(p, "caption", { cls: "caption", single: true, ph: "사진 설명" })}</div>`,
      ];
    case "contents":
      return [
        `<div class="page l">${ed(p, "title", { cls: "h-contents", single: true, ph: "목차" })}${wk(p, 1)}${wk(p, 2)}</div>`,
        `<div class="page r">${wk(p, 3)}${wk(p, 4)}</div>`,
      ];
    case "day":
      return dayParts(p);
    case "closing":
      return [
        `<div class="page l dark">${ed(p, "title", { cls: "h-day", single: true, ph: "제목" })}${ed(p, "prompt", { cls: "prompt", ph: "안내 문구" })}${slot(p, "img1", "한 달 사진")}</div>`,
        `<div class="page r">${qa(p, 1)}${qa(p, 2)}</div>`,
      ];
    default:
      return [`<div class="page l"></div>`, `<div class="page r"></div>`];
  }
}

function spreadName(p) {
  const names = { cover: "표지", welcome: "환영 인사", contents: "목차", closing: "한 달 돌아보기" };
  return names[p.type] || `10월 ${p.day}일 · ${val(p, "title")}`;
}

function spreadHtml(p, active) {
  const cls = p.type === "day" ? `day day-${p.variant || "A"}` : p.type;
  return `<section class="spread ${cls}${active ? " active" : ""}" data-pid="${p.id}" aria-label="${esc(spreadName(p))}">${spreadParts(p).join("")}</section>`;
}

// ---- 책장 ---------------------------------------------------------
function renderShelf() {
  const shelf = $("shelf");
  if (!books.length) {
    shelf.innerHTML = `<p class="shelf-empty">아직 책이 없어요.<br />아래 버튼으로 10월 템플릿 책을 만들어 보세요.</p>`;
    return;
  }
  shelf.innerHTML = books.map((b, i) => `<button class="spine s${i % 6}" data-open="${esc(b.id)}" title="${esc(b.title)}"><span>${esc(b.title)}</span></button>`).join("");
}

// ---- 책 읽기 ------------------------------------------------------
let bookId = null;
let current = 0;
let pendingSlot = null;

const curBook = () => books.find((b) => b.id === bookId) || null;
const findPage = (pid) => curBook()?.pages.find((p) => p.id === pid) || null;

function openBook(id) {
  bookId = id;
  const b = curBook();
  if (!b) return;
  $("reader-title").textContent = b.title;
  $("stage").innerHTML = b.pages.map((p) => spreadHtml(p, false)).join("");
  $("shelf-view").classList.add("hidden");
  $("reader-view").classList.remove("hidden");
  goTo(0);
  window.scrollTo(0, 0);
}

function backToShelf() {
  bookId = null;
  $("reader-view").classList.add("hidden");
  $("shelf-view").classList.remove("hidden");
  renderShelf();
  window.scrollTo(0, 0);
}

function goTo(i, scroll = false) {
  const b = curBook();
  if (!b || !b.pages.length) return;
  current = Math.min(Math.max(i, 0), b.pages.length - 1);
  [...$("stage").children].forEach((el, k) => el.classList.toggle("active", k === current));
  $("page-label").textContent = spreadName(b.pages[current]);
  $("spread-no").textContent = `${current + 1} / ${b.pages.length}`;
  $("prev").disabled = current === 0;
  $("next").disabled = current === b.pages.length - 1;
  if (scroll) $("stage").scrollIntoView({ behavior: "smooth", block: "start" });
}

// 사진이나 지우기 후 그 쪽만 다시 그림 (보고 있던 쪽은 그대로 유지)
function rerender(p) {
  const old = $("stage").querySelector(`[data-pid="${p.id}"]`);
  if (!old) return;
  old.outerHTML = spreadHtml(p, old.classList.contains("active"));
}

// 사진 고르기: 크기를 줄여 저장 (저장 공간 절약)
function shrinkImage(file, max = 1280) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d");
      const png = file.type === "image/png";
      if (!png) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL(png ? "image/png" : "image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("사진을 읽을 수 없어요. JPG나 PNG 사진으로 다시 넣어 주세요"));
    };
    img.src = url;
  });
}

function openPicker(pid, key) {
  pendingSlot = { pid, key };
  $("image-input").click();
}

function exportBook() {
  const b = curBook();
  if (!b) return;
  const blob = new Blob([JSON.stringify({ format: "classbook", version: 1, book: b })], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${b.title.replace(/[\\/:*?"<>|]+/g, "_").trim() || "책"}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("책 파일을 받았어요. 다른 기기에서는 [파일에서 가져오기]로 열어 주세요 💾", 4000);
}

// ---- 이벤트 ------------------------------------------------------
$("new-book").addEventListener("click", () => {
  const title = window.prompt("새 책 이름", "10월 활동 책");
  if (!title || !title.trim()) return;
  const b = makeBook(title.trim());
  books.push(b);
  scheduleSave();
  openBook(b.id);
});

$("import-file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const b = data?.book;
    if (data?.format !== "classbook" || !b || !Array.isArray(b.pages) || !b.pages.length) throw new Error("format");
    books.push({ ...b, id: uid(), title: String(b.title || "가져온 책"), pages: b.pages.map(normalizePage) });
    scheduleSave();
    renderShelf();
    toast("책을 가져왔어요 📚");
  } catch {
    toast("이 파일은 우리 반 책장 책 파일이 아니에요");
  }
});

$("shelf").addEventListener("click", (e) => {
  const spine = e.target.closest("[data-open]");
  if (spine) openBook(spine.dataset.open);
});

$("back-shelf").addEventListener("click", backToShelf);
$("prev").addEventListener("click", () => goTo(current - 1, true));
$("next").addEventListener("click", () => goTo(current + 1, true));
$("print-book").addEventListener("click", () => window.print());
$("export-book").addEventListener("click", exportBook);

$("rename-book").addEventListener("click", () => {
  const b = curBook();
  if (!b) return;
  const t = window.prompt("책 이름", b.title);
  if (!t || !t.trim()) return;
  b.title = t.trim();
  $("reader-title").textContent = b.title;
  scheduleSave();
});

$("delete-book").addEventListener("click", () => {
  const b = curBook();
  if (!b) return;
  if (!window.confirm(`「${b.title}」 책을 삭제할까요?\n삭제하면 되돌릴 수 없어요. 필요하면 먼저 내보내기로 백업해 주세요.`)) return;
  books = books.filter((x) => x.id !== b.id);
  saveBooks();
  backToShelf();
});

document.addEventListener("keydown", (e) => {
  if ($("reader-view").classList.contains("hidden")) return;
  if (e.target.isContentEditable || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key === "ArrowRight") goTo(current + 1, true);
  if (e.key === "ArrowLeft") goTo(current - 1, true);
});

const stage = $("stage");

stage.addEventListener("click", (e) => {
  const clear = e.target.closest("[data-clear]");
  if (clear) {
    e.stopPropagation();
    const p = findPage(clear.closest("[data-pid]").dataset.pid);
    if (!p) return;
    delete p.images[clear.dataset.clear];
    scheduleSave();
    rerender(p);
    return;
  }
  const slotEl = e.target.closest("[data-slot]");
  if (slotEl) openPicker(slotEl.closest("[data-pid]").dataset.pid, slotEl.dataset.slot);
});

stage.addEventListener("keydown", (e) => {
  if (e.target.matches("[data-slot]") && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    e.target.click();
  }
  // 제목처럼 한 줄인 칸에서는 Enter로 줄을 나누지 않음
  if (e.key === "Enter" && e.target.hasAttribute("data-single")) e.preventDefault();
});

stage.addEventListener("input", (e) => {
  const el = e.target.closest("[data-f]");
  const p = el && findPage(el.closest("[data-pid]").dataset.pid);
  if (!p) return;
  p.fields[el.dataset.f] = el.innerText.replace(/\n+$/, "");
  scheduleSave();
});

stage.addEventListener("change", (e) => {
  const cb = e.target;
  if (!cb.matches("input[data-ck]")) return;
  const p = findPage(cb.closest("[data-pid]").dataset.pid);
  if (!p) return;
  p.fields[cb.dataset.ck] = cb.checked ? "1" : "";
  scheduleSave();
});

// 붙여넣기는 글자만 들어가게 (복사한 서식이 편집 칸을 깨뜨리지 않도록)
stage.addEventListener("paste", (e) => {
  const el = e.target.closest?.("[data-f]");
  if (!el) return;
  e.preventDefault();
  let text = (e.clipboardData || window.clipboardData).getData("text/plain");
  if (el.hasAttribute("data-single")) text = text.replace(/\s*\n\s*/g, " ");
  document.execCommand("insertText", false, text);
});

$("image-input").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  const target = pendingSlot;
  pendingSlot = null;
  if (!file || !target) return;
  const p = findPage(target.pid);
  if (!p) return;
  try {
    p.images[target.key] = await shrinkImage(file);
    scheduleSave();
    rerender(p);
  } catch (err) {
    toast(err.message, 5000);
  }
});

// ---- 시작 --------------------------------------------------------
(async function init() {
  await loadBooks();
  renderShelf();
})();
