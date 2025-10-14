import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-google-oauth20';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';

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

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  if (!clientID || !clientSecret || !callbackURL) {
    throw new Error('Google OAuth environment variables are not properly configured, Please check your .env file');
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

    try{
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
    catch(error){
      done(new HttpException('unable to complete google authentication, Try use email and password to login.', HttpStatus.INTERNAL_SERVER_ERROR),null);
    }
  }
}