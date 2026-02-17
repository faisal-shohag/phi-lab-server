import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GithubStrategy } from 'passport-github2';
import { envVars } from './env';
import { prisma } from './db';
import { AuthType } from '../../generated/prisma/enums';

passport.use(
  new GoogleStrategy(
    {
      clientID: envVars.GOOGLE_CLIENT_ID as string,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET as string,
      callbackURL: envVars.GOOGLE_CALLBACK_URL as string,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email provided by Google'));
        }

        // 1. Try to find user by googleId
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });


        if (user) {
          return done(null, user);
        }

        // 2. If not found by googleId, try to find by email (for account linking)
        user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Link existing account with Google
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.id },
          });
          return done(null, user);
        }

        // 3. Create new user
        user = await prisma.user.create({
          data: {
            email,
            googleId: profile.id,
            name: profile.displayName || null,
            picture: profile.photos?.[0]?.value || null,
            role: 'USER', // or any other default role
            status: 'ACTIVE', // or any other default status
             authType: AuthType.google,
          },
        });

     

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);


//github strategy
passport.use(
  new GithubStrategy(
    {
      clientID: envVars.GITHUB_CLIENT_ID as string,
      clientSecret: envVars.GITHUB_CLIENT_SECRET as string,
      callbackURL: envVars.GITHUB_CALLBACK_URL as string,
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
        console.log(profile)
      try {
        const email = profile.emails?.[0]?.value;
      
        if (!email) {
          return done(new Error('No email provided by Github'));
        }

        // 1. Try to find user by githubId
        let user = await prisma.user.findUnique({
          where: { githubId: profile.id },
        });


        if (user) {
          return done(null, user);
        }

        // 2. If not found by githubId, try to find by email (for account linking)
        user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Link existing account with Github
          user = await prisma.user.update({
            where: { id: user.id },
            data: { githubId: profile.id },
          });
          return done(null, user);
        }

        // 3. Create new user
        user = await prisma.user.create({
          data: {
            email,
            githubId: profile.id,
            name: profile.displayName || null,
            picture: profile.photos?.[0]?.value || null,
            role: 'USER', // or any other default role
            status: 'ACTIVE', // or any other default status
            authType: AuthType.github,
          },
        });


        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
)

export default passport;