import { Module } from "@nestjs/common";

import { ArtistService } from "./artist.service";

@Module({
  providers: [ArtistService],
  exports: [ArtistService],
})
export class ArtistModule {}
