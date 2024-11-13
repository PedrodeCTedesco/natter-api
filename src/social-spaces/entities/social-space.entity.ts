import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('spaces')
export class SocialSpace {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  owner: string;

  @Column({ nullable: true })
  uri: string;
}
