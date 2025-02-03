const apiURL = 'https://localhost:8080/';

function createSpace(name, owner) {
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
            'Content-Type':'application/json'
        }
    }).then(response => {
        if(response.ok) return response.json();
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
    })
});