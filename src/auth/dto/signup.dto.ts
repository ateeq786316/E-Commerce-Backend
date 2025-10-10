import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SignupDto {
    @IsEmail()
    @ApiProperty({example: 'test@gmail.com', description: 'Email of the user'})
    email: string; 

    @IsNotEmpty()
    @MinLength(6)
    @ApiProperty({example: '123456', description: 'Password of the user'})
    password: string;

    @IsNotEmpty()
    @ApiProperty({example: 'abc', description: 'Name of the user'})
    name: string;
}