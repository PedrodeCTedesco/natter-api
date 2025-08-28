window.API_URL = window.API_URL || 'https://127.0.0.1:3000/';

function createSpace(name, owner) {
    // Pega o token
    const token = localStorage.getItem('token');

    // Se o token não existir, não faz a requisição
    if (!token) {
        console.error('token not found. Please log in again.');
        return;
    }

    const data = {
        name: name,
        owner: owner
    };

    fetch(window.API_URL + 'spaces/safe/simple', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Adiciona o token aqui
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