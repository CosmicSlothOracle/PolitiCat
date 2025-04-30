// Polyfill for older browsers
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

// Add event listener polyfill
if (!Element.prototype.matches) {
  Element.prototype.matches = (Element.prototype as any).msMatchesSelector ||
                              Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function(s: string) {
    var el = this;
    do {
      if (el.matches(s)) return el;
      el = el.parentElement || (el as any).parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

// Touch events polyfill
if (!('ontouchstart' in window)) {
  (window as any).ontouchstart = null;
}