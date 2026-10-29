const collectionToggle = document.getElementById('collectionToggle');
const collectionView = document.getElementById('collectionView');
const sandboxView = document.getElementById('sandboxView');
const topbarControls = document.querySelector('.topbar-controls');
const saveStatus = document.getElementById('saveStatus');

function showCollection(show) {
  collectionView.hidden = !show;
  sandboxView.hidden = show;
  topbarControls.hidden = show;
  saveStatus.hidden = show;
  collectionToggle.setAttribute('aria-pressed', String(show));
  collectionToggle.textContent = show ? 'Вернуться в песочницу' : 'Коллекция креативов';
  document.title = show ? 'CatManDog - коллекция креативов' : 'CatManDog - песочница креативов';
  if (show) {
    history.replaceState(null, '', '#collection');
  } else if (location.hash === '#collection') {
    history.replaceState(null, '', location.pathname + location.search);
  }
  window.scrollTo(0, 0);
}

collectionToggle.addEventListener('click', () => showCollection(collectionView.hidden));
if (location.hash === '#collection') showCollection(true);
