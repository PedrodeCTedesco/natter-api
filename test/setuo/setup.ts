import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { DynamicModule, Type } from "@nestjs/common";
import * as sqlite3 from 'sqlite3';
import { TestDatabaseModule } from "./database.test.module";

export async function setupTest(moduleToTest?: string) {
  // Cria uma instância de banco de dados SQLite em memória
  const db = new sqlite3.Database(':memory:');

  // Dynamic import do módulo baseado no nome
  let targetModule: Type<any> | DynamicModule | undefined;

  if (moduleToTest) {
    try {
      const modulePath = `../../src/${moduleToTest.toLowerCase()}/${moduleToTest.toLocaleLowerCase()}.module`;
      const importedModule = await import(modulePath);
      targetModule = importedModule[`${moduleToTest.replace(/_/g, "")}Module`];
    } catch (error) {
      throw new Error(`Could not load module ${moduleToTest}. Error: ${error.message}`);
    }
  }

  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        envFilePath: './.env.test',
        isGlobal: true,
      }),
      TestDatabaseModule.forRoot(db),
      ...(targetModule ? [targetModule] : []),
    ],
  }).compile();
}