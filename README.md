# Natter API

Criada para aprendizagem a partir do livro 'API security in action' by Neil Madden.
Usar em conjunto com *natter-api-moderador*

# Disclaimer
Os códigos presentes neste repositório são para fins de aprendizagem, somente.

## Como rodar o projeto

- Clone o repositório;
- Instale as dependências com o comando: ``` npm install ```

Inicie o servidor com o comando ``` npm run start:dev ```

A aplicação criará um banco de dados SQLite em memória. Não estão sendo usados ORM's, pois apesar de mesmo com o seu uso as aplicações possam ainda estar vulneráveis a ataques de injeção, a opção por não utilizá-los visa ter um cenário padrão para aprendizagem. 

### Certificados

Os exemplos estarão em HTTPS por conta da instalação de certificados para uso deste protocolo. Caso os possua e queira instalá-los empregue a abordagem que você desejar. Se não quiser, substitua o protocolo dos exemplos para HTTP.

# Utilização

Para poder utilizar as funcionalidades de segurança você pode seguir estes cenários.

**Cenário: sem registro de usuário**: nesse cenário você pode testar todas as rotas da API. Como você não possuirá um usuário registrado o objetivo é que você não consiga acessar os dados presentes em cada rota. Logo, encontrarás códigos HTTP 401 e 403. 

**Cenário: registro de usuário**: nesse cenário você poderá registrar um usuário. Para isso siga as etapas:

- Realize um POST para a rota ``` https://localhost:8080/users ```. 

Atente para os requisitos:

a. Seu nome de usuário não pode estar vazio;
b. Seu nome de usuário não pode ter mais do que 30 caracteres;
c. Seu nome de usuário não pode conter caracteres especiais;
d. Sua senha deve ter mais do que 8 e menos do que 255 caracteres;
e. Sua senha deve possuir no mínimo 1 letra, 1 caractere especial e 1 número;
f. O cabeçalho 'Content-Type' deve ser 'application/json';

Um exemplo de *payload* válido:

```
{
	"username": "pedro",
	"password": "Senha@1234"
}
```

Se bem-sucedido você terá esta reposta:

```
{
	"username": "pedro",
	"created": true
}
```

Para criação de um usuário com permissões de administrador é necessário que exista um espaço para que esse usuário possa exercer suas capacidades relativas ao seu nível de acesso:

```
{
  "username": "newUser",
  "password": "userPassword123",
  "permissions": "a",
  "spaceId": 1
}

```

Para testes em relação ao registro de usuário
```
npx jest src/users/users.service.spec.ts
```

## Cenário [ requisito ]: espaço existente

Para que você possa registrar um usuário o espaço ao qual ele será associado deve existir previamente. 