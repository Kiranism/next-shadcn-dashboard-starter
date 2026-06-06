/**
 * @file: gupil-attribution.js
 * @description: Deprecated standalone loader — attribution is built into tilda-bonus-widget.js (v2.9.15+).
 *               Kept for backward compatibility if this script was installed separately.
 * @project: SaaS Bonus System
 * @version: 1.1.0
 */
(function () {
  'use strict';

  function runWithWidget(w) {
    if (!w || !w.referralAttribution) return false;
    w.referralAttribution.captureFromUrl(w);
    w.referralAttribution.initDom(w);
    return true;
  }

  if (runWithWidget(window.TildaBonusWidget)) {
    return;
  }

  var attempts = 0;
  var timer = setInterval(function () {
    attempts += 1;
    if (runWithWidget(window.TildaBonusWidget) || attempts > 200) {
      clearInterval(timer);
    }
  }, 50);
})();
