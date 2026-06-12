import {
  BadRequestException,
  Controller,
  Post,
  SerializeOptions,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse } from "@nestjs/swagger";

import { ArtistAdminGuard } from "../auth/artist-admin.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UploadResultResponseDto } from "./dto/upload-result.dto";
import { imageUploadOptions, videoUploadOptions } from "./uploads.options";

const FILE_BODY = {
  schema: { type: "object", properties: { file: { type: "string", format: "binary" } } },
} as const;

@ApiBearerAuth()
@Controller("uploads")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
@SerializeOptions({ type: UploadResultResponseDto, excludeExtraneousValues: true })
export class UploadsController {
  @Post("image")
  @ApiConsumes("multipart/form-data")
  @ApiBody(FILE_BODY)
  @ApiOkResponse({ type: UploadResultResponseDto })
  @UseInterceptors(FileInterceptor("file", imageUploadOptions))
  uploadImage(@UploadedFile() file?: Express.Multer.File): UploadResultResponseDto {
    return { url: this.fileUrl("images", file) };
  }

  @Post("video")
  @ApiConsumes("multipart/form-data")
  @ApiBody(FILE_BODY)
  @ApiOkResponse({ type: UploadResultResponseDto })
  @UseInterceptors(FileInterceptor("file", videoUploadOptions))
  uploadVideo(@UploadedFile() file?: Express.Multer.File): UploadResultResponseDto {
    return { url: this.fileUrl("videos", file) };
  }

  private fileUrl(subdir: string, file?: Express.Multer.File): string {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    // Host-agnostic relative path: /uploads is served by ServeStaticModule and
    // proxied through the web-public origin, so the DB never stores a hostname.
    return `/uploads/${subdir}/${file.filename}`;
  }
}
