// Example JS: update positions dynamically
document.addEventListener('DOMContentLoaded', () => {
  let count = 1247;
  const total = 8450;
  const countEl = document.getElementById('ch-count');
  const usersAhead = document.getElementById('ch-users-ahead');
  const progressBar = document.getElementById('ch-progress');

  function updateQueue() {
    if (count > 0) {
      count--;
      countEl.textContent = `#${count.toLocaleString()}`;
      usersAhead.textContent = (count-1).toLocaleString();
      let percent = ((total-count)/total)*100;
      progressBar.style.width = percent + '%';
    }
  }

  setInterval(updateQueue, 3000); // simulate queue progress
});