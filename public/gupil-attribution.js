/**
 * @file: gupil-attribution.js
 * @description: First-touch referral attribution for Tilda and static sites.
 *               Captures utm_ref / utm_org from URL → localStorage + cookie → hidden form fields.
 * @project: SaaS Bonus System
 * @version: 1.0.0
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'gupil_attribution_v1';
  var COOKIE_REF = 'gupil_utm_ref';
  var COOKIE_ORG = 'gupil_utm_org';
  var DEFAULT_TTL_DAYS = 30;

  var config = window.GUPIL_ATTRIBUTION_CONFIG || {};
  var ttlDays =
    typeof config.ttlDays === 'number' && config.ttlDays > 0
      ? config.ttlDays
      : DEFAULT_TTL_DAYS;
  var maxAgeSec = Math.floor(ttlDays * 86400);

  function log() {
    if (!config.debug) return;
    var args = ['[Gupil Attribution]'].concat(
      Array.prototype.slice.call(arguments)
    );
    console.log.apply(console, args);
  }

  function readQuery() {
    try {
      return new URLSearchParams(window.location.search);
    } catch (e) {
      return null;
    }
  }

  function setCookie(name, value) {
    try {
      document.cookie =
        name +
        '=' +
        encodeURIComponent(value) +
        '; path=/; max-age=' +
        maxAgeSec +
        '; SameSite=Lax';
    } catch (e) {
      /* ignore */
    }
  }

  function getCookie(name) {
    try {
      var match = document.cookie.match(
        new RegExp(
          '(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'
        )
      );
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null;
    }
  }

  function loadStored() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.ref) return null;
      if (data.expiresAt && Date.now() > data.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveStored(ref, org) {
    if (!ref) return;
    var payload = {
      ref: ref,
      org: org || null,
      landing: window.location.pathname,
      capturedAt: Date.now(),
      expiresAt: Date.now() + ttlDays * 86400000
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      /* ignore */
    }
    setCookie(COOKIE_REF, ref);
    if (org) setCookie(COOKIE_ORG, org);
    log('saved', payload);
  }

  function captureFromUrl() {
    var params = readQuery();
    if (!params) return;

    var ref = params.get('utm_ref') || params.get('utmRef');
    var org = params.get('utm_org') || params.get('utmOrg');

    if (ref) {
      saveStored(ref, org);
      return;
    }

    var stored = loadStored();
    if (!stored) {
      var cookieRef = getCookie(COOKIE_REF);
      var cookieOrg = getCookie(COOKIE_ORG);
      if (cookieRef) saveStored(cookieRef, cookieOrg);
    }
  }

  function ensureHiddenInput(form, name, value) {
    if (!value) return;
    var existing = form.querySelector('input[name="' + name + '"]');
    if (existing) {
      if (!existing.value) existing.value = value;
      return;
    }
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  function injectForms() {
    var stored = loadStored();
    var ref = stored && stored.ref ? stored.ref : getCookie(COOKIE_REF);
    var org = (stored && stored.org) || getCookie(COOKIE_ORG) || null;

    if (!ref) return;

    var forms = document.querySelectorAll('form');
    forms.forEach(function (form) {
      ensureHiddenInput(form, 'utm_ref', ref);
      if (org) ensureHiddenInput(form, 'utm_org', org);
    });

    log('injected into', forms.length, 'form(s)', { ref: ref, org: org });
  }

  function onSubmitCapture(e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    var stored = loadStored();
    var ref = (stored && stored.ref) || getCookie(COOKIE_REF);
    var org = (stored && stored.org) || getCookie(COOKIE_ORG);
    if (ref) ensureHiddenInput(form, 'utm_ref', ref);
    if (org) ensureHiddenInput(form, 'utm_org', org);
  }

  function init() {
    captureFromUrl();
    injectForms();

    document.addEventListener('submit', onSubmitCapture, true);

    if (typeof MutationObserver !== 'undefined') {
      var debounce;
      var observer = new MutationObserver(function () {
        clearTimeout(debounce);
        debounce = setTimeout(injectForms, 300);
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    log('initialized', { ttlDays: ttlDays });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
