import { USER_METHODS } from "src/users/constants/identifiers.methods";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { SavedUser, User, UserDB } from "src/users/interfaces/user.interface";

export interface IUserService {
    [USER_METHODS.CREATE](createUserDto: CreateUserDto): Promise<SavedUser>,
    [USER_METHODS.FIND_ALL](): Promise<User[]>,
    [USER_METHODS.VALIDATION](username: string): Promise<UserDB | null>
}