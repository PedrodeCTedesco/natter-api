import { IsInt, IsNotEmpty, IsOptional, IsString, Length, MaxLength, Min } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    @Length(8, 30)
    @MaxLength(30, { message: 'nome de usuário não pode exceder 30 caracteres. '})
    username: string;
    
    @IsNotEmpty()
    @IsString()
    @Length(8, 30)
    @MaxLength(30, { message: 'senha não pode exceder 30 caracteres. '})
    password: string;

    @IsOptional()
    @IsString()
    @MaxLength(5, { message: 'permissões não podem exceder 5 caracteres'})
    permissions?: string;

    @IsOptional()
    @IsInt({ message: 'spaceId deve ser um número inteiro válido.' })
    @Min(1, { message: 'spaceId deve ser maior que zero.' })
    spaceId?: number;
}
