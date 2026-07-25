import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import {
  loginSchema,
  oauthExchangeSchema,
  registerSchema,
  verifyEmailQuerySchema,
  type LoginDto,
  type OauthExchangeDto,
  type RegisterDto,
  type VerifyEmailQuery,
} from '@repo/shared';
import { Request, Response } from 'express';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { RefreshCookieClearFilter } from './filters/refresh-cookie-clear.filter';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { GoogleProfile } from './strategies/google.strategy';
import type { JwtAccessPayload } from './strategies/jwt-access.strategy';
import type { JwtRefreshPayload } from './strategies/jwt-refresh.strategy';

@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string;

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.frontendUrl = configService.getOrThrow<string>('FRONTEND_URL');
  }

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(body);
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body);
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @UseFilters(RefreshCookieClearFilter)
  async refresh(
    @Req() req: Request,
    @CurrentUser() payload: JwtRefreshPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'] as string;
    const result = await this.authService.refresh(refreshToken, payload);
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtRefreshGuard)
  async logout(
    @CurrentUser() payload: JwtRefreshPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(payload.jti);
    res.clearCookie('refresh_token', { path: '/auth' });
  }

  @Get('verify-email')
  async verifyEmail(
    @Query(new ZodValidationPipe(verifyEmailQuerySchema))
    query: VerifyEmailQuery,
  ) {
    await this.authService.verifyEmail(query.token);
    return { message: 'Email verified successfully' };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  async resendVerification(@CurrentUser() payload: JwtAccessPayload) {
    await this.authService.resendVerification(payload.sub);
    return { message: 'Verification email sent' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleRedirect() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const profile = req.user as GoogleProfile;
    const { code } = await this.authService.handleGoogleCallback(profile);
    res.redirect(`${this.frontendUrl}/auth/callback?code=${code}`);
  }

  @Post('oauth/exchange')
  async oauthExchange(
    @Body(new ZodValidationPipe(oauthExchangeSchema)) body: OauthExchangeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.exchangeCodeForTokens(body.code);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
