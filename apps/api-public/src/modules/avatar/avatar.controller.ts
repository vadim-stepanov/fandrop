import {
  BadRequestException,
  Controller,
  Delete,
  Post,
  SerializeOptions,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { AvatarResponseDto } from "../artists/dto/balance.dto";
import { avatarUploadOptions } from "./avatar.options";
import { AvatarService } from "./avatar.service";

const FILE_BODY = {
  schema: { type: "object", properties: { file: { type: "string", format: "binary" } } },
} as const;

// The signed-in viewer's own avatar (member-only). Slug is only the auth context
// — the avatar is global on User.
@ApiBearerAuth()
@Controller("artists")
@UseGuards(JwtAuthGuard)
@SerializeOptions({ type: AvatarResponseDto, excludeExtraneousValues: true })
export class AvatarController {
  constructor(private readonly avatar: AvatarService) {}

  @Post(":slug/me/avatar")
  @ApiConsumes("multipart/form-data")
  @ApiBody(FILE_BODY)
  @ApiOkResponse({ type: AvatarResponseDto })
  @UseInterceptors(FileInterceptor("file", avatarUploadOptions))
  async upload(
    @CurrentUser() userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<AvatarResponseDto> {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    // Host-agnostic relative path; /uploads/avatars is served by ServeStaticModule
    // and proxied through the web-public origin (see web-public next.config).
    const url = `/uploads/avatars/${file.filename}`;
    return { avatarUrl: await this.avatar.setAvatar(userId, url) };
  }

  @Delete(":slug/me/avatar")
  @ApiOkResponse({ type: AvatarResponseDto })
  async remove(@CurrentUser() userId: string): Promise<AvatarResponseDto> {
    return { avatarUrl: await this.avatar.removeAvatar(userId) };
  }
}
