import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private sheets: any;
  private spreadsheetId: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.initGoogleSheets();
    this.spreadsheetId = this.configService.get<string>('GOOGLE_SHEET_ID') || '';
  }

  private initGoogleSheets() {
    try {
      const clientEmail = this.configService.get<string>('GOOGLE_CLIENT_EMAIL');
      const privateKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY');
      this.spreadsheetId = this.configService.get<string>('GOOGLE_SHEET_ID') || '';

      if (!clientEmail || !privateKey || !this.spreadsheetId) {
        this.logger.warn('Google Sheets configuration is incomplete. Skipping initialization.');
        return;
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.logger.log('Google Sheets service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Sheets service', error.stack);
    }
  }

  async syncProductToSheet(productId: string) {
    
    if (!this.sheets || !this.spreadsheetId) {
      this.logger.warn('Google Sheets service not initialized. Skipping product sync.');
      return;
    }

    try {
      
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          user: true,
        },
      });

      if (!product) {
        this.logger.warn(`Product with ID ${productId} not found`);
        return;
      }

      
      const headers = [
        'ID',
        'Name',
        'Description',
        'Price',
        'Stock',
        'Category',
        'User',
        'Created At',
        'Updated At',
      ];

      const row = [
        product.id,
        product.name,
        product.description,
        product.price.toString(),
        product.stock.toString(),
        product.category?.name || '',
        product.user?.name || '',
        product.createdAt.toISOString(),
        product.updatedAt.toISOString(),
      ];

      
      try {
        await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'Products!A1:A1',
        });
      } catch (error) {
      
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'Products!A1:I1',
          valueInputOption: 'RAW',
          resource: {
            values: [headers],
          },
        });
      }

      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Products!A1:I1000', 
      });

      const rows = response.data.values || [];
      let productRowIndex = -1;

      
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === product.id) {
          productRowIndex = i + 1; 
          break;
        }
      }

      if (productRowIndex === -1) {
        
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'Products!A:I',
          valueInputOption: 'RAW',
          resource: {
            values: [row],
          },
        });
        this.logger.log(`Added new product ${product.name} to Google Sheets`);
      } else {
        
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `Products!A${productRowIndex}:I${productRowIndex}`,
          valueInputOption: 'RAW',
          resource: {
            values: [row],
          },
        });
        this.logger.log(`Updated product ${product.name} in Google Sheets`);
      }
    } catch (error) {
      this.logger.error(`Failed to sync product ${productId} to Google Sheets`, error.stack);
    }
  }

  async removeProductFromSheet(productId: string) {
    
    if (!this.sheets || !this.spreadsheetId) {
      this.logger.warn('Google Sheets service not initialized. Skipping product removal.');
      return;
    }

    try {
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Products!A1:I1000', 
      });

      const rows = response.data.values || [];
      let productRowIndex = -1;

      
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === productId) {
          productRowIndex = i + 1; 
          break;
        }
      }

      if (productRowIndex !== -1) {
        
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `Products!A${productRowIndex}:I${productRowIndex}`,
          valueInputOption: 'RAW',
          resource: {
            values: [['', '', '', '', '', '', '', '', '']],
          },
        });
        this.logger.log(`Removed product ${productId} from Google Sheets`);
      }
    } catch (error) {
      this.logger.error(`Failed to remove product ${productId} from Google Sheets`, error.stack);
    }
  }

  async syncAllProductsToSheet() {
    
    if (!this.sheets || !this.spreadsheetId) {
      this.logger.warn('Google Sheets service not initialized. Skipping full sync.');
      return;
    }

    try {
      
      const products = await this.prisma.product.findMany({
        include: {
          category: true,
          user: true,
        },
      });

      
      const headers = [
        'ID',
        'Name',
        'Description',
        'Price',
        'Stock',
        'Category',
        'User',
        'Created At',
        'Updated At',
      ];

      const rows = products.map((product) => [
        product.id,
        product.name,
        product.description,
        product.price.toString(),
        product.stock.toString(),
        product.category?.name || '',
        product.user?.name || '',
        product.createdAt.toISOString(),
        product.updatedAt.toISOString(),
      ]);

      
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'Products!A1:Z1000',
      });

      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Products!A1:I1',
        valueInputOption: 'RAW',
        resource: {
          values: [headers],
        },
      });

      
      if (rows.length > 0) {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'Products!A2',
          valueInputOption: 'RAW',
          resource: {
            values: rows,
          },
        });
      }

      this.logger.log(`Successfully synced ${products.length} products to Google Sheets`);
    } catch (error) {
      this.logger.error('Failed to sync all products to Google Sheets', error.stack);
    }
  }

  
  async handleSheetUpdate(updateData: any) {
    try {
      this.logger.log(`Processing update from Google Sheets: ${JSON.stringify(updateData)}`);

      
      if (updateData.sheetName !== 'Products') {
        this.logger.warn(`Unsupported sheet name: ${updateData.sheetName}`);
        throw new HttpException(`Unsupported sheet name: ${updateData.sheetName}`, HttpStatus.BAD_REQUEST);
      }

      
      switch (updateData.action) {
        case 'update':
          const result = await this.updateProductFromSheet(updateData.data);
          this.logger.log(`Successfully processed update for product: ${result.id}`);
          break;
        case 'delete':
          await this.deleteProductFromSheet(updateData.row);
          break;
        default:
          this.logger.warn(`Unknown action: ${updateData.action}`);
          throw new HttpException(`Unknown action: ${updateData.action}`, HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.error(`Failed to handle sheet update: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async updateProductFromSheet(sheetData: any) {
    console.log("Entering updateProductFromSheet with data:", JSON.stringify(sheetData, null, 2));
    try {
      
      this.logger.log(`Received update data for product ${sheetData.id}: ${JSON.stringify(sheetData)}`);

      
      if (!sheetData.id) {
        const error = new Error('Product ID is required');
        this.logger.error(`Validation error: ${error.message}`);
        throw new HttpException('Product ID is required', HttpStatus.BAD_REQUEST);
      }

      
      const cleanData: any = {};
      const fieldOrder = ['id', 'name', 'description', 'price', 'stock', 'category', 'user', 'createdAt', 'updatedAt'];
      
      
      for (const field of fieldOrder) {
        if (field in sheetData) {
          cleanData[field] = sheetData[field];
        }
      }

      this.logger.log(`Cleaned data for product ${cleanData.id}: ${JSON.stringify(cleanData)}`);

      
      if (cleanData.price !== undefined) {
        const parsedPrice = typeof cleanData.price === 'string' ? parseFloat(cleanData.price) : cleanData.price;
        if (isNaN(parsedPrice)) {
          this.logger.warn(`Invalid price value: ${cleanData.price}. Skipping price update for product ${cleanData.id}`);
          delete cleanData.price; 
        } else {
          cleanData.price = parsedPrice;
          this.logger.log(`Parsed price for product ${cleanData.id}: ${cleanData.price}`);
        }
      }

      if (cleanData.stock !== undefined) {
        const parsedStock = typeof cleanData.stock === 'string' ? parseInt(cleanData.stock) : cleanData.stock;
        if (isNaN(parsedStock)) {
          this.logger.warn(`Invalid stock value: ${cleanData.stock}. Skipping stock update for product ${cleanData.id}`);
          delete cleanData.stock; 
        } else {
          cleanData.stock = parsedStock;
          this.logger.log(`Parsed stock for product ${cleanData.id}: ${cleanData.stock}`);
        }
      }

      
          console.log("About to check if product exists");
      this.logger.log(`Checking if product exists: ${cleanData.id}`);
      const existingProduct = await this.prisma.product.findUnique({
        where: { id: cleanData.id },
      });
          console.log("Product check result:", existingProduct ? "Found" : "Not found");


      if (!existingProduct) {
        const errorMsg = `Product with ID ${cleanData.id} not found. Cannot update non-existent product.`;
        this.logger.warn(errorMsg);
        throw new HttpException(errorMsg, HttpStatus.NOT_FOUND);
      } else {
              console.log("About to update product in database");
        this.logger.log(`Product found: ${existingProduct.id}, name: ${existingProduct.name}`);
        
        
        const updateData: any = {
          updatedAt: new Date(),
        };
        
        
        if (cleanData.name !== undefined) updateData.name = cleanData.name;
        if (cleanData.description !== undefined) updateData.description = cleanData.description;
        if (cleanData.price !== undefined) updateData.price = cleanData.price;
        if (cleanData.stock !== undefined) updateData.stock = cleanData.stock;

        this.logger.log(`Updating product ${cleanData.id} with data: ${JSON.stringify(updateData)}`);

        try {
          const updatedProduct = await this.prisma.product.update({
            where: { id: cleanData.id },
            data: updateData,
          });
          
          this.logger.log(`Successfully updated product from sheet: ${updatedProduct.id}`);
          this.logger.log(`Updated product price: ${updatedProduct.price}`);
          return updatedProduct;
        } catch (prismaError) {
          this.logger.error(`Prisma update failed for product ${cleanData.id}: ${prismaError.message}`, prismaError.stack);
          throw new HttpException(
            `Failed to update product in database: ${prismaError.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
    } catch (error) {
      console.error("Error in updateProductFromSheet:", error);
    console.error("Error stack:", error.stack);
    
        this.logger.error(`Failed to update product from sheet: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update product from sheet data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async deleteProductFromSheet(rowNumber: number) {
    try {
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `Products!A${rowNumber}:A${rowNumber}`,
      });

      const rows = response.data.values || [];
      if (rows.length === 0 || !rows[0][0]) {
        this.logger.warn(`No product ID found in row ${rowNumber}`);
        return;
      }

      const productId = rows[0][0];

      
      await this.prisma.product.delete({
        where: { id: productId },
      });

      this.logger.log(`Deleted product ${productId} based on sheet deletion`);
    } catch (error) {
      this.logger.error(`Failed to delete product from sheet`, error.stack);
      throw new HttpException(
        'Failed to delete product based on sheet data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}