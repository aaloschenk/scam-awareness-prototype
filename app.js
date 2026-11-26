const groups = window.schemeGroups;
const all = groups.flatMap(group => group.items);
const byId = new Map(all.map(item => [item.id, item]));
const main = document.querySelector('main');
const header = document.querySelector('.header');
const catalogLink = document.querySelector('#catalog-link');
const state = { group: -1, query: '' };

function updateHeader() {
  const panel = main.querySelector('.signals');
  header.classList.toggle('is-scrolled', !panel && window.scrollY > 0);
  header.inert = Boolean(panel && panel.getBoundingClientRect().top <= 0);
}
const detailSize = new ResizeObserver(entries => {
  for (const { target } of entries) {
    target.style.setProperty('--detail-height', `${target.offsetHeight}px`);
  }
});

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const button = (href, label) => `<a class="button" href="${href}">${label}</a>`;

const firstSteps = [
  'Не торопитесь и никому не сообщайте коды.',
  'Проверьте запрос через официальный сайт или приложение.',
  'Сохраните переписку и обратитесь в поддержку.',
];

function home() {
  const featured = [
    [10, 'Звонок якобы из банка', 'Банки и деньги', 'coins'],
    [19, 'Фальшивая доставка', 'Маркетплейсы', 'box'],
    [9, 'Подработка от имени Uzum', 'Работа и заработок', 'tools'],
  ];
  return `
    <section class="hero home-hero">
      <div class="container hero-inner">
        <div class="hero-copy"><h1>Безопасность<br>начинается<br>со&nbsp;знаний</h1>
          <p>Разбираем схемы мошенников на реальных примерах и рассказываем, как защитить свои деньги и не попасться на обман</p>
          <a class="button play-button" href="https://t.me/access_demo_2026_bot">Играть сейчас</a>
        </div>
        <img class="hero-art" src="assets/hero.png" alt="">
      </div>
    </section>
    <section class="sheet"><div class="container">
      <h2>Популярные схемы</h2>
      <div class="three-column">${featured.map(([id, title, category, asset]) => `
        <a class="featured" href="#/scheme/${id}">
          <h3>${title}</h3><p>${escapeHtml(byId.get(id).description)}</p>
          <div class="featured-bottom">
            <span class="tag">${category}</span><img src="assets/${asset}.png" alt="">
          </div>
        </a>`).join('')}</div>
      ${button('#/schemes', 'Ко всем схемам')}
    </div></section>
    <section class="sheet purple"><div class="container">
      <h2>Что делать в первую очередь?</h2>
      <ol class="three-column steps">${firstSteps.map((step, index) => `<li><span>${index + 1}</span><p>${step}</p></li>`).join('')}</ol>
      <div class="help-banner"><div><h3>Уже сообщили код или перевели деньги?</h3>
        <p>Свяжитесь с банком через приложение или по номеру на карте.</p></div>
        <button class="button" type="button" disabled>Срочная помощь</button></div>
    </div></section>
    <section class="sheet faq"><div class="container">
      <h2>Часто задаваемые вопросы</h2>
      <details open><summary>Как проверить, что сообщение действительно от банка?</summary>
        <p>Откройте приложение банка самостоятельно и проверьте уведомления и операции. Если сомневаетесь, напишите в поддержку через приложение.</p></details>
      <details><summary>Что делать, если я перешёл по подозрительной ссылке?</summary>
        <p>Закройте страницу. Если вы ввели платёжные данные или пароль, свяжитесь с банком и смените скомпрометированный пароль.</p></details>
    </div></section>`;
}

function catalog() {
  const labels = ['Все', ...groups.map(group => group.name)];
  return `
    <section class="sheet catalog"><div class="container">
      <h1>Все схемы</h1>
      <label class="search"><span class="visually-hidden">Поиск по схемам</span>
        <input type="search" id="search" placeholder="Поиск по всем схемам" value="${escapeHtml(state.query)}">
        <span class="search-icon" aria-hidden="true"></span>
      </label>
      <div class="filters" role="group" aria-label="Категории">
        ${labels.map((name, index) => `<button type="button" data-filter="${index - 1}"
          aria-pressed="${state.group === index - 1}">${escapeHtml(name)}</button>`).join('')}
      </div>
      <p id="result-count" class="visually-hidden" role="status"></p>
      <div id="results"></div>
    </div></section>`;
}

function typeset(text) {
  return text
    .replace(/(?<![\p{L}\p{N}])(а|без|бы|в|во|да|для|до|за|и|из|к|ко|ли|на|над|не|ни|но|о|об|от|по|под|при|про|с|со|у|же) +(?=\S)/giu, '$1\u00a0')
    .replace(/(\d) +(?=\d{3}(?:\D|$)|сум(?!\p{L})|%)/giu, '$1\u00a0')
    .replace(/ +(—|–)/gu, '\u00a0$1');
}

