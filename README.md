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