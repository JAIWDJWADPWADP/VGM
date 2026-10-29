'use strict';

// Create and activate a form at https://formspree.io, verify its recipient,
// then paste its public endpoint here, for example https://formspree.io/f/abcdefgh.
// This is a public form ID, not a secret API key. Never put secret keys in this file.
const FORMSPREE_ENDPOINT = '';
const FORM_REQUEST_TIMEOUT_MS = 15000;

const header = document.querySelector('#header');
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const scrollProgress = document.querySelector('.scroll-progress');
const backTop = document.querySelector('.back-top');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function closeMenu(returnFocus = false) {
  navigation?.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.setAttribute('aria-label', 'Открыть меню');
  if (returnFocus) toggle?.focus();
}

toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  navigation?.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation?.classList.contains('open')) closeMenu(true);
});
document.addEventListener('click', event => {
  if (header && !header.contains(event.target)) closeMenu();
});
window.matchMedia('(min-width: 1100px)').addEventListener('change', () => closeMenu());
header?.addEventListener('focusout', event => {
  if (event.relatedTarget && !header.contains(event.relatedTarget)) closeMenu();
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const hash = link.getAttribute('href');
    if (location.hash !== hash) history.pushState(null, '', hash);
    closeMenu();
    target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
});

function updateScroll() {
  header?.classList.toggle('scrolled', window.scrollY > 30);
  if (backTop) {
    const visible = window.scrollY >= 550;
    backTop.classList.toggle('show', visible);
    backTop.tabIndex = visible ? 0 : -1;
    backTop.setAttribute('aria-hidden', String(!visible));
  }
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollProgress) scrollProgress.style.transform = `scaleX(${distance > 0 ? Math.min(window.scrollY / distance, 1) : 0})`;
}
let scrollFrame = 0;
function scheduleScroll() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    updateScroll();
    scrollFrame = 0;
  });
}
window.addEventListener('scroll', scheduleScroll, { passive: true });
window.addEventListener('resize', scheduleScroll, { passive: true });
if (backTop) backTop.hidden = false;
updateScroll();
backTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  document.querySelector('.brand')?.focus({ preventScroll: true });
});
window.addEventListener('popstate', () => {
  const target = document.getElementById(location.hash.slice(1) || 'home');
  if (!target) return;
  target.scrollIntoView({ behavior: 'instant' });
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

// Start with visible content; opt into motion only when the browser supports it.
const revealElements = [...document.querySelectorAll('.reveal')];
const stages = [...document.querySelectorAll('.steps li')];
const countElements = [...document.querySelectorAll('[data-count]')];
let revealObserver;
let stageObserver;
let countObserver;

document.querySelectorAll('.service-grid, .equipment-catalog, .results-grid, .about-stats').forEach(group => {
  [...group.children].forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${(index % 4) * 90}ms`);
  });
});
stages.forEach((stage, index) => stage.style.setProperty('--stage-delay', `${index * 120}ms`));

function finishMotion() {
  document.documentElement.classList.remove('js-motion');
  revealElements.forEach(element => element.classList.add('visible'));
  stages.forEach(stage => stage.classList.add('stage-visible'));
  countElements.forEach(element => {
    element.textContent = Number(element.dataset.count).toLocaleString('ru-RU');
  });
  revealObserver?.disconnect();
  stageObserver?.disconnect();
  countObserver?.disconnect();
}

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible', 'reveal-entering');
      setTimeout(() => entry.target.classList.remove('reveal-entering'), 1000);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  stageObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('stage-visible');
      stageObserver.unobserve(entry.target);
    });
  }, { threshold: 0.25 });
  countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      countObserver.unobserve(entry.target);
      const element = entry.target;
      const value = Number(element.dataset.count);
      const start = performance.now();
      function frame(now) {
        const progress = reducedMotion.matches ? 1 : Math.min((now - start) / 1200, 1);
        element.textContent = Math.round(value * (1 - Math.pow(1 - progress, 3))).toLocaleString('ru-RU');
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }, { threshold: 0.7 });
  document.documentElement.classList.add('js-motion');
  revealElements.forEach(element => revealObserver.observe(element));
  stages.forEach(stage => stageObserver.observe(stage));
  countElements.forEach(element => countObserver.observe(element));
} else {
  finishMotion();
}
reducedMotion.addEventListener('change', event => {
  // Once shown, content stays visible even if the preference changes again.
  if (event.matches) finishMotion();
});

if ('IntersectionObserver' in window) {
  const links = [...document.querySelectorAll('#navigation a[href^="#"]')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('section[id]').forEach(section => spy.observe(section));
}

// Overlay panels do not move surrounding content. Inert excludes collapsed text.
document.querySelectorAll('.machine-card').forEach(card => {
  const button = card.querySelector('.machine-toggle');
  const panel = document.getElementById(button?.getAttribute('aria-controls'));
  if (!button || !panel || !card.contains(panel)) return;
  let closeTimer;
  function setExpanded(open) {
    clearTimeout(closeTimer);
    button.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
    panel.toggleAttribute('inert', !open);
    if (open) card.classList.add('details-open');
    else if (reducedMotion.matches) card.classList.remove('details-open');
    else closeTimer = setTimeout(() => card.classList.remove('details-open'), 350);
  }
  card.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      button.focus({ preventScroll: true });
      setExpanded(false);
    }
  });
  button.addEventListener('click', () => setExpanded(button.getAttribute('aria-expanded') !== 'true'));
});

const contactForm = document.querySelector('#contact-form');
if (contactForm) {
  const submit = contactForm.querySelector('.form-submit');
  const submitLabel = submit.querySelector('.submit-label');
  const status = document.querySelector('#form-status');
  const fields = [
    { element: contactForm.elements.namedItem('name'), error: document.querySelector('#name-error') },
    { element: contactForm.elements.namedItem('phone'), error: document.querySelector('#phone-error') },
    { element: contactForm.elements.namedItem('email'), error: document.querySelector('#email-error') },
    { element: contactForm.elements.namedItem('message'), error: document.querySelector('#comment-error') },
    { element: contactForm.elements.namedItem('consent'), error: document.querySelector('#consent-error') }
  ];
  const originalSubmitLabel = submitLabel.textContent;
  let sending = false;

  function setState(state, message = '') {
    contactForm.dataset.state = state;
    contactForm.setAttribute('aria-busy', String(state === 'loading'));
    status.textContent = message;
    submitLabel.textContent = state === 'loading' ? 'Отправляем…' : originalSubmitLabel;
  }

  function validateField(field) {
    const input = field.element;
    const value = input.value.trim();
    let message = '';
    if (input.name === 'consent') {
      if (!input.checked) message = 'Подтвердите согласие на обработку данных.';
    } else if (input.required && !value) {
      const requiredMessages = {
        name: 'Укажите ваше имя.',
        phone: 'Укажите номер телефона.',
        email: 'Укажите адрес электронной почты.'
      };
      message = requiredMessages[input.name] || 'Заполните поле.';
    } else if (input.maxLength > 0 && value.length > input.maxLength) {
      message = `Используйте не более ${input.maxLength} символов.`;
    } else if (input.name === 'phone' && value) {
      const digits = value.replace(/\D/g, '');
      if (!/^\+?[\d\s().-]+$/.test(value) || digits.length < 10 || digits.length > 15) {
        message = 'Введите номер с кодом страны: от 10 до 15 цифр.';
      }
    } else if (input.name === 'email' && value && input.validity.typeMismatch) {
      message = 'Введите адрес в формате name@example.ru.';
    }
    input.setCustomValidity(message);
    input.setAttribute('aria-invalid', String(Boolean(message)));
    field.error.textContent = message;
    return !message;
  }

  fields.forEach(field => {
    field.element.addEventListener('blur', () => {
      if (!sending) validateField(field);
    });
    field.element.addEventListener('input', () => {
      if (field.element.getAttribute('aria-invalid') === 'true') validateField(field);
      if (!sending && contactForm.dataset.state !== 'idle') setState('idle');
    });
  });

  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;

    // A filled hidden field indicates an automated submission; do not send it.
    if (contactForm.elements.namedItem('_gotcha').value.trim()) {
      setState('error', 'Не удалось отправить заявку. Позвоните нам: +7 (911) 394-92-00.');
      return;
    }
    fields.forEach(field => {
      if (field.element.type !== 'checkbox') field.element.value = field.element.value.trim();
    });
    const invalid = fields.filter(field => !validateField(field));
    if (invalid.length) {
      setState('error', 'Проверьте отмеченные поля и отправьте заявку ещё раз.');
      invalid[0].element.focus();
      return;
    }
    if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(FORMSPREE_ENDPOINT)) {
      setState('error', 'Отправка заявок временно недоступна. Позвоните нам: +7 (911) 394-92-00.');
      return;
    }

    const data = new FormData(contactForm);
    data.set('_subject', 'Новая заявка с сайта «Велгазмаркет»');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FORM_REQUEST_TIMEOUT_MS);
    const controls = [...contactForm.elements].map(element => [element, element.disabled]);
    sending = true;
    controls.forEach(([element]) => { element.disabled = true; });
    setState('loading', 'Отправляем заявку. Пожалуйста, подождите.');
    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      let result;
      try { result = await response.json(); } catch (_) { result = null; }
      if (!response.ok || result?.ok !== true) {
        const message = response.status === 429
          ? 'Слишком много попыток. Подождите немного и попробуйте снова или позвоните нам.'
          : response.status === 422
            ? 'Сервис не принял заявку. Проверьте данные и попробуйте ещё раз или позвоните нам.'
            : 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните: +7 (911) 394-92-00.';
        setState('error', message);
        return;
      }
      contactForm.reset();
      fields.forEach(field => {
        field.element.setCustomValidity('');
        field.element.removeAttribute('aria-invalid');
        field.error.textContent = '';
      });
      setState('success', 'Спасибо! Заявка отправлена. Мы свяжемся с вами по указанным контактам.');
    } catch (error) {
      setState('error', error.name === 'AbortError'
        ? 'Ответ от сервиса задерживается. Заявка могла быть получена; позвоните нам, чтобы уточнить: +7 (911) 394-92-00.'
        : 'Не удалось получить ответ от сервиса. Проверьте соединение или позвоните: +7 (911) 394-92-00.');
    } finally {
      clearTimeout(timeout);
      sending = false;
      controls.forEach(([element, disabled]) => { element.disabled = disabled; });
      // The live region announces the result; keyboard focus returns to the button.
      submit.focus({ preventScroll: true });
    }
  });
  // Accessible custom messages take over only after the handler is installed.
  contactForm.noValidate = true;
  submit.disabled = false;
  setState('idle');
}
