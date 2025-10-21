import { Controller, Post, Body, Logger, HttpCode, HttpStatus, Headers, UnauthorizedException } from '@nestjs/common';
import { GoogleSheetsService } from './google-sheets.service';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';

@ApiTags('google-sheets')
@Controller('google-sheets')
export class GoogleSheetsController {
  private readonly logger = new Logger(GoogleSheetsController.name);
  private readonly SHEET_SECRET = process.env.GOOGLE_SHEET_SECRET || 'default_secret_key';

  constructor(private readonly googleSheetsService: GoogleSheetsService) {}

    @Post('update')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Handle updates from Google Sheets' })
    @ApiHeader({
        name: 'x-sheet-secret',
        description: 'Secret key for authenticating Google Sheet webhooks',
        required: true
    })
    @ApiResponse({ status: 200, description: 'Update processed successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async handleSheetUpdate(
        @Body() updateData: any,
        @Headers('x-sheet-secret') secret: string,
    ): Promise<{ success: boolean; message: string }> {
        console.log("This api got hit =================http://localhost:3000/google-sheets/update=================");
        console.log("Received update data:", JSON.stringify(updateData, null, 2));
        
        if (secret !== this.SHEET_SECRET) {
            console.log("Security check failed - invalid secret key");
            throw new UnauthorizedException('Invalid secret key');
        }
        try {
        console.log("About to call googleSheetsService.handleSheetUpdate");
        await this.googleSheetsService.handleSheetUpdate(updateData);
        console.log("Successfully completed googleSheetsService.handleSheetUpdate");
        return {
            success: true,
            message: `Successfully processed update for ${updateData.sheetName}`,
            
        };
        } catch (error) {
            console.error("Error in handleSheetUpdate:", error);
            console.error("Error stack:", error.stack);
            this.logger.error(
            `Failed to process update for ${updateData.sheetName}`,
            error.stack,
        );
        return {
            success: false,
            message: `Failed to process update for ${updateData.sheetName}`,
        };
        }
    }
}