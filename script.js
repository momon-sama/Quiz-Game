const KEY = "tajCustomQuestions";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
const store = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
let done = new Set(), streak = 0, player = "", custom = load(), pool = [], i = 0, score = 0, answered = false;
const $ = id => document.getElementById(id);
const all = () => DEFAULTS.map(q => [...q, 1]).concat(LEVEL2.map(q => [...q, 2]), LEVEL3.map(q => [...q, 3]), HOSP, FO, L4, custom.map(q => [q[0], q[1], q[2], q[3], q[4] || 1]));
const sections = () => [...new Set(all().map(q => q[0]))];

function refreshFilter() {
  const cur = $("filter").value || "All";
  $("filter").innerHTML = '<option value="All">All sections</option>' + sections().map(s => `<option>${s}</option>`).join("");
  $("filter").value = cur;
  $("secs").innerHTML = sections().map(s => `<option value="${s}">`).join("");
}
function start() {
  const f = $("filter").value, lv = $("level").value;
  pool = all().filter(q => (f === "All" || q[0] === f) && (lv === "All" || String(q[4]) === lv));
  pool.sort((a, b) => a[4] - b[4]);
  i = 0; score = 0; streak = 0; done = new Set(); render();
}
function syncJump() {
  const j = $("jump");
  j.max = Math.max(pool.length, 1); j.value = Math.min(i + 1, pool.length);
  $("jl").textContent = "Jump to question " + j.value + " of " + pool.length;
  $("jumpbar").hidden = !pool.length;
  const all_ = $("level").value === "All";
  $("skip2").hidden = !all_ || !pool.some(q => q[4] === 2);
  $("skip3").hidden = !all_ || !pool.some(q => q[4] === 3);
  $("skip4").hidden = !all_ || !pool.some(q => q[4] === 4);
}
function render() {
  const app = $("app"); syncJump();
  if (!pool.length) { app.innerHTML = "<p>No questions yet.</p>"; return; }
  if (i >= pool.length) {
    const pct = score / Math.max(done.size, 1) * 100;
    const rank = pct >= 90 ? "Taj-ready! \u2B50\u2B50\u2B50" : pct >= 70 ? "Great work, almost there! \u2B50\u2B50" : pct >= 50 ? "Good start. Practise once more! \u2B50" : "Keep going, you'll get there! \uD83D\uDCAA";
    app.innerHTML = `<div class="end"><h2 id="cong"></h2><h3>Score: ${score}/${done.size}</h3><p>${rank}</p></div><button class="primary" id="again">Play again</button>`;
    confetti();
    $("cong").textContent = "\uD83C\uDF89 Congratulations, " + player + "!";
    $("again").onclick = start; return;
  }
  const q = pool[i]; answered = false;
  app.innerHTML = `<div class="bar"><span style="width:${(i / pool.length) * 100}%"></span></div><div class="top"><span class="tag">L${q[4]} \u00B7 ${q[0]}</span><span class="tag" id="st">${streak > 1 ? "\uD83D\uDD25 " + streak : ""}</span><span class="tag">${i + 1}/${pool.length}</span></div><div class="q"></div>`;
  app.querySelector(".q").textContent = q[1];
  q[2].forEach((o, k) => {
    const b = document.createElement("button");
    b.className = "choice"; b.textContent = o;
    b.onclick = () => pick(k, b, q);
    app.appendChild(b);
  });
  const fb = document.createElement("div"); fb.id = "fb"; app.appendChild(fb);
  const nx = document.createElement("button");
  nx.className = "primary"; nx.id = "next"; nx.textContent = "Next"; nx.hidden = true;
  nx.onclick = () => { i++; render(); };
  app.appendChild(nx);
}
function pick(k, el, q) {
  if (answered) return; answered = true;
  const bs = document.querySelectorAll(".choice");
  bs[q[3]].classList.add("ok");
  const hit = k === q[3], first = !done.has(i);
  done.add(i);
  if (hit) { if (first) { score++; streak++; } } else { streak = 0; el.classList.add("no"); }
  $("fb").textContent = hit ? ["Nailed it! \u2728", "Spot on! \uD83D\uDD25", "Five-star answer! \u2B50", "Smooth service! \uD83D\uDECE\uFE0F"][Math.floor(Math.random() * 4)] : "Not quite. Answer: " + q[2][q[3]];
  $("fb").style.color = hit ? "var(--ok)" : "var(--no)";
  $("st").textContent = streak > 1 ? "\uD83D\uDD25 " + streak : "";
  $("next").hidden = false;
}
function renderList() {
  $("list").innerHTML = custom.length ? "" : "<p>No custom questions yet.</p>";
  custom.forEach((q, idx) => {
    const d = document.createElement("div"); d.className = "item";
    d.innerHTML = `<div class="tag"></div><div class="t"></div><div class="a"></div>`;
    d.children[0].textContent = q[0]; d.children[1].textContent = q[1];
    d.children[2].textContent = "Answer: " + q[2][q[3]];
    const del = document.createElement("button"); del.textContent = "Delete";
    del.onclick = () => { custom.splice(idx, 1); store(custom); renderList(); refreshFilter(); start(); };
    d.appendChild(del); $("list").appendChild(d);
  });
}
$("save").onclick = () => {
  const sec = $("f-sec").value.trim(), q = $("f-q").value.trim();
  const opts = [0, 1, 2, 3].map(n => $("f-o" + n).value.trim());
  const c = +document.querySelector('input[name="c"]:checked').value;
  if (!sec || !q || opts.some(o => !o)) { $("msg").textContent = "Fill in every field."; return; }
  custom.push([sec, q, opts, c, +$("f-lv").value]); store(custom);
  ["f-q", "f-o0", "f-o1", "f-o2", "f-o3"].forEach(id => $(id).value = "");
  $("msg").textContent = "Saved! Total custom: " + custom.length;
  refreshFilter(); renderList(); start();
};
$("export").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(custom, null, 2)], { type: "application/json" }));
  a.download = "my-questions.json"; a.click();
};
$("import").onclick = () => $("file").click();
$("file").onchange = e => {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (Array.isArray(d)) { custom = custom.concat(d.filter(q => Array.isArray(q) && (q.length === 4 || q.length === 5))); store(custom); refreshFilter(); renderList(); start(); }
    } catch (err) { alert("Invalid file"); }
  };
  r.readAsText(e.target.files[0]);
};
document.querySelectorAll(".tab").forEach(t => t.onclick = () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x === t));
  ["quiz", "add", "mine"].forEach(s => $(s).hidden = s !== t.dataset.tab);
});
$("filter").onchange = start;
$("level").onchange = start;
$("jump").oninput = e => { i = +e.target.value - 1; render(); };
[2, 3, 4].forEach(n => $("skip" + n).onclick = () => { const k = pool.findIndex(q => q[4] === n); if (k >= 0) { i = k; render(); } });
refreshFilter(); renderList(); start();

function begin() {
  const n = $("name").value.trim();
  if (!n) { $("nmsg").textContent = "Please enter your name."; return; }
  player = n;
  $("welcome").hidden = true; $("main").hidden = false;
  start();
}
$("go").onclick = begin;
$("name").onkeydown = e => { if (e.key === "Enter") begin(); };

function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas"); c.className = "confetti";
  c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
  const x = c.getContext("2d"), cols = ["#f5b82e", "#2ec4a6", "#ff5d73", "#6ea8ff", "#fff"];
  const ps = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -Math.random() * c.height * .5, w: 6 + Math.random() * 6, v: 2 + Math.random() * 4, d: Math.random() * 2 - 1, col: cols[Math.floor(Math.random() * 5)] }));
  const t0 = Date.now();
  (function f() {
    x.clearRect(0, 0, c.width, c.height);
    ps.forEach(p => { p.y += p.v; p.x += p.d * 2; x.fillStyle = p.col; x.fillRect(p.x, p.y, p.w, p.w * .6); });
    if (Date.now() - t0 < 3500) requestAnimationFrame(f); else c.remove();
  })();
}
