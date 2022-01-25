import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
class Enty {
  @PrimaryColumn()
  some: string;
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      entities: [Enty],
      synchronize: true,
    }),
  ],
})
export class DbModule {}
