import { Router } from 'express';
import { TwitterApi } from 'twitter-api-v2';
import CONFIG, { requestClient, TOKENS } from '../config';
import { asyncWrapOrError } from '../utils';
import {ListSubscribersV1Paginator} from "twitter-api-v2/dist/paginators/list.paginator.v1";

export const callbackRouter = Router();

// -- FLOW 1: --
// -- Callback flow --

// Serve HTML index page with callback link
callbackRouter.get('/', asyncWrapOrError(async (req, res) => {
  const link = await requestClient.generateAuthLink(`http://ec2-18-192-104-214.eu-central-1.compute.amazonaws.com:${CONFIG.PORT}/callback`);
  // Save token secret to use it after callback
  req.session.oauthToken = link.oauth_token;
  req.session.oauthSecret = link.oauth_token_secret;

  res.render('index', { authLink: link.url, authMode: 'callback' });
}));

// Read data from Twitter callback
callbackRouter.get('/callback', asyncWrapOrError(async (req, res) => {
  // Invalid request
  if (!req.query.oauth_token || !req.query.oauth_verifier) {
    res.status(400).render('error', { error: 'Bad request, or you denied application access. Please renew your request.' });
    return;
  }

  const token = req.query.oauth_token as string;
  const verifier = req.query.oauth_verifier as string;
  const savedToken = req.session.oauthToken;
  const savedSecret = req.session.oauthSecret;

  console.log('--------------------------');
  console.log('savedToken ', savedToken);
  console.log('savedSecret ', savedSecret);

  if (!savedToken || !savedSecret || savedToken !== token) {
    res.status(400).render('error', { error: 'OAuth token is not known or invalid. Your request may have expire. Please renew the auth process.' });
    return;
  }

  // Build a temporary client to get access token
  const tempClient = new TwitterApi({ ...TOKENS, accessToken: savedToken, accessSecret: savedSecret });

  // Ask for definitive access token
  const { accessToken, accessSecret, screenName, userId } = await tempClient.login(verifier);
  // You can store & use accessToken + accessSecret to create a new client and make API calls!



  const tempClient2 = new TwitterApi({ ...TOKENS, accessToken: accessToken, accessSecret: accessSecret });

  // const eeee = await tempClient2.readWrite.v2.tweets()
  // // const eeee = await tempClient2.v2.userByUsername(`DeDotFiSecurity`)
  //
  // // 1338890429480247296
  //
  // console.log('ListSubscribersV1Paginator ', eeee);

  res.render('callback', { accessToken, accessSecret, screenName, userId });
}));

export default callbackRouter;
