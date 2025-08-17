import { CreateSocialSpaceDto } from "src/social-spaces/dto/create-social-space.dto";
import { UpdateSocialSpaceDto } from "src/social-spaces/dto/update-social-space.dto";
import { Response } from 'express';

export interface ISocialSpace {
    create(createSocialSpaceDto: CreateSocialSpaceDto, res: Response): Promise<{ 
        uri: string, 
        name: string,
        owner: string,
        userSpaceInfo: {
          user: string,
          permissions: string
        }
      }>,
    createSQLInjectionVulnerability(createSocialSpaceDto: any, res: Response): Promise<any>,
    createSQLInjectionVulnerabilityWithSolution(createSocialSpaceDto: CreateSocialSpaceDto, res: Response): Promise<{
        uri: string;
        name: string;
        owner: string;
        userSpaceInfo: {
          user: string,
          permissions: string
        }
      }>,
    findAll(): Promise<any[]>,
    findOne(id: number): Promise<any>,
    updateSpace(id: number, updateSocialSpace: UpdateSocialSpaceDto): Promise<any>,
    addMember(spaceId: number, username: string, permissions: string, res: Response): Promise<{ username: string; permissions: string }>
}