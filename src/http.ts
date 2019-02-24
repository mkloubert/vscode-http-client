/**
 * This file is part of the vscode-http-client distribution.
 * Copyright (c) Marcel Joachim Kloubert.
 *
 * vscode-http-client is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * vscode-http-client is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import * as _ from 'lodash';
import * as HTTP from 'http';
import * as HTTPs from 'https';
import * as Moment from 'moment';
const NormalizeHeaderCase = require("header-case-normalizer");
import * as URL from 'url';
import * as vschc from './extension';
import * as vschc_requests from './requests';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';
import * as vscode_workspaces from './workspaces';


/**
 * Reads binary content as Base64 string.
 *
 * @return {PromiseLike<string>} The promise with the data (if available).
 */
export type Base64Reader = () => PromiseLike<string>;

/**
 * Result value for getter / setter method of a HTTP client.
 */
export type HTTPClientValue<TValue> = TValue | symbol | HTTPClient;

/**
 * A listener for an event, that is invoked after a request has been send by a HTTP client.
 *
 * @param {any} err The error (if occurred).
 * @param {SendHTTPRequestResult} [result] The result.
 */
export type OnDidSendListener = (err: any, result?: SendHTTPRequestResult) => void | PromiseLike<void>;

/**
 * Result of a 'HTTPClient.send()' call.
 */
export interface SendHTTPRequestResult {
    /**
     * The underlying request data.
     */
    data: vschc_requests.RequestData;
    /**
     * The number of millisconds the 'send' operatio needs for the execution.
     */
    executionTime: number;
    /**
     * The underlying request options.
     */
    options: HTTP.RequestOptions;
    /**
     * Reads the body as Base64 string.
     */
    readRequestBody: Base64Reader;
    /**
     * The underlying request context.
     */
    request: HTTP.ClientRequest;
    /**
     * The underlying response context.
     */
    response: HTTP.ClientResponse;
    /**
     * The start time.
     */
    startTime: Moment.Moment;
    /**
     * The called URL.
     */
    url: URL.Url;
}


/**
 * A HTTP client.
 */
export class HTTPClient extends vscode_helpers.DisposableBase {
    private _body: any;
    private _headers: any;
    private _method: any;
    private _noResult = false;
    private _onDidSend: OnDidSendListener[];
    private _query: any;
    private _rejectUnauthorized = false;
    private _timeout: any;
    private _url: any;

    /**
     * Initializes a new instance of that class.
     *
     * @param {vschc_requests.IHTTPRequest} request The request.
     * @param {vschc_requests.RequestData} data The data.
     * @param {vscode.CancellationToken} [cancelToken] An optional cancellation token to use.
     */
    public constructor(
        public readonly request: vschc_requests.IHTTPRequest,
        public readonly data: vschc_requests.RequestData,
        public readonly cancelToken?: vscode.CancellationToken,
    ) {
        super();

        this.unsetAll();

        this.unsetOnDidSendListeners();
    }

    /**
     * Gets or sets the custom value for the body.
     *
     * @param {any} [newValue] The new custom value.
     *
     * @return {HTTPClientValue<Buffer>}
     */
    public body(newValue?: any): HTTPClientValue<Buffer> {
        if (arguments.length > 0) {
            if (_.isSymbol(newValue)) {
                newValue = vschc.IS_UNSET;
            }

            this._body = newValue;
            return this;
        }

        return this._body;
    }

    /**
     * Gets or sets the custom headers.
     *
     * @param {string} [name] The name of the header. If not defined an object with all custom headers is returned.
     * @param {any} [newValue] The value for the header. If not defined, the current value is returned.
     *
     * @return {HTTPClientValue<any>}
     */
    public header(name?: string, newValue?: any): HTTPClientValue<any> {
        if (arguments.length < 1) {
            return this._headers;
        }

        name = vscode_helpers.normalizeString(name);
        if (arguments.length < 2) {
            let value = this._headers[ name ];
            if (_.isNil(value)) {
                value = vschc.IS_UNSET;
            }

            return value;
        }

        if (_.isSymbol(newValue)) {
            delete this._headers[ name ];
        } else {
            this._headers[ name ] = vscode_helpers.toStringSafe(newValue);
        }

        return this;
    }

    /**
     * Gets or sets the custom HTTP.
     *
     * @param {any} [newValue] The new value.
     *
     * @return {HTTPClientValue<string>}
     */
    public method(newValue?: any): HTTPClientValue<string> {
        if (arguments.length > 0) {
            if (_.isSymbol(newValue)) {
                newValue = vschc.IS_UNSET;
            } else if (!_.isNil(newValue)) {
                newValue = vscode_helpers.toStringSafe( newValue );
            }

            this._method = newValue;
            return this;
        }

        return this._method;
    }

