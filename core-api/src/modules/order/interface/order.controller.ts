import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import { OrderService } from '../application/service/order.service';

@Controller(['order', 'orders'])
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  private assertAuthenticated(req: any) {
    if (!req?.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
  }

  @Get('me')
  getMyOrders(@Req() req: any) {
    this.assertAuthenticated(req);
    return this.orderService.getUserOrders(Number(req.user.id));
  }

  @Get('me/summary')
  getMyOrderSummary(@Req() req: any) {
    this.assertAuthenticated(req);
    return this.orderService.getUserSummary(Number(req.user.id));
  }

  @Get(':id')
  getOrderDetail(@Param('id', ParseIntPipe) orderId: number, @Req() req: any) {
    this.assertAuthenticated(req);
    return this.orderService.getOrderDetail(orderId, Number(req.user.id));
  }

  @Post(':id/cancel')
  cancelOrder(@Param('id', ParseIntPipe) orderId: number, @Req() req: any) {
    this.assertAuthenticated(req);
    return this.orderService.cancelOrder(orderId, Number(req.user.id));
  }
}
