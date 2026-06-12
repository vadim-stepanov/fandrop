import { Command, CommandRunner, Option } from "nest-commander";

import { ArtistService, type CreateArtistInput } from "../modules/artist/artist.service";

@Command({
  name: "artist:create",
  description: "Create an artist; the admin email becomes ARTIST_ADMIN on first login",
})
export class ArtistCreateCommand extends CommandRunner {
  constructor(private readonly artists: ArtistService) {
    super();
  }

  async run(_inputs: string[], options: CreateArtistInput): Promise<void> {
    const artist = await this.artists.create({
      name: options.name,
      slug: options.slug,
      adminEmail: options.adminEmail,
    });
    console.log(`✓ Created artist "${artist.name}" (slug: ${artist.slug}, id: ${artist.id})`);
    console.log(`  ${options.adminEmail} → ARTIST_ADMIN on first OTP login.`);
  }

  @Option({ flags: "-n, --name <name>", description: "Artist display name", required: true })
  parseName(value: string): string {
    return value;
  }

  @Option({ flags: "-s, --slug <slug>", description: "URL slug (unique)", required: true })
  parseSlug(value: string): string {
    return value;
  }

  @Option({ flags: "-e, --admin-email <email>", description: "Admin email", required: true })
  parseAdminEmail(value: string): string {
    return value;
  }
}
