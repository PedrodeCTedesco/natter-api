
const apiURL = 'https://localhost:3000/';

// Função auxiliar para obter o valor de um cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function createSpace(name, owner) {
    // Pega o token CSRF do cookie
    const csrfToken = getCookie('csrfToken');

    // Se o token não existir, não faz a requisição
    if (!csrfToken) {
        console.error('CSRF token not found. Please log in again.');
        return;
    }

    const data = {
        name: name,
        owner: owner
    };

    fetch(apiURL + 'spaces/safe/simple', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(data),
        headers: {
            'Accept': 'text/html',
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken // Adiciona o token aqui
        }
    }).then(response => {
        if (response.ok) return response.json();
        else throw new Error(response.statusText);
    })
    .then(json => console.log('Espaço criado: ', json.name, json.uri))
    .catch(err => console.error(err));
}

window.addEventListener('load', function (e) {
    document.getElementById('create-space').addEventListener('submit', function processFormSubmit(e) {
        e.preventDefault();
        const nameSpace = document.getElementById('name').value;
        const onwer = document.getElementById('owner').value;
        createSpace(nameSpace, onwer);
        return false;
    });
});