    /**
     * Gets or sets if a result should be shown or not.
     *
     * @param {any} [newValue] The new value.
     *
     * @return {boolean|this}
     */
    public noResult(newValue?: any): boolean | this {
        if (arguments.length > 0) {
            this._noResult = vscode_helpers.toBooleanSafe(newValue);

            return this;
        }

        return this._noResult;
    }

    /**
     * Adds an event listener that is invoked AFTER a request has been send.
     *
     * @param {OnDidSendListener} listener The listener to add.
     *
     * @return {this}
     */
    public onDidSend(listener: OnDidSendListener) {
        if (listener) {
            this._onDidSend.push(listener);
        }

        return this;
    }

    /**
     * Gets or sets the custom query parameter(s).
     *
     * @param {string} [name] The name of the header. If not defined an object with all custom parameters is returned.
     * @param {any} [newValue] The value for the header. If not defined, the current value is returned.
     *
     * @return {HTTPClientValue<any>}
     */
    public param(name?: string, newValue?: any): HTTPClientValue<any> {
        if (arguments.length < 1) {
            return this._query;
        }

        name = vscode_helpers.toStringSafe(name).trim();
        if (arguments.length < 2) {
            let value = this._query[ name ];
            if (_.isNil(value)) {
                value = vschc.IS_UNSET;
            }

            return value;
        }

        if (_.isSymbol(newValue)) {
            delete this._query[ name ];
        } else {
            this._query[ name ] = vscode_helpers.toStringSafe(newValue);
        }

        return this;
    }

    /**
     * Gets or sets the 'rejectUnauthorized' for secure HTTP requests.
     *
     * @param {any} [newValue] The new value.
     *
     * @return {boolean|this}
     */
    public rejectUnauthorized(newValue?: any): boolean | this {
        if (arguments.length < 1) {
            return this._rejectUnauthorized;
        }

        this._rejectUnauthorized = vscode_helpers.toBooleanSafe(newValue);
        return this;
    }

