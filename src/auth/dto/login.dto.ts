import { IsEmail, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto { 
    @IsEmail()
    @ApiProperty({example: 'a@gmail.com', description: 'Email of the user'})
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @ApiProperty({example: '123456', description: 'Password of the user'})
    password: string;
}