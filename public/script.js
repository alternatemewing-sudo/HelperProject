// Math-solver client script — potato UI + panic button
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createForm');
  const urlInput = document.getElementById('urlInput');
  const result = document.getElementById('result');
  const resultInput = document.getElementById('resultInput');
  const copyBtn = document.getElementById('copyBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;

    // Basic ensure URL starts with http(s)
    let norm = url;
    if (!/^https?:\/\//i.test(url)) norm = 'https://' + url;

    try {
      const res = await fetch('/api/potato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: norm })
      });
      const json = await res.json();
      if (res.ok) {
        result.classList.remove('hidden');
        resultInput.value = json.link;
      } else {
        alert(json.error || 'Server error creating potato');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  });

  copyBtn.addEventListener('click', () => {
    if (!resultInput.value) return;
    navigator.clipboard?.writeText(resultInput.value).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy result', 1200);
    }).catch(() => alert('Copy failed'));
  });

  // Panic button: pressing '0' navigates to example.com immediately.
  // This is intentionally simple and accessible.
  window.addEventListener('keydown', (ev) => {
    if (ev.key === '0' && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
      window.location.href = 'https://example.com';
    }
  });
});
