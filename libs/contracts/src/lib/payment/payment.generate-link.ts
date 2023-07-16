import { ICourse } from '@purple/interfaces';
import { IsNumber, IsString } from 'class-validator';

export namespace PaymentGenerateLink {
  export const topic = 'payment.generate-link.command';

  export class Request {
    @IsNumber()
    sum!: number;

    @IsString()
    courseId!: string;

    @IsString()
    userId!: string;
  }

  export class Response {
    paymentLink!: string;
  }
}
