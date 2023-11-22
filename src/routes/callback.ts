import { Router } from 'express';
import CONFIG, { requestClient, TOKENS } from '../config';
import { asyncWrapOrError } from '../utils';
import {TwitterApi} from "twitter-api-v2-defi";

export const callbackRouter = Router();

// -- FLOW 1: --
// -- Callback flow --

// Serve HTML index page with callback link
callbackRouter.get('/', asyncWrapOrError(async (req, res) => {
  const link = await requestClient.generateAuthLink(`http://localhost:${CONFIG.PORT}/callback`);

  // Save oauth_token_secret ro Redis with oauth_token as a key
  // return oauth_token to the FE
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

  console.log(savedToken)

  // Build a temporary client to get access token
  const tempClient = new TwitterApi({ ...TOKENS, accessToken: req.session.oauthToken, accessSecret: req.session.oauthSecret });

  // Ask for definitive access token
  const { accessToken, accessSecret, screenName, userId } = await tempClient.login(verifier);
  // You can store & use accessToken + accessSecret to create a new client and make API calls!



  //example of how to work with the permanent credentials
   await runExampleWithTheSetOfUserCredentials();



  res.render('callback', { accessToken, accessSecret, screenName, userId });
}));

export const runExampleWithTheSetOfUserCredentials = async () => {

  const users = [
    {
      key: '1652736899331633152-AEOR2ZJWZq66QOo5pIvEJLMpxAsDOy',
      secret: 'SXgJ13f4PNrEweIBzEzIBS9sAX7gYhTglGWw1Jr1Rt578'

    },
    {
      key: '1652736899331633152-AEOR2ZJWZq66QOo5pIvEJLMpxAsDOy',
      secret: 'SXgJ13f4PNrEweIBzEzIBS9sAX7gYhTglGWw1Jr1Rt578'

    },
    {
      key: '1652736899331633152-AEOR2ZJWZq66QOo5pIvEJLMpxAsDOy',
      secret: 'SXgJ13f4PNrEweIBzEzIBS9sAX7gYhTglGWw1Jr1Rt578'

    },
    {
      key: '1652736899331633152-AEOR2ZJWZq66QOo5pIvEJLMpxAsDOy',
      secret: 'SXgJ13f4PNrEweIBzEzIBS9sAX7gYhTglGWw1Jr1Rt578'

    },
  ]

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
}

export const processUsers = async (key: string, secret: string,  i: number) => {

  try{

    // TOKENS should be defined in the config file of the user service
    // accessToken and accessSecret should be saved for each user in the database when they verify the twitter account
    const clientOnTheServerSideForUser = new TwitterApi({ ...TOKENS, accessToken: key, accessSecret: secret });


    // ------- Solution A ------------

    const user = await clientOnTheServerSideForUser.readWrite.currentUser(true)

    //here we can verify if user changed his name (user.name), Bio (user.description) AND we can also can verify the latest tweet's text (user.status?.full_text
    console.log(`--${i}-----${user.id}---${user.name}----${user.status?.full_text}--------`);



    // ------- Solution B ------------

    const userB = await clientOnTheServerSideForUser.readWrite.v2.me({'user.fields' : 'description,most_recent_tweet_id'});


    //here we can verify if user changed his name (userB.data.name), Bio (userB.data.description)
    console.log(`--${i}-----${userB.data.id}---${userB.data.name}-----${userB.data.description}---${userB.data.username}-----${userB.data.most_recent_tweet_id}--------`);


    // then we need send to the following URL to the Web scraper tool we are already using (scraperant.io)

    //https://x.com/{userB.data.username}/status/{userB.data.most_recent_tweet_id}


  }catch (e){
    console.log('error')
  }

}


function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default callbackRouter;
