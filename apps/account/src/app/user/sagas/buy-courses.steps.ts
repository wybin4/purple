import { PurchaseState } from "@purple/interfaces";
import { UserEntity } from "../entities/user.entity";
import { BuyCourseSagaState } from "./buy-course.state";
import { CourseGetCourse, PaymentCheck, PaymentGenerateLink, PaymentStatus } from '@purple/contracts';

export class BuyCourseSagaStateStarted extends BuyCourseSagaState {
    public async pay(): Promise<{ paymentLink: string; user: UserEntity; }> {
        const { course } = await this.saga.rmqService.send<CourseGetCourse.Request, CourseGetCourse.Response>(CourseGetCourse.topic, {
            id: this.saga.courseId
        });
        if (!course) {
            throw new Error('Такого курса не существует');
        }
        if (course.price == 0) {
            this.saga.setState(PurchaseState.Purchased, course._id);
            return { paymentLink: null, user: this.saga.user }
        }
        const { paymentLink } = await this.saga.rmqService.send<PaymentGenerateLink.Request, PaymentGenerateLink.Response>(PaymentGenerateLink.topic, {
            sum: course.price,
            courseId: course._id,
            userId: this.saga.user._id
        });
        this.saga.setState(PurchaseState.WaitingForPayment, course._id);
        return { paymentLink, user: this.saga.user }
    }
    public checkPayment(): Promise<{ user: UserEntity; status: PaymentStatus; }> {
        throw new Error("Нельзя проверить платеж, который не начался");
    }
    public async cancell(): Promise<{ user: UserEntity; }> {
        this.saga.setState(PurchaseState.Cancelled, this.saga.courseId);
        return { user: this.saga.user };
    }
}

export class BuyCourseSagaStateProcess extends BuyCourseSagaState {
    public pay(): Promise<{ paymentLink: string; user: UserEntity; }> {
        throw new Error("Вы уже в процессе оплаты");
    }
    public async checkPayment(): Promise<{ user: UserEntity; status: PaymentStatus; }> {
        const { status } = await this.saga.rmqService.send<PaymentCheck.Request, PaymentCheck.Response>(PaymentCheck.topic, {
            userId: this.saga.user._id,
            courseId: this.saga.courseId
        });
        if (status === 'cancelled') {
            this.saga.setState(PurchaseState.Cancelled, this.saga.courseId);
            return { user: this.saga.user, status: 'cancelled' };
        }
        if (status !== 'success') {
            return { user: this.saga.user, status: 'progress' };
        }
        this.saga.setState(PurchaseState.Purchased, this.saga.courseId);
        return { user: this.saga.user, status: 'success' };

    }
    public cancell(): Promise<{ user: UserEntity; }> {
        throw new Error("Нельзя отменить платеж в процессе");
    }
}

export class BuyCourseSagaStatePurchased extends BuyCourseSagaState {
    public pay(): Promise<{ paymentLink: string; user: UserEntity; }> {
        throw new Error("Нельзя оплатить купленный курс");
    }
    public async checkPayment(): Promise<{ user: UserEntity; status: PaymentStatus; }> {
        throw new Error("Нельзя проверить платеж по купленному курсу");
    }
    public cancell(): Promise<{ user: UserEntity; }> {
        throw new Error("Нельзя отменить купленный курс");
    }
}

export class BuyCourseSagaStateCancelled extends BuyCourseSagaState {
    public pay(): Promise<{ paymentLink: string; user: UserEntity; }> {
        this.saga.setState(PurchaseState.Started, this.saga.courseId);
        return this.saga.getState().pay();
    }
    public async checkPayment(): Promise<{ user: UserEntity; status: PaymentStatus; }> {
        throw new Error("Нельзя проверить платеж по отмененному курсу");
    }
    public cancell(): Promise<{ user: UserEntity; }> {
        throw new Error("Нельзя отменить отмененный курс");
    }
}