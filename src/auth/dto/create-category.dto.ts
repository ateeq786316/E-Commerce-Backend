import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCategoryDto {
  
  @ApiProperty({ example: 'Home Electronics', description: 'Name of the category' })
  @IsNotEmpty() 
  @IsString()
  name: string;

  @ApiProperty({ example: 'Best products for soldiers', description: 'Description of the category' })
  @IsNotEmpty() 
  @IsString()
  description: string;
}