    /**
     * Sends the request based on the current data.
     *
     * @param {vscode.CancellationToken} [token] The (custom) cancellation token to use.
     */
    public send(token?: vscode.CancellationToken) {
        const START_TIME = Moment.utc();

        const ME = this;

        if (arguments.length < 1) {
            token = ME.cancelToken;  // use default
        }

        return new Promise<SendHTTPRequestResult>(async (resolve, reject) => {
            let completedInvoked = false;
            const COMPLETED = async (err: any, result?: SendHTTPRequestResult) => {
                const END_TIME = Moment.utc();

                if (result) {
                    result.executionTime = END_TIME.diff(START_TIME, 'milliseconds');
                }

                if (completedInvoked) {
                    return;
                }
                completedInvoked = true;

                if (!ME._noResult) {
                    for (const L of vscode_helpers.toArray(ME._onDidSend)) {
                        await Promise.resolve( L(err, result) );
                    }
                }

                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            };
            const COMPLETED_SYNC = (err: any, result?: SendHTTPRequestResult) => {
                try {
                    COMPLETED(err, result).then(() => {
                    }, (err) => {
                        reject(err);
                    });
                } catch (e) {
                    reject(e);
                }
            };

            try {
                const DATA = vscode_helpers.cloneObject( ME.data );

                let requestUrlValue: any = ME._url;
                if (_.isSymbol(requestUrlValue)) {
                    requestUrlValue = vscode_helpers.toStringSafe( DATA.url );  // no custom URL
                }
                if (!vscode_helpers.normalizeString(requestUrlValue).startsWith('http')) {
                    requestUrlValue = 'http://' + requestUrlValue;
                }

                const REQUEST_URL = URL.parse(requestUrlValue);
                const PROTOCOL = vscode_helpers.normalizeString(REQUEST_URL.protocol);

                let createRequest: (() => HTTP.ClientRequest) | false = false;

                let newRequest: HTTP.ClientRequest;
                const OPTS: HTTP.RequestOptions | HTTPs.RequestOptions = {
                    auth: REQUEST_URL.auth,
                    headers: {},
                    hostname: vscode_helpers.toStringSafe(REQUEST_URL.hostname),
                    method: ME._method,
                    path: REQUEST_URL.pathname,
                    timeout: ME._timeout,
                };

                let bodyReader: Base64Reader;

                const CALLBACK = (resp: HTTP.ClientResponse) => {
                    COMPLETED_SYNC(null, {
                        data: DATA,
                        executionTime: undefined,
                        options: OPTS,
                        readRequestBody: bodyReader,
                        request: newRequest,
                        response: resp,
                        startTime: START_TIME,
                        url: REQUEST_URL,
                    });
                };

                if (_.isSymbol(OPTS.method)) {
                    OPTS.method = vscode_helpers.toStringSafe(DATA.method);  // no custom method
                }

                if (_.isSymbol(OPTS.timeout)) {
                    OPTS.timeout = 10000;  // no custom timeout
                }

                const APPLY_HEADERS = async (headersToApply: any) => {
                    if (headersToApply) {
                        for (const H in headersToApply) {
                            const NAME = NormalizeHeaderCase(H);
                            if ('' !== NAME) {
                                let value: any = await asStringValue( headersToApply[H] );
                                if (!_.isSymbol(value)) {
                                    if ('Authorization' === NAME) {
                                        if (value.toLowerCase().trim().startsWith('basic ')) {
                                            const AUTH_SEP: number = value.indexOf(':');

                                            if (AUTH_SEP > -1) {
                                                // automatically convert to Base64 string

                                                value = value.trim();

                                                value = value.substr(
                                                    value.indexOf(' ') + 1
                                                ).trim();

                                                value = 'Basic ' + (new Buffer(value, 'ascii')).toString('base64');
                                            }
                                        }
                                    }

                                    OPTS.headers[NAME] = <any>value;
                                }
                            }
                        }
                    }
                };

                await APPLY_HEADERS(DATA.headers);  // first the default value
                await APPLY_HEADERS(ME._headers);  // then the custom ones

                if (vscode_helpers.isEmptyString(OPTS.hostname)) {
                    OPTS.hostname = '127.0.0.1';
                }

                if (vscode_helpers.isEmptyString(OPTS.method)) {
                    OPTS.method = 'GET';
                }
                OPTS.method = OPTS.method.toUpperCase().trim();

                OPTS.port = parseInt( vscode_helpers.normalizeString(REQUEST_URL.port) );

                // query params
                let query = [];
                {
                    const APPLY_PARAMS = async (q: any) => {
                        if (q) {
                            for (let p in q) {
                                const VALUE = await asStringValue( q[p] );
                                if (!_.isSymbol(VALUE)) {
                                    query.push({
                                        'name': vscode_helpers.toStringSafe( p ).trim(),
                                        'value': VALUE,
                                    });
                                }
                            }
                        }
                    };

                    await APPLY_PARAMS( uriParamsToObject(REQUEST_URL) );
                    await APPLY_PARAMS( ME._query );

                    if (query.length > 0) {
                        OPTS.path += '?';
                        OPTS.path += query.map(x => {
                            return `${ x.name }=${ encodeURIComponent(x.value) }`;
                        }).join('&');
                    }
                }

                switch (PROTOCOL) {
                    case 'http:':
                        createRequest = () => {
                            const HTTP_OPTS = <HTTP.RequestOptions>OPTS;

                            HTTP_OPTS.protocol = 'http:';
                            if (isNaN(<any>HTTP_OPTS.port)) {
                                HTTP_OPTS.port = 80;
                            }

                            return HTTP.request(HTTP_OPTS, CALLBACK);
                        };
                        break;

                    case 'https:':
                        createRequest = () => {
                            const HTTPs_OPTS = <HTTPs.RequestOptions>OPTS;
                            HTTPs_OPTS.rejectUnauthorized = vscode_helpers.toBooleanSafe(ME._rejectUnauthorized);

                            HTTPs_OPTS.protocol = 'https:';
                            if (isNaN(<any>HTTPs_OPTS.port)) {
                                HTTPs_OPTS.port = 443;
                            }

                            return HTTPs.request(HTTPs_OPTS, CALLBACK);
                        };
                        break;
                }

                if (false === createRequest) {
                    throw new Error(`Invalid protocol '${ PROTOCOL }'!`);
                }

                newRequest = createRequest();

                let body: any = ME._body;
                if (_.isSymbol(body)) {
                    body = undefined;  // no custom body

                    if (DATA.body) {
                        if (false !== DATA.body.content) {
                            body = new Buffer(vscode_helpers.toStringSafe(DATA.body.content).trim(), 'base64');
                        }
                    }
                }
                body = await vscode_helpers.asBuffer( body );

                if (body && body.length > 0) {
                    newRequest.write( body );
                }

                bodyReader = async () => {
                    if (body) {
                        return body.toString('base64');
                    }
                };

                newRequest.once('error', (err) => {
                    if (err) {
                        COMPLETED_SYNC(err);
                    }
                });

                const ABORT = () => {
                    let err: any = null;
                    try {
                        newRequest.abort();
                    } catch (e) {
                        err = e;
                    }

                    COMPLETED_SYNC(err);
                };

                if (token) {
                    token.onCancellationRequested(() => {
                        ABORT();
                    });
                }

                newRequest.end();
            } catch (e) {
                COMPLETED_SYNC(e);
            }
        });
    }

