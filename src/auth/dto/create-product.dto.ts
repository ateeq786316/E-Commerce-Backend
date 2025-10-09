import { IsString, IsNumber, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateProductDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;
    
    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsNumber()
    @IsOptional()
    stock: number;

    @IsUUID()
    categoryId: string;
}