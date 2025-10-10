import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-google-oauth20';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';

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
    private authService: AuthService,
  ) {
  // Validate that environment variables are defined
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  if (!clientID || !clientSecret || !callbackURL) {
    throw new Error('Google OAuth environment variables are not properly configured');
  }

  super({
    clientID,
    clientSecret,
    callbackURL,
    scope: ['profile', 'email'],
  });
}

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: (err: any, user?: any, info?: any) => void,
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
    console.log("This api got hit =================http://localhost:3000/auth/google=================");
  }
}