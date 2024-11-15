import { MaxLength } from 'class-validator';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('spaces')
export class SocialSpace {
  @PrimaryGeneratedColumn()
  id: number;

  @MaxLength(255, { message: 'O campo "owner" deve ter no máximo 50 caracteres.' })
  @Column()
  name: string;

  @MaxLength(255, { message: 'O campo "owner" deve ter no máximo 50 caracteres.' })
  @Column()
  owner: string;

  @Column({ nullable: true })
  uri: string;
}
