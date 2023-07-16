import { RMQService } from 'nestjs-rmq';
import { UserEntity } from '../entities/user.entity';
import { PurchaseState } from '@purple/interfaces';
import { BuyCourseSagaState } from './buy-course.state';
import { BuyCourseSagaStateCancelled, BuyCourseSagaStateProcess, BuyCourseSagaStatePurchased, BuyCourseSagaStateStarted } from './buy-courses.steps';

export class BuyCourseSaga {
	private state: BuyCourseSagaState;

	constructor(
		public user: UserEntity,
		public courseId: string,
		public rmqService: RMQService
	) {

	}

	setState(state: PurchaseState, courseId: string) {
		switch (state) {
			case PurchaseState.Started:
				this.state = new BuyCourseSagaStateStarted();
				break;
			case PurchaseState.WaitingForPayment:
				this.state = new BuyCourseSagaStateProcess();
				break;
			case PurchaseState.Purchased:
				this.state = new BuyCourseSagaStatePurchased();
				break;
			case PurchaseState.Cancelled:
				this.state = new BuyCourseSagaStateCancelled();
				break;
		}
		this.state.setContext(this);
		this.user.setCourseStatus(courseId, state);
	}

	getState() {
		return this.state;
	}
}