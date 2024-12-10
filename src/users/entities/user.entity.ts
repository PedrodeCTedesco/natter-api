import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class User {
    @IsString({ message: 'data type must be a string' })
    @MaxLength(30, { message: 'should not have more than 30 characteres' })
    @IsNotEmpty({ message: 'user identification should not be empty' })
    user_id: string;

    @IsString({ message: 'data type must be a string' })
    @MinLength(8, { message: 'should not have less than 8 characteres' })
    @MaxLength(255, { message: 'should not have more than 255 characteres' })
    @IsNotEmpty({ message: 'you must provide a password' })
    pw_hash: string;

    @IsString({ message: 'data type must be a string' })
    @MaxLength(5, { message: 'should not have more than 5 characteres' })
    permissions: string;
  }