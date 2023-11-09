"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const config_1 = __importDefault(require("./config"));
const callback_1 = __importDefault(require("./routes/callback"));
const pin_1 = __importDefault(require("./routes/pin"));
// Create express app
const app = (0, express_1.default)();
// Configure session - needed to store secret token between requests
app.use((0, express_session_1.default)({
    secret: 'twitter-api-v2-test',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
}));
// Just configure the render engine
app.set('view engine', 'ejs');
// -- ROUTES --
app.use(callback_1.default);
app.use(pin_1.default);
// -- MISC --
// Error handler
app.use((err, _, res, __) => {
    console.error(err);
    res.status(500).render('error');
});
// Start server
app.listen(Number(config_1.default.PORT), () => {
    console.log(`App is listening on port ${config_1.default.PORT}.`);
});
