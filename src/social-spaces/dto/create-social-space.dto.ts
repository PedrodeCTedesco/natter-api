import { IsNotEmpty, IsString, Length, MaxLength } from "class-validator";

export class CreateSocialSpaceDto {

  @IsNotEmpty()
  @IsString()
  @Length(8, 30)
  @MaxLength(30, { message: 'Este campo não pode exceder 30 caracteres. '})
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 30)
  @MaxLength(30, { message: 'Este campo não pode exceder 30 caracteres. '})
  owner: string;
  }