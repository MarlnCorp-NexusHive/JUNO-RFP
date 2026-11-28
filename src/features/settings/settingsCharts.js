import { esc } from "./aiSettingsStore.js";

export function donutSVG(parts, center, sub) {
  const tot = parts.reduce((s, p) => s + p.v, 0) || 1;
  const r = 62;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const arcs = parts
    .filter((p) => p.v)
    .map((p) => {
      const len = (p.v / tot) * c;
      const s = `<circle r="${r}" cx="90" cy="90" fill="none" stroke="${p.c}" stroke-width="22" stroke-dasharray="${Math.max(0, len - 2)} ${c}" stroke-dashoffset="${-acc}" transform="rotate(-90 90 90)"><title>${esc(p.l)}: ${p.v}</title></circle>`;
      acc += len;
      return s;
    })
    .join("");
  return `<div class="donut"><svg viewBox="0 0 180 180" width="170" height="170" role="img" aria-label="${esc(parts.map((p) => `${p.l} ${p.v}`).join(", "))}"><circle r="${r}" cx="90" cy="90" fill="none" stroke="var(--line-2)" stroke-width="22"/>${arcs}<text x="90" y="88" text-anchor="middle" style="font:700 26px var(--f);fill:var(--ink)">${center}</text><text x="90" y="108" text-anchor="middle" style="font:500 11px var(--f);fill:var(--muted)">${sub}</text></svg>
  <div class="dleg">${parts.map((p) => `<div><i style="background:${p.c}"></i><span>${esc(p.l)}</span><b class="tnum">${p.v}</b><small class="tnum">${Math.round((p.v / tot) * 100)}%</small></div>`).join("")}</div></div>`;
}

export function hstackSVG(rows, keys, cols, labels) {
  const mx = Math.max(1, ...rows.map((r) => keys.reduce((s, k) => s + (r.v[k] || 0), 0)));
  return `<div class="hstack">${rows
    .map((r) => {
      const tot = keys.reduce((s, k) => s + (r.v[k] || 0), 0);
      return `<div class="hs-row"><span class="hs-l">${r.h || ""}${esc(r.l)}</span><div class="hs-bar">${keys
        .map((k, i) =>
          r.v[k]
            ? `<i style="width:${(r.v[k] / mx) * 100}%;background:${cols[i]}" title="${esc(labels[i])}: ${r.v[k]}"></i>`
            : "",
        )
        .join("")}</div><b class="tnum">${tot}</b></div>`;
    })
    .join("")}</div>
  <div class="legend">${keys.map((k, i) => `<span><i style="background:${cols[i]}"></i>${esc(labels[i])}</span>`).join("")}</div>`;
}

export function barsSVG(cats, series, opt = {}) {
  const W = opt.W || 600;
  const H = opt.H || 240;
  const L = 46;
  const R = 12;
  const T = 14;
  const B = 38;
  const iw = W - L - R;
  const ih = H - T - B;
  const raw = Math.max(1, ...series.flatMap((s) => s.v));
  const step = opt.fmt ? (raw * 1.12) / 4 : Math.max(1, Math.ceil((raw * 1.12) / 4));
  const mx = opt.fmt ? raw * 1.12 : step * 4;
  const y = (v) => T + ih - (v / mx) * ih;
  const bw = iw / cats.length;
  const gw = (bw * 0.72) / series.length;
  let g = "";
  for (let i = 0; i <= 4; i++) {
    const v = step * i;
    g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line-2)"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="ax">${opt.fmt ? opt.fmt(v) : Math.round(v)}</text>`;
  }
  const bars = cats
    .map(
      (c, i) =>
        series
          .map((s, j) => {
            const x = L + i * bw + bw * 0.14 + j * gw;
            return `<rect x="${x}" y="${y(s.v[i])}" width="${gw - 2}" height="${Math.max(0, T + ih - y(s.v[i]))}" rx="3" fill="${s.c}"><title>${esc(c)} · ${esc(s.l)}: ${opt.fmt ? opt.fmt(s.v[i]) : s.v[i]}</title></rect>`;
          })
          .join("") +
        `<text x="${L + i * bw + bw / 2}" y="${H - 14}" text-anchor="middle" class="ax" ${opt.hl === i ? 'style="font-weight:700;fill:var(--ink)"' : ""}>${esc(c)}</text>`,
    )
    .join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(opt.label || "Bar chart")}">${g}${bars}</svg>
  <div class="legend">${series.map((s) => `<span><i style="background:${s.c}"></i>${esc(s.l)}</span>`).join("")}</div>`;
}

export function meterSVG(pct, label) {
  const p = Math.min(100, pct);
  const c = pct >= 100 ? "var(--crit)" : pct >= 80 ? "var(--warn)" : "var(--pine)";
  return `<div class="meter"><div class="meter-bar"><i style="width:${p}%;background:${c}"></i><span class="tick" style="left:80%" title="80% alert"></span></div><div class="meter-l"><span>0</span><span style="position:absolute;left:80%;transform:translateX(-50%)">80%</span><span>${label}</span></div></div>`;
}
