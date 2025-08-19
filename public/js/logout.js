const apiUrl = 'https://localhost:3000/';

function logout() {
    // Obtém o token CSRF dos cookies
    const csrfToken = getCsrfToken();
    
    if (!csrfToken) {
        console.error('CSRF token not found');
        return;
    }

    fetch(apiUrl + 'auth/logout', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
        }
    })
    .then(res => {
        if (res.ok) {
            // Logout bem-sucedido - limpa o cookie e redireciona
            document.cookie = 'csrfToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/';
            
            window.location.replace('/static/pages/login.html');
        } else {
            // Em caso de erro na resposta
            res.json().then(errorJson => {
                console.error('Logout failed:', errorJson.message);
            });
        }
    })
    .catch(error => console.error('Error logging out: ', error));
}

function getCsrfToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrfToken') {
            return decodeURIComponent(value);
        }
    }
    return null;
}

// Event listener para o botão de logout
window.addEventListener('load', function() {
    document.getElementById('logout-btn').addEventListener('click', logout);
});