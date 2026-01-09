/**
 * Interactive JavaScript Features for Landing Page
 * Implements smooth scrolling, progressive enhancement, and user feedback
 * @generated-from: TASK-004
 * @version: 1.0.0
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION & CONSTANTS
  // ============================================
  const CONFIG = {
    smoothScrollDuration: 800,
    smoothScrollEasing: 'easeInOutCubic',
    debounceDelay: 150,
    loadingStateDelay: 300,
    errorDisplayDuration: 5000,
    reducedMotionQuery: '(prefers-reduced-motion: reduce)',
  };

  const SELECTORS = {
    navLinks: 'nav a[href^="#"]',
    ctaButton: '.cta-button',
    skipLink: '.skip-link',
    allInteractiveLinks: 'a[href^="#"]',
  };

  const ARIA_LABELS = {
    loading: 'Loading, please wait',
    success: 'Action completed successfully',
    error: 'An error occurred',
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Check if user prefers reduced motion
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    return window.matchMedia(CONFIG.reducedMotionQuery).matches;
  }

  /**
   * Easing function for smooth animations
   * @param {number} t - Progress (0 to 1)
   * @returns {number} Eased value
   */
  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Debounce function to limit execution rate
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Safely get element by selector with error handling
   * @param {string} selector - CSS selector
   * @returns {Element|null}
   */
  function safeQuerySelector(selector) {
    try {
      return document.querySelector(selector);
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * Safely get elements by selector with error handling
   * @param {string} selector - CSS selector
   * @returns {NodeList}
   */
  function safeQuerySelectorAll(selector) {
    try {
      return document.querySelectorAll(selector);
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return [];
    }
  }

  /**
   * Get element's offset top position
   * @param {Element} element - Target element
   * @returns {number}
   */
  function getElementOffsetTop(element) {
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return rect.top + scrollTop;
  }

  /**
   * Log structured message with context
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  function log(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (level === 'error') {
      console.error(message, logEntry);
    } else if (level === 'warn') {
      console.warn(message, logEntry);
    } else {
      console.log(message, logEntry);
    }
  }

  // ============================================
  // SMOOTH SCROLLING IMPLEMENTATION
  // ============================================

  /**
   * Smooth scroll to target element
   * @param {Element} target - Target element to scroll to
   * @param {number} duration - Animation duration in milliseconds
   */
  function smoothScrollTo(target, duration) {
    if (!target) {
      log('warn', 'Smooth scroll target not found');
      return;
    }

    // Use native smooth scroll if user prefers reduced motion
    if (prefersReducedMotion()) {
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
      return;
    }

    // Check for native smooth scroll support
    if ('scrollBehavior' in document.documentElement.style) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Fallback to custom smooth scroll implementation
    const startPosition = window.pageYOffset;
    const targetPosition = getElementOffsetTop(target);
    const distance = targetPosition - startPosition;
    const startTime = performance.now();

    function animation(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);
      const position = startPosition + distance * easeProgress;

      window.scrollTo(0, position);

      if (progress < 1) {
        requestAnimationFrame(animation);
      } else {
        // Ensure target is focused for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        log('info', 'Smooth scroll completed', { targetId: target.id });
      }
    }

    requestAnimationFrame(animation);
  }

  /**
   * Handle smooth scroll link clicks
   * @param {Event} event - Click event
   */
  function handleSmoothScrollClick(event) {
    const link = event.currentTarget;
    const href = link.getAttribute('href');

    if (!href || !href.startsWith('#')) {
      return;
    }

    const targetId = href.substring(1);
    if (!targetId) {
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) {
      log('warn', 'Scroll target not found', { targetId });
      return;
    }

    event.preventDefault();

    // Update URL without triggering scroll
    if (history.pushState) {
      history.pushState(null, '', href);
    } else {
      window.location.hash = href;
    }

    smoothScrollTo(target, CONFIG.smoothScrollDuration);

    log('info', 'Smooth scroll initiated', {
      from: link.textContent.trim(),
      to: targetId,
    });
  }

  /**
   * Initialize smooth scrolling for all anchor links
   */
  function initSmoothScrolling() {
    const links = safeQuerySelectorAll(SELECTORS.allInteractiveLinks);

    if (links.length === 0) {
      log('info', 'No smooth scroll links found');
      return;
    }

    links.forEach(link => {
      link.addEventListener('click', handleSmoothScrollClick);
    });

    log('info', 'Smooth scrolling initialized', { linkCount: links.length });
  }

  // ============================================
  // LOADING STATE MANAGEMENT
  // ============================================

  /**
   * Add loading state to button
   * @param {Element} button - Button element
   */
  function addLoadingState(button) {
    if (!button) return;

    const originalText = button.textContent;
    button.setAttribute('data-original-text', originalText);
    button.setAttribute('aria-busy', 'true');
    button.setAttribute('aria-label', ARIA_LABELS.loading);
    button.disabled = true;
    button.classList.add('loading');

    log('info', 'Loading state added', { buttonText: originalText });
  }

  /**
   * Remove loading state from button
   * @param {Element} button - Button element
   */
  function removeLoadingState(button) {
    if (!button) return;

    const originalText = button.getAttribute('data-original-text');
    if (originalText) {
      button.textContent = originalText;
    }

    button.removeAttribute('data-original-text');
    button.removeAttribute('aria-busy');
    button.removeAttribute('aria-label');
    button.disabled = false;
    button.classList.remove('loading');

    log('info', 'Loading state removed');
  }

  /**
   * Handle CTA button click with loading state
   * @param {Event} event - Click event
   */
  function handleCtaClick(event) {
    const button = event.currentTarget;
    const href = button.getAttribute('href');

    // Only handle anchor links
    if (!href || !href.startsWith('#')) {
      return;
    }

    event.preventDefault();

    // Add loading state briefly for user feedback
    addLoadingState(button);

    setTimeout(() => {
      removeLoadingState(button);

      // Proceed with smooth scroll
      const targetId = href.substring(1);
      const target = document.getElementById(targetId);

      if (target) {
        if (history.pushState) {
          history.pushState(null, '', href);
        }
        smoothScrollTo(target, CONFIG.smoothScrollDuration);
      }
    }, CONFIG.loadingStateDelay);

    log('info', 'CTA button clicked', { href });
  }

  /**
   * Initialize CTA button interactions
   */
  function initCtaButtons() {
    const ctaButtons = safeQuerySelectorAll(SELECTORS.ctaButton);

    if (ctaButtons.length === 0) {
      log('info', 'No CTA buttons found');
      return;
    }

    ctaButtons.forEach(button => {
      button.addEventListener('click', handleCtaClick);
    });

    log('info', 'CTA buttons initialized', { buttonCount: ctaButtons.length });
  }

  // ============================================
  // SCROLL BEHAVIOR ENHANCEMENTS
  // ============================================

  /**
   * Handle scroll events for header shadow
   */
  const handleScroll = debounce(() => {
    const header = safeQuerySelector('header');
    if (!header) return;

    const scrolled = window.pageYOffset > 10;
    header.classList.toggle('scrolled', scrolled);
  }, CONFIG.debounceDelay);

  /**
   * Initialize scroll enhancements
   */
  function initScrollEnhancements() {
    window.addEventListener('scroll', handleScroll, { passive: true });
    log('info', 'Scroll enhancements initialized');
  }

  // ============================================
  // ACCESSIBILITY ENHANCEMENTS
  // ============================================

  /**
   * Handle skip link functionality
   */
  function initSkipLink() {
    const skipLink = safeQuerySelector(SELECTORS.skipLink);
    if (!skipLink) {
      log('info', 'Skip link not found');
      return;
    }

    skipLink.addEventListener('click', event => {
      event.preventDefault();
      const target = document.getElementById('main');
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        window.scrollTo(0, 0);
        log('info', 'Skip link activated');
      }
    });

    log('info', 'Skip link initialized');
  }

  /**
   * Enhance keyboard navigation
   */
  function initKeyboardNavigation() {
    document.addEventListener('keydown', event => {
      // Handle Escape key to close any open modals or menus
      if (event.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
      }
    });

    log('info', 'Keyboard navigation initialized');
  }

  // ============================================
  // ERROR HANDLING & RECOVERY
  // ============================================

  /**
   * Global error handler
   * @param {ErrorEvent} event - Error event
   */
  function handleGlobalError(event) {
    log('error', 'Global JavaScript error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error ? event.error.stack : null,
    });

    // Prevent default error handling in production
    if (window.location.hostname !== 'localhost') {
      event.preventDefault();
    }
  }

  /**
   * Unhandled promise rejection handler
   * @param {PromiseRejectionEvent} event - Rejection event
   */
  function handleUnhandledRejection(event) {
    log('error', 'Unhandled promise rejection', {
      reason: event.reason,
      promise: event.promise,
    });

    event.preventDefault();
  }

  /**
   * Initialize error handlers
   */
  function initErrorHandlers() {
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    log('info', 'Error handlers initialized');
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize all interactive features
   */
  function init() {
    // Check if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    try {
      log('info', 'Initializing interactive features');

      // Initialize error handlers first
      initErrorHandlers();

      // Initialize core features
      initSmoothScrolling();
      initCtaButtons();
      initScrollEnhancements();
      initSkipLink();
      initKeyboardNavigation();

      log('info', 'All interactive features initialized successfully');
    } catch (error) {
      log('error', 'Failed to initialize interactive features', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  // Start initialization
  init();

  // ============================================
  // PUBLIC API (if needed for testing)
  // ============================================
  if (typeof window !== 'undefined') {
    window.LandingPageInteractive = {
      version: '1.0.0',
      smoothScrollTo,
      prefersReducedMotion,
    };
  }
})();