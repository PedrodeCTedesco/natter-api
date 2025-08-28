import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { TokenService } from "src/token/token.service";
import { PATHS_TO_IGNORE_AUTH } from "../constants/path.to.ignore.constats";

@Injectable()
export class HeaderAuthMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.method === "OPTIONS") return next();

    // Ignora paths livres de autenticação
    const ignoredPaths = Object.values(PATHS_TO_IGNORE_AUTH) as string[];
    if (ignoredPaths.includes(req.path)) return next();

    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      // Retorna 401 e define WWW-Authenticate
      res.setHeader("WWW-Authenticate", 'Bearer realm="Access to protected resources"');
      
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized. Missing Authorization header.",
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // Validação de token via TokenService
      await this.tokenService.validateToken(req, res);
      if (req["user"]) return next();

      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized. Missing user context after token validation.",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Token validation error:", err.message);

      // Para tokens inválidos ou expirados, também envia WWW-Authenticate
      res.setHeader(
        "WWW-Authenticate",
        'Bearer error="invalid_token", error_description="Expired or invalid"'
      );

      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized. Invalid or expired token.",
        timestamp: new Date().toISOString(),
      });
    }
  }
}
