"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callbackRouter = void 0;
const express_1 = require("express");
const twitter_api_v2_1 = require("twitter-api-v2");
const config_1 = __importStar(require("../config"));
const utils_1 = require("../utils");
exports.callbackRouter = (0, express_1.Router)();
// -- FLOW 1: --
// -- Callback flow --
// Serve HTML index page with callback link
exports.callbackRouter.get('/', (0, utils_1.asyncWrapOrError)(async (req, res) => {
    const link = await config_1.requestClient.generateAuthLink(`http://localhost:${config_1.default.PORT}/callback`);
    // Save token secret to use it after callback
    req.session.oauthToken = link.oauth_token;
    req.session.oauthSecret = link.oauth_token_secret;
    res.render('index', { authLink: link.url, authMode: 'callback' });
}));
// Read data from Twitter callback
exports.callbackRouter.get('/callback', (0, utils_1.asyncWrapOrError)(async (req, res) => {
    // Invalid request
    if (!req.query.oauth_token || !req.query.oauth_verifier) {
        res.status(400).render('error', { error: 'Bad request, or you denied application access. Please renew your request.' });
        return;
    }
    const token = req.query.oauth_token;
    const verifier = req.query.oauth_verifier;
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
    const tempClient = new twitter_api_v2_1.TwitterApi({ ...config_1.TOKENS, accessToken: savedToken, accessSecret: savedSecret });
    // Ask for definitive access token
    const { accessToken, accessSecret, screenName, userId } = await tempClient.login(verifier);
    // You can store & use accessToken + accessSecret to create a new client and make API calls!
    const tempClient2 = new twitter_api_v2_1.TwitterApi({ ...config_1.TOKENS, accessToken: accessToken, accessSecret: accessSecret });
    // const eeee = await tempClient2.readWrite.v2.tweets()
    // // const eeee = await tempClient2.v2.userByUsername(`DeDotFiSecurity`)
    //
    // // 1338890429480247296
    //
    // console.log('ListSubscribersV1Paginator ', eeee);
    res.render('callback', { accessToken, accessSecret, screenName, userId });
}));
exports.default = exports.callbackRouter;
