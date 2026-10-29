const buttons = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.card')];
const search = document.querySelector('#search');
const empty = document.querySelector('.empty');
const state = { kind: 'all', lang: 'all' };

// Show the collection in a fresh arrangement on every visit.
for (let i = cards.length - 1; i > 0; i -= 1) {
  const j = Math.floor(Math.random() * (i + 1));
  [cards[i], cards[j]] = [cards[j], cards[i]];
}
document.querySelector('.cards').append(...cards);

function update() {
  const query = search.value.trim().toLowerCase();
  let count = 0;
  cards.forEach(card => {
    const matchesKind = state.kind === 'all' || card.dataset.kind === state.kind;
    const matchesLang = state.lang === 'all' || card.dataset.lang === state.lang;
    const matchesQuery = (card.textContent + ' ' + card.dataset.keywords).toLowerCase().includes(query);
    card.hidden = !(matchesKind && matchesLang && matchesQuery);
    if (!card.hidden) {
      const label = card.querySelector('.image-index');
      label.textContent = label.textContent.replace(/^\d+/, String(count + 1).padStart(2, '0'));
      count++;
    }
  });
  empty.hidden = count !== 0;
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
