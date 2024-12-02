// frontend/app.js

// Handle Registration
document.getElementById('registrationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (data.error) {
        alert('Error: ' + data.error);
    } else {
        alert('User registered successfully!');
        window.location.href = 'index.html'; // Redirect to login page
    }
});

// Handle Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.token) {
        localStorage.setItem('token', data.token);
        window.location.href = 'dashboard.html'; // Redirect to dashboard
    } else {
        alert('Invalid credentials');
    }
});

// Fetch users and display them in the dashboard
window.onload = async () => {
    const token = localStorage.getItem('token');

    if (token) {
        const response = await fetch('http://localhost:3000/auth/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const users = await response.json();
        const tableBody = document.querySelector('#usersTable tbody');
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="user-checkbox" data-id="${user.id}"></td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.status}</td>
                <td>${user.registration_time}</td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        window.location.href = 'index.html'; // Redirect to login if no token
    }

    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html'; // Redirect to login page
    });
};

// Handle delete users
document.getElementById('delete-selected')?.addEventListener('click', async () => {
    const selectedIds = Array.from(document.querySelectorAll('.user-checkbox:checked'))
        .map(checkbox => checkbox.dataset.id);

    if (selectedIds.length > 0) {
        const response = await fetch('http://localhost:3000/auth/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userIds: selectedIds }),
        });

        const data = await response.json();
        if (data.message) {
            alert('Users deleted successfully');
            location.reload(); // Reload to update table
        } else {
            alert(data.error);
        }
    } else {
        alert('Please select users to delete');
    }
});

// Handle block users
document.getElementById('block-selected')?.addEventListener('click', async () => {
    const selectedIds = Array.from(document.querySelectorAll('.user-checkbox:checked'))
        .map(checkbox => checkbox.dataset.id);

    if (selectedIds.length > 0) {
        const response = await fetch('http://localhost:3000/auth/block', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userIds: selectedIds }),
        });

        const data = await response.json();
        if (data.message) {
            alert('Users blocked successfully');
            location.reload(); // Reload to update table
        } else {
            alert(data.error);
        }
    } else {
        alert('Please select users to block');
    }
});