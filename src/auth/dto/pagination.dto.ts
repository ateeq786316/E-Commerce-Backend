import { IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export  class PaginationDto {
  
    @ApiProperty({ example: '1', description: 'Page number, default is 1' })
    @IsOptional()
    @Type(()=> Number)
    @IsInt()
    @Min(1)
    page?: number=1;
  
    @ApiProperty({ example: '10', description: 'Number of items per page, default is 10' })
    @IsOptional()
    @Type(()=> Number)
    @IsInt()
    @Min(1)
    limit?: number=10;


    @ApiProperty({ example: '5', description: 'Rating of the product' })
    @IsOptional()
    @Type(()=> Number)
    @IsInt()
    @Min(1)
    @IsPositive()
    rating?: number;
}