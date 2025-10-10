import { IsString, IsNumber, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {

    @ApiProperty({ example: 'Product Name', description: 'Name of the product' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Product Description', description: 'Description of the product' })
    @IsString()
    @IsNotEmpty()
    description: string;
    
    @ApiProperty({ example: '20', description: 'Price of the product' })
    @IsNumber()
    @IsNotEmpty()
    price: number;

    @ApiProperty({ example: '100', description: 'Stock of the product' })
    @IsNumber()
    @IsOptional()
    stock: number;

    @ApiProperty({ example: 'uuid-string', description: 'Category ID of the product' })
    @IsUUID()
    categoryId: string;
}