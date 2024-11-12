import { PartialType } from '@nestjs/mapped-types';
import { CreateSocialSpaceDto } from './create-social-space.dto';

export class UpdateSocialSpaceDto extends PartialType(CreateSocialSpaceDto) {}
