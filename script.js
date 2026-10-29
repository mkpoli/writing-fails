const buttons = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.card')];
const search = document.querySelector('#search');
const empty = document.querySelector('.empty');
let filter = 'all';

// Show the collection in a fresh arrangement on every visit.
for (let i = cards.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [cards[i], cards[j]] = [cards[j], cards[i]];
}
document.querySelector('.cards').append(...cards);

function update() {
  const query = search.value.trim().toLowerCase();
  let count = 0;
  cards.forEach(card => {
    const topics = card.dataset.topics.split(' ');
    const matchesFilter = filter === 'all' || card.dataset.lang === filter || topics.includes(filter);
    const matchesQuery = (card.textContent + ' ' + card.dataset.keywords).toLowerCase().includes(query);
    card.hidden = !(matchesFilter && matchesQuery);
    if (!card.hidden) {
      const label = card.querySelector('.image-index');
      label.textContent = label.textContent.replace(/^\d+/, String(count + 1).padStart(2, '0'));
      count++;
    }
  });
  empty.hidden = count !== 0;
}

buttons.forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  buttons.forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', active);
  });
  update();
}));

update();
search.addEventListener('input', update);
document.addEventListener('keydown', event => {
  if (event.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) {
    event.preventDefault();
    search.focus();
  }
});
