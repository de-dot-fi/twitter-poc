import { Router } from 'express';
import { TwitterApi } from 'twitter-api-v2';
import CONFIG, { requestClient, TOKENS } from '../config';
import { asyncWrapOrError } from '../utils';

export const callbackRouter = Router();

export const users = [
  {
    key: '1471179990419001351-q8g1NqHb3C6XntKhIvocT5CFvkt4Lm',
    secret: 'yPQv3zssnNiaNCWGegrXai5IWCZ4K0BvVZgZICwC7rWt9'

  },
  {
    key: '1674367905356566532-9k1Prl6GUO3nNIuxC7qoImYubJtgy6',
    secret: 'RZYFk5CaDg8uEPDKvSsBdF1DjnSiPPp02dNu1sRQjqI3l'
  },
  {
    key: '1311253812276088834-0bow2anfhFCzfsVTROPfB4yAgGFuaf',
    secret: 'JiSyiyHVJ90REntQzN4cMTimTX8uMoRiZfqCz42N4kbuR'
  },
  {
    key: '1384651784606691332-AsrECe3G42rvjhJeDae67ifYxIV0Lh',
    secret: 'LMEvDaoRxRnmr7Wpn2s9MewA8PGKtgmjh5r5o6eCk2dbJ'
  },
]

// -- FLOW 1: --
// -- Callback flow --

// Serve HTML index page with callback link
callbackRouter.get('/', asyncWrapOrError(async (req, res) => {
  const link = await requestClient.generateAuthLink(`http://localhost:${CONFIG.PORT}/callback`);
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


  if (!savedToken || !savedSecret || savedToken !== token) {
    res.status(400).render('error', { error: 'OAuth token is not known or invalid. Your request may have expire. Please renew the auth process.' });
    return;
  }

  // Build a temporary client to get access token
  const tempClient = new TwitterApi({ ...TOKENS, accessToken: savedToken, accessSecret: savedSecret });

  // Ask for definitive access token
  const { accessToken, accessSecret, screenName, userId } = await tempClient.login(verifier);
  // You can store & use accessToken + accessSecret to create a new client and make API calls!


  let i = 0;
  let iBatch = 0;


  while (true) {
    i++;
    iBatch++;

    if(iBatch > 50) {
      console.log(`start waiting`)
      await sleep(960000)
      iBatch = 1;
    }


    await Promise.all([processUsers(users[0].key, users[0].secret, i), processUsers(users[1].key, users[1].secret, i),
      processUsers(users[2].key, users[2].secret, i), processUsers(users[3].key, users[3].secret, i)]);

  }

  res.render('callback', { accessToken, accessSecret, screenName, userId });
}));

export const processUsers = async (key: string, secret: string,  i: number) => {

  try{
    const tempClient2 = new TwitterApi({ ...TOKENS, accessToken: key, accessSecret: secret });
    const user = await tempClient2.readWrite.currentUser(true)


    console.log(`--${i}-----${user.id}---${user.name}----${user.status?.created_at}--------`);

  }catch (e){
    console.log('error')
  }



}


function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default callbackRouter;
