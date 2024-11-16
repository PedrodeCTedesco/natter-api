import helmet from 'helmet';

export const helmetConfig = helmet({
  // Configurações do Content-Security-Policy (CSP)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],  // Previne o carregamento de qualquer recurso por padrão
      scriptSrc: ["'self'"],   // Permite apenas scripts do mesmo domínio
      connectSrc: ["'self'"],  // Permite conexões apenas do mesmo domínio
      imgSrc: ["'self'"],      // Permite imagens apenas do mesmo domínio
      styleSrc: ["'self'"],    // Permite estilos apenas do mesmo domínio
      fontSrc: ["'self'"],     // Permite fontes apenas do mesmo domínio
      frameAncestors: ["'none'"], // Previne carregamento em iframes
      objectSrc: ["'none'"],   // Previne objetos e plugins
      formAction: ["'self'"],  // Restringe actions de formulários ao mesmo domínio
      baseUri: ["'self'"],     // Restringe URLs base ao mesmo domínio
    },
  },

  // Configurações do X-Content-Type-Options
  xContentTypeOptions: true,

  // Configurações do X-Frame-Options
  frameguard: {
    action: 'deny',  // Previne qualquer carregamento em frames
  },

  // Desabilita X-XSS-Protection conforme recomendado para APIs
  xssFilter: false,

  // Configurações do HSTS
  hsts: {
    maxAge: 31536000,        // 1 ano
    includeSubDomains: true,
    preload: true,
  },

  // Configurações adicionais de segurança
  referrerPolicy: { 
    policy: 'no-referrer'    // Não envia o Referrer header
  },

  // Habilita o modo sandbox
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { 
    policy: 'same-origin' 
  },
  crossOriginResourcePolicy: { 
    policy: 'same-origin' 
  },

  // Desabilita o Powered-By header
  hidePoweredBy: true,
});

// Middleware para adicionar headers de cache adicionais
export const additionalSecurityHeaders = (req, res, next) => {
  res.setHeader('Pragma', 'no-cache'); // Para compatibilidade com HTTP/1.0
  res.setHeader('Expires', '0');       // Força revalidação
  res.setHeader('Cache-Control', 'no-store', 'no-cache', 'must-revalidate', 'private'); 
  next();
};