    /**
     * Sets up settings from active workspace.
     *
     * @return this
     */
    public setupFromActiveWorkspace() {
        const ACTIVE_WORKSPACE = vscode_workspaces.getActiveWorkspace();
        if (ACTIVE_WORKSPACE) {
            const CFG = ACTIVE_WORKSPACE.config;
            if (CFG) {
                this._rejectUnauthorized = vscode_helpers.toBooleanSafe(CFG.rejectUnauthorized);
            }
        }

        return this;
    }

    /**
     * Gets or sets the custom timeout.
     *
     * @param {any} [newValue] The new value.
     *
     * @return {HTTPClientValue<number>}
     */
    public timeout(newValue?: any): HTTPClientValue<number> {
        if (arguments.length < 1) {
            return this._timeout;
        }

        if (_.isSymbol(newValue)) {
            newValue = vschc.IS_UNSET;
        } else {
            newValue = parseInt( vscode_helpers.toStringSafe(newValue).trim() );
            if (isNaN(newValue)) {
                newValue = undefined;
            }
        }

        this._timeout = newValue;
        return this;
    }

    /**
     * Unsets all custom values.
     *
     * @return {this}
     */
    public unsetAll() {
        this.unsetBody();
        this.unsetHeaders();
        this.unsetMethod();
        this.unsetParams();
        this.unsetTimeout();
        this.unsetUrl();

        return this;
    }

    /**
     * Unsets the custom body.
     *
     * @return {this}
     */
    public unsetBody(): this {
        this._body = vschc.IS_UNSET;

        return this;
    }

    /**
     * Unsets the custom headers.
     *
     * @return {this}
     */
    public unsetHeaders(): this {
        this._headers = {};

        return this;
    }

    /**
     * Unsets the custom HTTP method.
     *
     * @return {this}
     */
    public unsetMethod(): this {
        this._method = vschc.IS_UNSET;

        return this;
    }

    /**
     * Unsets all 'onDidSend' listeners.
     *
     * @return {this}
     */
    public unsetOnDidSendListeners() {
        this._onDidSend = [];

        return this;
    }

    /**
     * Unsets the custom query parameters.
     *
     * @return {this}
     */
    public unsetParams() {
        this._query = {};

        return this;
    }

    /**
     * Unsets the custom timeout.
     *
     * @return {this}
     */
    public unsetTimeout() {
        this._timeout = vschc.IS_UNSET;

        return this;
    }

    /**
     * Unsets the custom url.
     *
     * @return {this}
     */
    public unsetUrl() {
        this._url = vschc.IS_UNSET;

        return this;
    }

    /**
     * Gets or sets the custom URL.
     *
     * @param {any} [newValue] The new value.
     *
     * @return {HTTPClientValue<string>}
     */
    public url(newValue?: any): HTTPClientValue<string> {
        if (arguments.length > 0) {
            if (_.isSymbol(newValue)) {
                newValue = vschc.IS_UNSET;
            } else if (!_.isNil(newValue)) {
                newValue = vscode_helpers.toStringSafe( newValue );
            }

            this._url = newValue;
            return this;
        }

        return this._url;
    }
}


async function asStringValue(val: any): Promise<string | symbol> {
    if (_.isString(val)) {
        return val;
    }

    if (_.isSymbol(val)) {
        return vschc.IS_UNSET;
    }

    if (!_.isNil(val)) {
        if (Moment.isDate(val)) {
            return Moment(val).toISOString();
        } else if (Moment.isMoment(val)) {
            val =  val.toISOString();
        } else {
            val = (await vscode_helpers.asBuffer(val)).toString('ascii');
        }
    }

    return vscode_helpers.toStringSafe(val);
}

function uriParamsToObject(uri: any): any {
    if (!uri) {
        return <any>uri;
    }

    let params: any;
    if (!vscode_helpers.isEmptyString(uri.query)) {
        // s. https://css-tricks.com/snippets/jquery/get-query-params-object/
        params = uri.query.replace(/(^\?)/, '')
                          .split("&")
                          .map(function(n) { return n = n.split("="), this[vscode_helpers.normalizeString(n[0])] =
                                                                           vscode_helpers.toStringSafe(decodeURIComponent(n[1])), this; }
                          .bind({}))[0];
    }

    return params || {};
}
