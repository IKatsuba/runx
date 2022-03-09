import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Task } from '@nrwl/devkit';

@Controller('task')
export class TaskController {
  @Post()
  createTask(@Body() payload: Task[]) {
    console.log(payload);

    return { id: Math.random().toString() };
  }

  @Get(':id')
  getTask(@Param(':id') id: string) {
    return {
      id,
      status: 0,
    };
  }
}
