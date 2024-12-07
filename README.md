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

# Utilização

Para poder utilizar as funcionalidades de segurança você pode seguir estes cenários.

**Cenário: sem registro de usuário**: nesse cenário você pode testar todas as rotas da API. Como você não possuirá um usuário registrado o objetivo é que você não consiga acessar os dados presentes em cada rota. Logo, encontrarás códigos HTTP 401 e 403. 