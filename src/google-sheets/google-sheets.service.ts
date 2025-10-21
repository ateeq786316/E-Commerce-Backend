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
    // Skip if Google Sheets is not properly configured
    if (!this.sheets || !this.spreadsheetId) {
      this.logger.warn('Google Sheets service not initialized. Skipping product sync.');
      return;
    }

    try {
      // Fetch the specific product from database
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

      // Prepare data for Google Sheets
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

      // Check if sheet has headers, if not, add them
      try {
        await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'Products!A1:A1',
        });
      } catch (error) {
        // If we get an error, it means the sheet is empty, so we add headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'Products!A1:I1',
          valueInputOption: 'RAW',
          resource: {
            values: [headers],
          },
        });
      }

      // Find if product already exists in the sheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Products!A1:I1000', // Limit to first 1000 rows
      });

      const rows = response.data.values || [];
      let productRowIndex = -1;

      // Search for the product by ID (assuming ID is in column A)
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === product.id) {
          productRowIndex = i + 1; // +1 because rows are 1-indexed in Google Sheets
          break;
        }
      }

      if (productRowIndex === -1) {
        // Product not found, append new row
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
        // Product found, update existing row
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
    // Skip if Google Sheets is not properly configured
    if (!this.sheets || !this.spreadsheetId) {
      this.logger.warn('Google Sheets service not initialized. Skipping product removal.');
      return;
    }

    try {
      // Find the product in the sheet and remove it
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Products!A1:I1000', // Limit to first 1000 rows
      });

      const rows = response.data.values || [];
      let productRowIndex = -1;

      // Search for the product by ID (assuming ID is in column A)
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === productId) {
          productRowIndex = i + 1; // +1 because rows are 1-indexed in Google Sheets
          break;
        }
      }

      if (productRowIndex !== -1) {
        // Clear the row by setting empty values
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
    // Skip if Google Sheets is not properly configured
    if (!this.sheets || !this.spreadsheetId) {
      this.logger.warn('Google Sheets service not initialized. Skipping full sync.');
      return;
    }

    try {
      // Fetch all products from database
      const products = await this.prisma.product.findMany({
        include: {
          category: true,
          user: true,
        },
      });

      // Prepare data for Google Sheets
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

      // Instead of clearing, we'll overwrite the entire range
      // First, clear a large range to ensure we remove any existing data
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'Products!A1:Z1000',
      });

      // Add headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Products!A1:I1',
        valueInputOption: 'RAW',
        resource: {
          values: [headers],
        },
      });

      // Add all product data
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

  // New method to handle updates from Google Sheets
  async handleSheetUpdate(updateData: any) {
    try {
      this.logger.log(`Processing update from Google Sheets: ${JSON.stringify(updateData)}`);

      // Validate sheet name
      if (updateData.sheetName !== 'Products') {
        this.logger.warn(`Unsupported sheet name: ${updateData.sheetName}`);
        throw new HttpException(`Unsupported sheet name: ${updateData.sheetName}`, HttpStatus.BAD_REQUEST);
      }

      // Handle different actions
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
      // Log incoming data for debugging
      this.logger.log(`Received update data for product ${sheetData.id}: ${JSON.stringify(sheetData)}`);

      // Validate required fields
      if (!sheetData.id) {
        const error = new Error('Product ID is required');
        this.logger.error(`Validation error: ${error.message}`);
        throw new HttpException('Product ID is required', HttpStatus.BAD_REQUEST);
      }

      // Clean up the data object by removing duplicate fields and keeping only the first occurrence
      const cleanData: any = {};
      const fieldOrder = ['id', 'name', 'description', 'price', 'stock', 'category', 'user', 'createdAt', 'updatedAt'];
      
      // Process fields in order to ensure we keep the first occurrence
      for (const field of fieldOrder) {
        if (field in sheetData) {
          cleanData[field] = sheetData[field];
        }
      }

      this.logger.log(`Cleaned data for product ${cleanData.id}: ${JSON.stringify(cleanData)}`);

      // Validate numeric fields
      if (cleanData.price !== undefined) {
        const parsedPrice = typeof cleanData.price === 'string' ? parseFloat(cleanData.price) : cleanData.price;
        if (isNaN(parsedPrice)) {
          this.logger.warn(`Invalid price value: ${cleanData.price}. Skipping price update for product ${cleanData.id}`);
          delete cleanData.price; // Remove invalid price so it doesn't get updated
        } else {
          cleanData.price = parsedPrice;
          this.logger.log(`Parsed price for product ${cleanData.id}: ${cleanData.price}`);
        }
      }

      if (cleanData.stock !== undefined) {
        const parsedStock = typeof cleanData.stock === 'string' ? parseInt(cleanData.stock) : cleanData.stock;
        if (isNaN(parsedStock)) {
          this.logger.warn(`Invalid stock value: ${cleanData.stock}. Skipping stock update for product ${cleanData.id}`);
          delete cleanData.stock; // Remove invalid stock so it doesn't get updated
        } else {
          cleanData.stock = parsedStock;
          this.logger.log(`Parsed stock for product ${cleanData.id}: ${cleanData.stock}`);
        }
      }

      // Check if product exists
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
        
        // Update existing product
        const updateData: any = {
          updatedAt: new Date(),
        };
        
        // Only add fields that exist in the clean data and are valid
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
      // Get the product ID from the row
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

      // Delete product from database
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