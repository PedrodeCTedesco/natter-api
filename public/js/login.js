const apiUrl = 'https://localhost:3000/';

function login(username, password) {
    let credentials = 'Basic ' + btoa(username + ':' + password);
    
    // Objeto com os dados a serem enviados no corpo da requisição
    const bodyData = {
        username: username,
        password: password
    };

    fetch(apiUrl + 'auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': credentials
        },
        // Adiciona a propriedade 'body' com os dados JSON
        body: JSON.stringify(bodyData)
    })
    .then(res => {
        if (res.ok) {
            res.json().then(json => {
                // Força a expiração do cookie com o path antigo para evitar duplicatas
                document.cookie = 'csrfToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/static/pages';
                
                // Define o novo cookie com o path global
                document.cookie = 'csrfToken=' + json.token + ';Secure;SameSite=strict;Path=/';
                
                window.location.replace('/static/pages/index.html');
            });
        } else {
            // Em caso de erro na resposta, você pode ler o corpo para detalhes.
            res.json().then(errorJson => {
                console.error('Login failed:', errorJson.message);
            });
        }
    })
    .catch(error => console.error('Error logging in: ', error));
}

window.addEventListener('load', function(e) {
    document.getElementById('login').addEventListener('submit', processLoginSubmit);
});

function processLoginSubmit(e) {
    e.preventDefault();
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    login(username, password);
    return false;
}