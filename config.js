"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestClient = exports.TOKENS = exports.CONFIG = void 0;
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const twitter_api_v2_1 = require("twitter-api-v2");
exports.CONFIG = dotenv_1.default.parse(fs_1.default.readFileSync(__dirname + '/../.env'));
exports.TOKENS = {
    appKey: exports.CONFIG.CONSUMER_TOKEN,
    appSecret: exports.CONFIG.CONSUMER_SECRET,
};
// Create client used to generate auth links only
exports.requestClient = new twitter_api_v2_1.TwitterApi({ ...exports.TOKENS });
exports.default = exports.CONFIG;