function typesetContent(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    node.data = typeset(node.data);
  }
}

const normalize = text => text.toLowerCase().replaceAll('ё', 'е').replace(/\s+/g, ' ').trim();

function renderResults() {
  const query = normalize(state.query);
  const visible = groups.map((group, index) => ({
    ...group,
    items: state.group === -1 || state.group === index
      ? group.items.filter(item => normalize(`${item.title} ${item.description} ${item.sender}`).includes(query))
      : [],
  })).filter(group => group.items.length);
  const results = document.querySelector('#results');
  const count = visible.reduce((sum, group) => sum + group.items.length, 0);
  document.querySelector('#result-count').textContent = `Найдено схем: ${count}`;
  results.innerHTML = visible.length ? visible.map(group => `
    <section class="category"><h2>${escapeHtml(group.name)}</h2>
      <ul>${group.items.map(item => `<li><a class="scheme-row" href="#/scheme/${item.id}">
        <div><strong>${escapeHtml(item.title)}</strong><span class="scheme-description">${escapeHtml(item.description)}</span></div>
        <span class="row-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" focusable="false">
            <path d="M2 10h16m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </a></li>`).join('')}</ul>
    </section>`).join('') : '<p class="empty">Ничего не найдено. Попробуйте изменить запрос или выбрать другую категорию.</p>';
  typesetContent(results);
}

function guidanceLine(text) {
  const separator = text.indexOf(':');
  return separator === -1
    ? escapeHtml(text)
    : `<strong>${escapeHtml(text.slice(0, separator + 1))}</strong>${escapeHtml(text.slice(separator + 1))}`;
}

function detail(item) {
  return `
    <section class="hero detail-hero"><div class="container hero-inner">
      <div class="hero-copy"><h1>${escapeHtml(item.title)}</h1><div class="guidance">
        <p>${guidanceLine(item.risk)}</p><p>${guidanceLine(item.advice)}</p>
      </div></div>
      <div class="phone"><div class="phone-screen" aria-label="Пример сообщения">
        <img class="phone-status" src="assets/chat-status.png" alt="">
        <div class="chat-header"><span aria-hidden="true">‹</span><img class="avatar" src="assets/chat-avatar.png" alt=""><strong>${escapeHtml(item.sender)}</strong></div>
        <div class="chat-content">
          <div class="chat-bubble"><img class="avatar" src="assets/chat-avatar.png" alt="">
            <p class="message">${escapeHtml(item.message)}<small aria-hidden="true">9:41</small></p>
          </div>
          <img class="chat-reply" src="assets/chat-reply.png" alt="">
        </div>
      </div></div>
    </div></section>
    <section class="sheet signals"><div class="container">
      <h2>Что выдаёт обман</h2>
      <ol>${item.signals.map(([title, description], index) => `
        <li><span class="signal-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
          <h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></li>`).join('')}</ol>
      ${button('#/schemes', 'Ко всем схемам')}
    </div></section>`;
}

function route() {
  detailSize.disconnect();
  const segments = location.hash.slice(1).split('/').filter(Boolean);
  const [page, id] = segments;
  const item = page === 'scheme' && byId.get(Number(id));
  let pageTitle = 'Безопасность начинается со знаний';
  if (!page) {
    main.innerHTML = home();
  } else if (page === 'schemes') {
    pageTitle = 'Все схемы';
    main.innerHTML = catalog();
    renderResults();
    document.querySelector('#search').addEventListener('input', event => {
      state.query = event.target.value;
      renderResults();
    });
    document.querySelector('.filters').addEventListener('click', event => {
      const target = event.target.closest('[data-filter]');
      if (!target) return;
      state.group = Number(target.dataset.filter);
      document.querySelectorAll('[data-filter]').forEach(tab => {
        tab.setAttribute('aria-pressed', String(tab === target));
      });
      renderResults();
    });
  } else if (item) {
    pageTitle = item.title;
    main.innerHTML = detail(item);
    detailSize.observe(main.querySelector('.detail-hero'));
  } else {
    pageTitle = 'Страница не найдена';
    main.innerHTML = `<section class="sheet help-page"><div class="container"><h1>${pageTitle}</h1>${button('#/schemes', 'Ко всем схемам')}</div></section>`;
  }
  document.title = `${pageTitle} · Uzum`;
  catalogLink.href = page === 'schemes' ? '#/' : '#/schemes';
  catalogLink.textContent = typeset(page === 'schemes' ? 'На главную' : '☰ Схемы');
  typesetContent(main);
  if (page === 'schemes') catalogLink.removeAttribute('aria-current');
}

window.addEventListener('hashchange', () => {
  route();
  window.scrollTo(0, 0);
  updateHeader();
  main.focus({ preventScroll: true });
});
window.addEventListener('scroll', updateHeader, { passive: true });
document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
});
for (const region of document.querySelectorAll('header, footer, .desktop-notice')) typesetContent(region);
route();
updateHeader();
