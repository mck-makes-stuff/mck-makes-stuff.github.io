/* Interactive item characteristic curve (2PL IRT).
   P(correct | ability) = 1 / (1 + exp(-a(theta - b)))
   Drag the pink handle to move difficulty, the mint handle to change discrimination. */
(function () {
  "use strict";

  var svg = document.getElementById("irt-plot");
  if (!svg) return;

  var NS = "http://www.w3.org/2000/svg";

  // plot geometry, in viewBox units
  var X0 = 36, X1 = 306, Y0 = 16, Y1 = 148;
  var TH_MIN = -3, TH_MAX = 3;
  var A_MIN = 0.2, A_MAX = 4, B_MIN = -2.5, B_MAX = 2.5;
  var L88 = 2; // logit of ~0.881, where the discrimination handle rides

  // ten anonymized models, spread across the ability range
  var MODELS = [
    { id: "A", th: -2.40 }, { id: "B", th: -1.70 }, { id: "C", th: -1.15 },
    { id: "D", th: -0.60 }, { id: "E", th: -0.20 }, { id: "F", th: 0.30 },
    { id: "G", th: 0.75 }, { id: "H", th: 1.25 }, { id: "I", th: 1.80 },
    { id: "J", th: 2.45 }
  ];

  var a = 1.4, b = 0;

  var inA = document.getElementById("in-a");
  var inB = document.getElementById("in-b");
  var outA = document.getElementById("out-a");
  var outB = document.getElementById("out-b");
  var outPass = document.getElementById("out-pass");

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function xOf(th) { return X0 + (th - TH_MIN) / (TH_MAX - TH_MIN) * (X1 - X0); }
  function yOf(p) { return Y1 - p * (Y1 - Y0); }
  function thOf(x) { return TH_MIN + (x - X0) / (X1 - X0) * (TH_MAX - TH_MIN); }
  function P(th) { return 1 / (1 + Math.exp(-a * (th - b))); }

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ---------- static scaffolding ---------- */
  var gridG = el("g", {});
  [0, 0.5, 1].forEach(function (p) {
    gridG.appendChild(el("line", {
      "class": "plot-grid", x1: X0, x2: X1, y1: yOf(p), y2: yOf(p)
    }));
    var t = el("text", { "class": "plot-label", x: X0 - 6, y: yOf(p) + 2.5, "text-anchor": "end" });
    t.textContent = p === 0.5 ? "0.5" : String(p);
    gridG.appendChild(t);
  });
  gridG.appendChild(el("line", { "class": "plot-frame", x1: X0, x2: X1, y1: Y1, y2: Y1 }));
  gridG.appendChild(el("line", { "class": "plot-frame", x1: X0, x2: X0, y1: Y0, y2: Y1 }));

  var yTitle = el("text", {
    "class": "plot-label", x: 10, y: (Y0 + Y1) / 2,
    "text-anchor": "middle", transform: "rotate(-90 10 " + ((Y0 + Y1) / 2) + ")"
  });
  yTitle.textContent = "chance correct";
  gridG.appendChild(yTitle);

  var xLeft = el("text", { "class": "plot-label", x: X0, y: Y1 + 12 });
  xLeft.textContent = "← weaker model";
  var xRight = el("text", { "class": "plot-label", x: X1, y: Y1 + 12, "text-anchor": "end" });
  xRight.textContent = "stronger model →";
  gridG.appendChild(xLeft);
  gridG.appendChild(xRight);
  svg.appendChild(gridG);

  var fillPath = el("path", { "class": "plot-fill" });
  var linePath = el("path", { "class": "plot-line" });
  svg.appendChild(fillPath);
  svg.appendChild(linePath);

  /* ---------- model dots ---------- */
  var dotsG = el("g", {});
  var dots = MODELS.map(function (m) {
    var hit = el("circle", { "class": "model-hit", r: 9, tabindex: "0", role: "img" });
    var dot = el("circle", { "class": "model-dot", r: 3.4 });
    var title = el("title", {});
    hit.appendChild(title);
    dotsG.appendChild(hit);
    dotsG.appendChild(dot);

    function show() { showTip(m); }
    function hide() { hideTip(); }
    hit.addEventListener("pointerenter", show);
    hit.addEventListener("pointerleave", hide);
    hit.addEventListener("focus", show);
    hit.addEventListener("blur", hide);

    return { m: m, hit: hit, dot: dot, title: title };
  });
  svg.appendChild(dotsG);

  /* ---------- handles ---------- */
  function makeHandle(variant, label) {
    var g = el("g", { "class": "handle " + variant, tabindex: "0", role: "slider", "aria-label": label });
    var halo = el("circle", { "class": "handle-pulse", r: 8.5 });
    var ring = el("circle", { "class": "handle-ring", r: 5 });
    g.appendChild(halo);
    g.appendChild(ring);
    svg.appendChild(g);
    return { g: g, halo: halo, ring: ring };
  }
  var hB = makeHandle("handle-b", "Difficulty");       // pink, at the inflection
  var hA = makeHandle("handle-a", "Discrimination");   // mint, up the slope

  /* ---------- tooltip ---------- */
  var tipG = el("g", { style: "pointer-events:none", opacity: "0" });
  var tipBox = el("rect", { "class": "tooltip-box", height: 13, rx: 3 });
  var tipText = el("text", { "class": "tooltip", y: 0 });
  tipG.appendChild(tipBox);
  tipG.appendChild(tipText);
  svg.appendChild(tipG);

  function showTip(m) {
    var p = P(m.th);
    tipText.textContent = "Model " + m.id + " · " + Math.round(p * 100) + "%";
    var w = tipText.getComputedTextLength() + 10;
    var cx = clamp(xOf(m.th) - w / 2, X0, X1 - w);
    var cy = yOf(p) - 12;
    if (cy < Y0 + 2) cy = yOf(p) + 10;
    tipBox.setAttribute("x", cx);
    tipBox.setAttribute("y", cy - 9.5);
    tipBox.setAttribute("width", w);
    tipText.setAttribute("x", cx + 5);
    tipText.setAttribute("y", cy);
    tipG.setAttribute("opacity", "1");
  }
  function hideTip() { tipG.setAttribute("opacity", "0"); }

  /* ---------- render ---------- */
  function render() {
    var d = "", i, th, x, y;
    for (i = 0; i <= 120; i++) {
      th = TH_MIN + (TH_MAX - TH_MIN) * (i / 120);
      x = xOf(th);
      y = yOf(P(th));
      d += (i ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2);
    }
    linePath.setAttribute("d", d);
    fillPath.setAttribute("d", d + "L" + X1 + "," + Y1 + "L" + X0 + "," + Y1 + "Z");

    var passed = 0;
    dots.forEach(function (o) {
      var p = P(o.m.th);
      if (p >= 0.5) passed++;
      var cx = xOf(o.m.th), cy = yOf(p);
      o.dot.setAttribute("cx", cx);
      o.dot.setAttribute("cy", cy);
      o.hit.setAttribute("cx", cx);
      o.hit.setAttribute("cy", cy);
      o.title.textContent = "Model " + o.m.id + ": " + Math.round(p * 100) + "% chance correct";
    });

    var bx = xOf(b), by = yOf(0.5);
    hB.g.setAttribute("transform", "translate(" + bx + "," + by + ")");
    hB.g.setAttribute("aria-valuenow", b.toFixed(2));

    var thA = clamp(b + L88 / a, TH_MIN, TH_MAX);
    hA.g.setAttribute("transform", "translate(" + xOf(thA) + "," + yOf(P(thA)) + ")");
    hA.g.setAttribute("aria-valuenow", a.toFixed(2));

    outA.textContent = a.toFixed(2);
    outB.textContent = (b < 0 ? "−" : "") + Math.abs(b).toFixed(2);
    outPass.textContent = String(passed);
    inA.value = a;
    inB.value = b;
  }

  /* ---------- dragging ---------- */
  var pt = svg.createSVGPoint();
  function toLocal(evt) {
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    var m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  }

  var dragging = null;

  function startDrag(which) {
    return function (evt) {
      evt.preventDefault();
      dragging = which;
    };
  }

  hB.g.addEventListener("pointerdown", startDrag("b"));
  hA.g.addEventListener("pointerdown", startDrag("a"));

  /* listen on the window, so a fast drag that outruns the cursor still tracks */
  window.addEventListener("pointermove", function (evt) {
    if (!dragging) return;
    evt.preventDefault();
    var th = thOf(toLocal(evt).x);
    if (dragging === "b") {
      b = clamp(th, B_MIN, B_MAX);
    } else {
      var gap = th - b;
      a = gap <= L88 / A_MAX ? A_MAX : clamp(L88 / gap, A_MIN, A_MAX);
    }
    render();
  });

  window.addEventListener("pointerup", function () { dragging = null; });
  window.addEventListener("pointercancel", function () { dragging = null; });

  /* keyboard on the handles, so this works without a mouse */
  function arrows(get, set, step, lo, hi) {
    return function (evt) {
      var k = evt.key, v = get();
      if (k === "ArrowLeft" || k === "ArrowDown") v -= step;
      else if (k === "ArrowRight" || k === "ArrowUp") v += step;
      else if (k === "Home") v = lo;
      else if (k === "End") v = hi;
      else return;
      evt.preventDefault();
      set(clamp(v, lo, hi));
      render();
    };
  }
  hB.g.addEventListener("keydown", arrows(
    function () { return b; }, function (v) { b = v; }, 0.15, B_MIN, B_MAX));
  hA.g.addEventListener("keydown", arrows(
    function () { return a; }, function (v) { a = v; }, 0.15, A_MIN, A_MAX));

  inA.addEventListener("input", function () { a = parseFloat(inA.value); render(); });
  inB.addEventListener("input", function () { b = parseFloat(inB.value); render(); });

  render();
})();
