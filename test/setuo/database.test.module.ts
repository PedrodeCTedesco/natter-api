import { DynamicModule, Module } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';
import { DatabaseProvider } from '../../src/config/database/database.provider';


@Module({})
export class TestDatabaseModule {
  static forRoot(database?: sqlite3.Database): DynamicModule {
    const providers = database 
      ? [{ 
          provide: 'DATABASE', 
          useValue: database 
        }]
      : [DatabaseProvider];

    return {
      module: TestDatabaseModule,
      providers,
      exports: providers
    };
  }
}