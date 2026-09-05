(function () {
  function q(sel) {
    var e = document.querySelector(sel);
    if (!e) return null;
    var r = e.getBoundingClientRect();
    var cs = getComputedStyle(e);
    return {
      left: Math.round(r.left),
      width: Math.round(r.width),
      display: cs.display,
      maxWidth: cs.maxWidth,
      cols: cs.gridTemplateColumns,
      paddingLeft: cs.paddingLeft,
    };
  }
  return {
    viewport: window.innerWidth,
    hero: q(".hero"),
    inner: q(".hero__inner"),
    text: q(".hero__text"),
    title: q(".hero__title"),
    scene: q(".hero__scene"),
  };
})();
