import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-google-oauth20';
import { PrismaService } from '../../prisma/prisma.service';

// Define the type for the profile object
interface GoogleProfile {
  id: string;
  name: {
    givenName: string;
    familyName: string;
  };
  emails: Array<{ value: string }>;
  photos: Array<{ value: string }>;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private prisma: PrismaService,
  ) {
    // Validate environment variables
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;

    if (!googleClientId || !googleClientSecret || !googleCallbackUrl) {
      throw new Error('Google OAuth environment variables are not properly configured');
    }

    const options: StrategyOptions = {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: googleCallbackUrl,
      scope: ['profile', 'email'],
    };

    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: Function,
  ) {
    const { id, name, emails } = profile;

    let user = await this.prisma.user.findUnique({
      where: { email: emails[0].value },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: emails[0].value,
          name: name.givenName,
          googleId: id,
        },
      });
    }

    done(null, user);
  }
}