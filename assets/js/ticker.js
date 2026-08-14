/* Auto-scrolling lists for the "Get to know me" rows.
   The markup ships one copy of each list; this repeats it enough times to fill
   the row twice over, so the loop back to the start is invisible. */
(function () {
  "use strict";

  var SPEED = 42; // px per second, shared by every row so none of them race
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var tracks = Array.prototype.slice.call(document.querySelectorAll(".ticker-track"));
  if (!tracks.length) return;

  tracks.forEach(function (track) {
    var group = track.querySelector(".ticker-group");
    if (group) track._seed = group.cloneNode(true);
  });

  function build(track) {
    var seed = track._seed;
    if (!seed) return;

    track.innerHTML = "";
    var original = seed.cloneNode(true);
    track.appendChild(original);

    if (reduce) {
      track.style.animation = "none";
      return;
    }

    var groupW = original.getBoundingClientRect().width;
    var frameW = track.parentNode.getBoundingClientRect().width;
    if (!groupW) return;

    // enough repeats that one half of the track always covers the visible row
    var reps = Math.max(1, Math.ceil(frameW / groupW));
    var copies = reps * 2 - 1;
    for (var i = 0; i < copies; i++) {
      var clone = seed.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      Array.prototype.forEach.call(clone.querySelectorAll("a"), function (a) {
        a.tabIndex = -1;
      });
      track.appendChild(clone);
    }

    track.style.animationDuration = (groupW * reps / SPEED).toFixed(1) + "s";
  }

  function buildAll() { tracks.forEach(build); }

  // wait for webfonts, or the measured widths are wrong and the loop jumps
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(buildAll);
  } else {
    buildAll();
  }

  /* Rebuild whenever a row's width actually changes. Watching the element
     rather than the window also covers the case where the first measurement
     happened before the row had been laid out. */
  if (window.ResizeObserver) {
    tracks.forEach(function (track) {
      var frame = track.parentNode;
      var last = -1;
      var timer;
      new ResizeObserver(function () {
        var w = Math.round(frame.getBoundingClientRect().width);
        if (w === last) return;
        last = w;
        clearTimeout(timer);
        timer = setTimeout(function () { build(track); }, 120);
      }).observe(frame);
    });
  } else {
    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(buildAll, 200);
    });
  }
})();
