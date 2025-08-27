# 🔐 Autenticação com Cookies de Sessão

Esta branch demonstra a implementação de um sistema de autenticação seguro baseado em cookies de sessão, seguindo as melhores práticas de segurança apresentadas no livro **"API Security in Action"** - Capítulo 5.

## 🌐 Teste de Política CORS (Origens Diferentes)

Para testar como as políticas de CORS afetam a autenticação, siga estes passos:

### 1. **Iniciar a API**
```bash
npm run start:dev
```
*A API rodará na porta 3000*

### 2. **Servir os Arquivos Estáticos em Outra Porta**
Note que você deve estar usando seu certificado auto-assinado. Se não estiver, então deverá usar tudo em http
```bash
npm run start:frontend
```
*Os arquivos estáticos serão servidos na porta 4000*

### 3. **Acessar via Porta Diferente**
Navegue até: [http://localhost:4000/pages/login.html](http://localhost:4000/pages/login.html)

### 4. **Observar o Comportamento**

- O processo de login **falhará** devido às origens diferentes (localhost:4000 tentando acessar localhost:3000). O erro pode tanto ser direto erro de CORS como outro erro originado pelos middlewares de segurança da API.

Para que possamos habilitar a requisição precisamos:
1. Adicionar a configuração CORS na aplicação (NestJS já possui isso nativo, então não precisamos de packages);
2. Listar as origens permitidas;
3. Ajustar as rotas do cliente para que enviem o cabeçalho ```credentials: include``` para que os cookies sejam recebidos e enviados. 

### 5. **Demonstração**
O fluxo de utilização da aplicação nesta branch então depende de:

1. Iniciar o servidor do front e do backend;
2. Realizar o login com as credenciais padrão:
email: admin
senha: admin@123
3. Acessar a página de criação de espaços;
4. Criar um espaço. A confirmação estará no console do navegador.