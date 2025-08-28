# 🔐 Autenticação com Tokens sem cookies de sessão

Esta branch demonstra a implementação de um sistema de autenticação seguro baseado em tokens, seguindo as melhores práticas de segurança apresentadas no livro **"API Security in Action"** - Capítulo 5.

## 🛡️ Características de Segurança

### 🔒 Proteção HMAC
- **Criptografia de tokens**: Tokens são protegidos usando HMAC (Hash-based Message Authentication Code) para garantir integridade e autenticidade
- **Prevenção de adulteração**: Impossibilita modificações maliciosas nos dados do token. Atacantes não poderão forjar tokens

### 💾 Validação em Banco de Dados
- **Persistência segura**: Utiliza banco de dados para armazenamento e validação dos tokens de sessão
- **Controle de estado**: Permite rastreamento e gerenciamento do ciclo de vida das sessões

### 🚪 Revogação Automática
- **Logout seguro**: Tokens são automaticamente revogados após o logout do usuário
- **Limpeza de sessões**: Remoção completa dos dados de sessão da base de dados

### 📱 Web Storage API
- **Armazenamento no cliente**: utiliza local storage para armazenamento dos tokens entre requisições.
Há, naturalmente, prós e contras dessa abordagem. 

### 🔑 Geração HMAC
- **Script**: uso de um script para gerar a chave HMAC. Note que isto que consta neste repositório é para fins de desenvolvimento local. Em produção, o uso da chave HMAC requer configurações adicionais (arquivos específicos, uso de funcionalidades de nuvem como Google Secret Manager, p.ex.). 

Para gerar a chave: 
```bash
npm run generate:hmac
```

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

### 4. **Demonstração**
O fluxo de utilização da aplicação nesta branch então depende de:

1. Iniciar o servidor do front e do backend;
2. Realizar o login com as credenciais padrão:
   - **Email**: admin
   - **Senha**: admin@123
3. Acessar a página de criação de espaços;
4. Criar um espaço. A confirmação estará no console do navegador.

## 🔧 Configurações de Segurança

### Gerenciamento de Sessões
- **Expiração automática**: Sessões expiram após período de inatividade
- **Validação contínua**: Verificação da validade do token a cada requisição
- **Revogação imediata**: Invalidação instantânea durante logout