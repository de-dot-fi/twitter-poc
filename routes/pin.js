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
exports.pinRouter = void 0;
const express_1 = __importStar(require("express"));
const twitter_api_v2_1 = require("twitter-api-v2");
const config_1 = require("../config");
const utils_1 = require("../utils");
exports.pinRouter = (0, express_1.Router)();
// -- FLOW 2: --
// -- PIN flow --
// Serve HTML index page with link with PIN usage
exports.pinRouter.get('/pin-flow', (0, utils_1.asyncWrapOrError)(async (req, res) => {
    const link = await config_1.requestClient.generateAuthLink('oob');
    // Save token secret to use it after callback
    req.session.oauthToken = link.oauth_token;
    req.session.oauthSecret = link.oauth_token_secret;
    res.render('index', { authLink: link.url, authMode: 'pin' });
}));
exports.pinRouter.post('/validate-pin', express_1.default.json(), (0, utils_1.asyncWrapOrError)(async (req, res) => {
    const { pin } = req.body;
    if (!pin) {
        res.status(400).json({ message: 'Invalid PIN.' });
        return;
    }
    const savedToken = req.session.oauthToken;
    const savedSecret = req.session.oauthSecret;
    if (!savedToken || !savedSecret) {
        res.status(400).json({ message: 'Tokens are missing from session. Please retry the auth flow.' });
        return;
    }
    // Build a temporary client to get access token
    const tempClient = new twitter_api_v2_1.TwitterApi({ ...config_1.TOKENS, accessToken: savedToken, accessSecret: savedSecret });
    // Ask for definitive access token with PIN code
    try {
        const { accessToken, accessSecret, screenName, userId } = await tempClient.login(pin);
        // You can store & use accessToken + accessSecret to create a new client and make API calls!
        res.json({ accessToken, accessSecret, screenName, userId });
    }
    catch (e) {
        res.status(400).json({ message: 'Bad PIN code. Please check your input.' });
    }
}));
exports.default = exports.pinRouter;
