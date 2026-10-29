const buttons = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.card')];
const search = document.querySelector('#search');
const empty = document.querySelector('.empty');
let filter = 'all';

function update() {
  const query = search.value.trim().toLowerCase();
  let count = 0;
  cards.forEach(card => {
    const topics = card.dataset.topics.split(' ');
    const matchesFilter = filter === 'all' || card.dataset.lang === filter || topics.includes(filter);
    const matchesQuery = (card.textContent + ' ' + card.dataset.keywords).toLowerCase().includes(query);
    card.hidden = !(matchesFilter && matchesQuery);
    if (!card.hidden) count++;
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

search.addEventListener('input', update);
document.addEventListener('keydown', event => {
  if (event.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) {
    event.preventDefault();
    search.focus();
  }
});
