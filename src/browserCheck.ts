export const checkBrowserCompatibility = (): boolean => {
  const issues: string[] = [];

  // Check for basic features
  if (!window.addEventListener) {
    issues.push('Your browser does not support event listeners');
  }

  if (!document.querySelector) {
    issues.push('Your browser does not support modern selectors');
  }

  // Check for ES6 support (avoid eval for CSP friendliness)
  const es6Supported = (function(){ try { new Function('return () => {}')(); return true; } catch { return false; } })();
  if (!es6Supported) {
    issues.push('Your browser does not support modern JavaScript (ES6)');
  }

  // Check for touch support
  if (!('ontouchstart' in window)) {
    console.warn('Touch events are not supported. Using mouse events as fallback.');
  }

  // Log any issues found
  if (issues.length > 0) {
    console.error('Browser compatibility issues:', issues);
    alert(`Some features may not work correctly in your browser:\n${issues.join('\n')}`);
    return false;
  }

  return true;
};

// Export a function to debug click events
export const debugClickEvents = () => {
  // Add global click/touch debug
  document.addEventListener('click', (e) => {
    console.log('Document click on:', e.target);
  });

  document.addEventListener('touchstart', (e) => {
    console.log('Document touchstart on:', e.target);
  });

  // Check pointer events support
  if (window.PointerEvent) {
    document.addEventListener('pointerdown', (e) => {
      console.log('Pointer event:', e.type, e.target);
    });
  } else {
    console.warn('PointerEvents not supported');
  }
};