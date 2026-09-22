(() => {
  'use strict';

  const originalAdd = document.addEventListener.bind(document);
  let vigiaNavHandler = null;

  document.addEventListener = function(type, listener, options) {
    if (
      type === 'click' &&
      typeof listener === 'function' &&
      String(listener).includes("closest('[data-page]')")
    ) {
      vigiaNavHandler = listener;
    }
    return originalAdd(type, listener, options);
  };

  originalAdd('click', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest('.nav-btn[data-page]')
      : null;

    if (!target || !vigiaNavHandler) return;

    try {
      vigiaNavHandler.call(document, event);
    } catch (error) {
      console.error('Vigia Cloud navigation error:', error);
      const box = document.createElement('div');
      box.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;max-width:520px;padding:14px 16px;border-radius:10px;background:#991b1b;color:#fff;font:13px/1.4 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.2)';
      box.textContent = 'Erro de navegação: ' + (error && error.message ? error.message : String(error));
      document.body.appendChild(box);
      setTimeout(() => box.remove(), 8000);
    }
  }, true);
})();
