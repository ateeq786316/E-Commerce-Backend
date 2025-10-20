import { Injectable, Logger } from '@nestjs/common';
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
}