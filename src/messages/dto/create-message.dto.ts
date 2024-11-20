import { IsNotEmpty, IsNumber, IsString, MaxLength } from "class-validator";

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(30, { message: 'author name should no have more than 30 characteres'})
  author: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255, { message: 'message should no have more than 255 characteres'})
  message: string;

  @IsNotEmpty()
  @IsNumber()
  spaceId: number;
}
