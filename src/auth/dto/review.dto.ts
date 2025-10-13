import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewDto {
  @ApiProperty({ example: 5, description: 'Rating of the product 1-5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  
  @IsOptional()
  @IsString()
  @ApiProperty({example: 'This is a great product',description: 'Comment on the product',required: false,})
  comment?: string;
}