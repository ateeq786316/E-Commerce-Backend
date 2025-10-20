import { Controller, Get, Post, Delete, Param, Query, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
    private readonly logger = new Logger(TasksController.name);

    constructor(private readonly tasksService: TasksService) {}

    @Post('dynamic-job')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Add a dynamic cron job' })
    @ApiQuery({ name: 'name', required: true, description: 'Name of the job' })
    @ApiQuery({ name: 'cron', required: true, description: 'Cron expression' })
    @ApiResponse({ status: 200, description: 'Dynamic job added successfully' })
    @ApiResponse({ status: 400, description: 'Failed to add dynamic job' })
    async addDynamicJob(
        @Query('name') name: string,
        @Query('cron') cron: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const success = this.tasksService.addDynamicCronJob(name,cron,
                () => {
                    this.logger.log(`Dynamic job ${name} executed!`);
                }
            );
            
            if (success) {
                return { success: true, message: `Dynamic job ${name} added successfully` };
            } else {
                return { success: false, message: `Failed to add dynamic job ${name}` };
            }
        } catch (error) {
            this.logger.error(`Error adding dynamic job ${name}`, error.stack);
            return { success: false, message: `Error adding dynamic job ${name}` };
        }
    }

    @Post('dynamic-job/:name')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update an existing dynamic cron job' })
    @ApiParam({ name: 'name', required: true, description: 'Name of the job to update' })
    @ApiQuery({ name: 'cron', required: true, description: 'New cron expression' })
    @ApiResponse({ status: 200, description: 'Dynamic job updated successfully' })
    @ApiResponse({ status: 400, description: 'Failed to update dynamic job' })
    async updateDynamicJob(
        @Param('name') name: string,
        @Query('cron') cron: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const success = this.tasksService.updateDynamicJob(
                name,
                cron,
                () => {
                    this.logger.log(`Dynamic job ${name} executed!`);
                }
            );
            
            if (success) {
                return { success: true, message: `Dynamic job ${name} updated successfully` };
            } else {
                return { success: false, message: `Failed to update dynamic job ${name}` };
            }
        } catch (error) {
            this.logger.error(`Error updating dynamic job ${name}`, error.stack);
            return { success: false, message: `Error updating dynamic job ${name}` };
        }
    }

    @Delete('dynamic-job/:name')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete a dynamic cron job by name' })
    @ApiParam({ name: 'name', required: true, description: 'Name of the job to delete' })
    @ApiResponse({ status: 200, description: 'Dynamic job deleted successfully' })
    @ApiResponse({ status: 400, description: 'Failed to delete dynamic job' })
    async deleteDynamicJob(@Param('name') name: string): Promise<{ success: boolean; message: string }> {
        try {
            const success = this.tasksService.deleteDynamicJob(name);
            
            if (success) {
                return { success: true, message: `Dynamic job ${name} deleted successfully` };
            } else {
                return { success: false, message: `Failed to delete dynamic job ${name}` };
            }
        } catch (error) {
            this.logger.error(`Error deleting dynamic job ${name}`, error.stack);
            return { success: false, message: `Error deleting dynamic job ${name}` };
        }
    }

    @Get('dynamic-jobs')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'List all dynamic cron jobs' })
    @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
    async listJobs(): Promise<{ success: boolean; jobs: string[]; message: string }> {
        try {
            const jobs = this.tasksService.getAllDynamicJobsNames();
            return { success: true, jobs, message: 'Jobs retrieved successfully' };
        } catch (error) {
            this.logger.error('Error listing jobs', error.stack);
            return { success: false, jobs: [], message: 'Failed to retrieve jobs' };
        }
    }
}