document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Send login details to backend
  const response = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  console.log(response)

  if (response.ok) {
    const data = await response.json();
    // Store token for later use
    localStorage.setItem('token', data.token);
    // Redirect to map page
    window.location.href = 'index.html';
  } else {
    alert('Invalid username or password');
  }
});