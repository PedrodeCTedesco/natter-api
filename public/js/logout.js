function logout() {
    // Obtém o token do local storage
    const token = getToken();
    
    if (!token) {
        console.error('token not found');
        return;
    }

    fetch(window.API_URL + 'auth/logout', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => {
        if (res.ok) {
            // Logout bem-sucedido - remove o token do local storage
            localStorage.removeItem('token');
            
            window.location.replace('/pages/login.html'); // apenas em mesma origem: /static/pages/login.html
        } else {
            // Em caso de erro na resposta
            res.json().then(errorJson => {
                console.error('Logout failed:', errorJson.message);
            });
        }
    })
    .catch(error => console.error('Error logging out: ', error));
}

function getToken() {
    const token = localStorage.getItem('token');
    if (token === 'token') {
        return decodeURIComponent(value);
    }
    return null;
}

// Event listener para o botão de logout
window.addEventListener('load', function() {
    document.getElementById('logout-btn').addEventListener('click', logout);
});