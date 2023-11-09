"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncWrapOrError = void 0;
function asyncWrapOrError(callback) {
    return (req, res, next) => {
        return Promise
            .resolve(callback(req, res, next))
            .catch(err => err ? next(err) : next(new Error('Unknown error.')));
    };
}
exports.asyncWrapOrError = asyncWrapOrError;
