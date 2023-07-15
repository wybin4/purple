import { Body, Controller } from '@nestjs/common';
import { AccountUserInfo, AccountUserCourses } from '@purple/contracts';
import { RMQRoute, RMQValidate } from 'nestjs-rmq';
import { UserRepository } from './repositories/user.repository';

@Controller()
export class UserQueries {
	constructor(private readonly userRepository: UserRepository) {}

@RMQValidate()
@RMQRoute(AccountUserInfo.topic)
async userInfo(@Body() {id}: AccountUserInfo.Request): Promise<AccountUserInfo.Response> {
	const user = await this.userRepository.findUserById(id);
	return {user};
}
@RMQValidate()
@RMQRoute(AccountUserCourses.topic)
async userCourses(@Body() {id}: AccountUserCourses.Request): Promise<AccountUserCourses.Response> {
	const user = await this.userRepository.findUserById(id);
	return {courses: user.courses};
}
}
