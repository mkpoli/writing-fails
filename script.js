const buttons = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.card')];
const grid = document.querySelector('.cards');
const search = document.querySelector('#search');
const empty = document.querySelector('.empty');
const sentinel = document.querySelector('.cards-sentinel');
const status = document.querySelector('.gallery-status');
const state = { kind: 'all', lang: 'all' };

// Show the collection in a fresh arrangement on every visit.
for (let i = cards.length - 1; i > 0; i -= 1) {
  const j = Math.floor(Math.random() * (i + 1));
  [cards[i], cards[j]] = [cards[j], cards[i]];
}
grid.append(...cards);

let matches = cards;
let shown = 0;

// Every card stays in the generated HTML for crawlers and no-JS readers. The
// browser only paints three rows at a time: three cards on phones, twelve on
// wide screens, following the same breakpoints as the grid.
const batchSize = () => {
  const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
  return Math.max(columns, 1) * 3;
};

const observer = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) reveal();
    }, { rootMargin: '0px 0px 600px 0px' })
  : null;

if (observer) observer.observe(sentinel);

function announce() {
  if (!status) return;
  status.textContent = matches.length
    ? (status.dataset.template || '')
        .replace('{shown}', shown)
        .replace('{total}', matches.length)
    : empty.textContent;
}

function numberCards() {
  matches.forEach((card, index) => {
    const badge = card.querySelector('.image-index');
    if (badge) badge.textContent = badge.textContent.replace(/^\d+/, String(index + 1).padStart(2, '0'));
  });
}

function reveal() {
  if (!observer) {
    matches.forEach(card => { card.hidden = false; });
    shown = matches.length;
    sentinel.hidden = true;
    announce();
    return;
  }
  if (shown >= matches.length) {
    sentinel.hidden = true;
    announce();
    return;
  }
  sentinel.hidden = false;
  do {
    const batch = matches.slice(shown, shown + batchSize());
    if (!batch.length) break;
    batch.forEach(card => { card.hidden = false; });
    shown += batch.length;
  } while (shown < matches.length && sentinel.getBoundingClientRect().top < window.innerHeight + 600);
  sentinel.hidden = shown >= matches.length;
  announce();
}

function update() {
  const query = search.value.trim().toLowerCase();
  matches = cards.filter(card => {
    const matchesKind = state.kind === 'all' || card.dataset.kind === state.kind;
    const matchesLang = state.lang === 'all' || card.dataset.lang === state.lang;
    const matchesQuery = (card.textContent + ' ' + card.dataset.keywords).toLowerCase().includes(query);
    return matchesKind && matchesLang && matchesQuery;
  });
  cards.forEach(card => { card.hidden = true; });
  numberCards();
  shown = 0;
  empty.hidden = matches.length !== 0;
  reveal();
}

function syncButtons() {
  buttons.forEach(button => {
    const active = button.dataset.facet === 'all'
      ? state.kind === 'all' && state.lang === 'all'
      : state[button.dataset.facet] === button.dataset.filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active);
  });
}

buttons.forEach(button => button.addEventListener('click', () => {
  if (button.dataset.facet === 'all') {
    state.kind = 'all';
    state.lang = 'all';
  } else {
    const facet = button.dataset.facet;
    state[facet] = state[facet] === button.dataset.filter ? 'all' : button.dataset.filter;
  }
  syncButtons();
  update();
}));

syncButtons();
update();
search.addEventListener('input', update);
document.addEventListener('keydown', event => {
  if (event.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) {
    event.preventDefault();
    search.focus();
  }
});
