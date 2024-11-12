import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  msgId: number;

  @Column()
  author: string;

  @CreateDateColumn()
  msg_time: Date;

  @Column()
  msg_txt: string;

  @Column() 
  spaceId: string;
}
