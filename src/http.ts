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
const NormalizeHeaderCase = require("header-case-normalizer");
import * as URL from 'url';
import * as vschc from './extension';
import * as vschc_requests from './requests';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';


/**
 * Result of a 'HTTPClient.send()' call.
 */
export interface SendHTTPRequestResult {
    /**
     * The underlying request data.
     */
    data: vschc_requests.RequestData;
    /**
     * The underlying request options.
     */
    options: HTTP.RequestOptions;
    /**
     * The underlying request context.
     */
    request: HTTP.ClientRequest;
    /**
     * The underlying response context.
     */
    response: HTTP.ClientResponse;
    /**
     * The called URL.
     */
    url: URL.Url;
}

/**
 * Result value for getter / setter method of a HTTP client.
 */
export type HTTPClientValue<TValue> = TValue | symbol | HTTPClient;

export type OnDidSendListener = (err: any, result?: SendHTTPRequestResult) => void | PromiseLike<void>;


/**
 * A HTTP client.
 */
export class HTTPClient {
    private _body: any = vschc.IS_UNSET;
    private _headers: any;
    private _method: any = vschc.IS_UNSET;
    private _onDidSend: OnDidSendListener[];
    private _query: any;
    private _url: any = vschc.IS_UNSET;

    /**
     * Initializes a new instance of that class.
     *
     * @param {vschc_requests.IHTTPRequest} request The request.
     * @param {vschc_requests.RequestData} data The data.
     */
    public constructor(
        public readonly request: vschc_requests.IHTTPRequest,
        public readonly data: vschc_requests.RequestData,
    ) {
        this.unsetOnDidSendListeners();

        this.unsetHeaders();
        this.unsetParams();
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
            } else if (!_.isNil(newValue)) {
                if (!Buffer.isBuffer(newValue)) {
                    newValue = new Buffer( vscode_helpers.toStringSafe(newValue), 'binary' );
                }
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
     * Adds an event listener that is invoked AFTER a request has been send.
     *
     * @param {OnDidSendListener} listener The listener to add.
     *
     * @return this
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
     * Sends the request based on the current data.
     */
    public send() {
        const ME = this;

        return new Promise<SendHTTPRequestResult>(async (resolve, reject) => {
            let completedInvoked = false;
            const COMPLETED = async (err: any, result?: SendHTTPRequestResult) => {
                if (completedInvoked) {
                    return;
                }
                completedInvoked = true;

                for (const L of vscode_helpers.toArray(ME._onDidSend)) {
                    await Promise.resolve( L(err, result) );
                }

                if (err) {
                    reject(err);
                } else {
                    resolve(result);
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
                const OPTS: HTTP.RequestOptions = {
                    headers: {},
                    hostname: vscode_helpers.toStringSafe(REQUEST_URL.hostname),
                    method: ME._method,
                    path: REQUEST_URL.pathname,
                };

                if (_.isSymbol(OPTS.method)) {
                    OPTS.method = vscode_helpers.toStringSafe(DATA.method);  // no custom method
                }

                const CALLBACK = (resp: HTTP.ClientResponse) => {
                    COMPLETED(null, {
                        data: DATA,
                        options: OPTS,
                        request: newRequest,
                        response: resp,
                        url: REQUEST_URL,
                    }).then(() => {}, (err) => {
                        reject(err);
                    });
                };

                const APPLY_HEADERS = (headersToApply: any) => {
                    if (headersToApply) {
                        for (const H in headersToApply) {
                            const NAME = NormalizeHeaderCase(H);
                            if ('' !== NAME) {
                                OPTS.headers[NAME] = vscode_helpers.toStringSafe( headersToApply[H] );
                            }
                        }
                    }
                };

                APPLY_HEADERS(DATA.headers);  // first the default value
                APPLY_HEADERS(ME._headers);  // then the custom ones

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
                    const APPLY_PARAMS = (q: any) => {
                        if (q) {
                            for (let p in q) {
                                query.push({
                                    'name': vscode_helpers.toStringSafe(p).trim(),
                                    'value': vscode_helpers.toStringSafe( q[p] ),
                                });
                            }
                        }
                    };

                    APPLY_PARAMS( uriParamsToObject(REQUEST_URL) );
                    APPLY_PARAMS( ME._query );

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
                            OPTS.protocol = 'http:';
                            if (isNaN(<any>OPTS.port)) {
                                OPTS.port = 80;
                            }

                            return HTTP.request(OPTS, CALLBACK);
                        };
                        break;

                    case 'https:':
                        createRequest = () => {
                            OPTS.protocol = 'https:';
                            if (isNaN(<any>OPTS.port)) {
                                OPTS.port = 443;
                            }

                            return HTTPs.request(OPTS, CALLBACK);
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

                if (body && body.length > 0) {
                    newRequest.write( body );
                }

                newRequest.end();
            } catch (e) {
                COMPLETED(e).then(() => {}, (err) => {
                    reject(err);
                });
            }
        });
    }

    /**
     * Unsets the custom body.
     *
     * @return this
     */
    public unsetBody(): this {
        this._body = vschc.IS_UNSET;

        return this;
    }

    /**
     * Unsets the custom headers.
     *
     * @return this
     */
    public unsetHeaders(): this {
        this._headers = {};

        return this;
    }

    /**
     * Unsets the custom HTTP method.
     *
     * @return this
     */
    public unsetMethod(): this {
        this._method = vschc.IS_UNSET;

        return this;
    }

    /**
     * Unsets all 'onDidSend' listeners.
     *
     * @return this
     */
    public unsetOnDidSendListeners() {
        this._onDidSend = [];

        return this;
    }

    /**
     * Unsets the custom query parameters.
     *
     * @return this
     */
    public unsetParams() {
        this._query = {};

        return this;
    }

    /**
     * Unsets the custom url.
     *
     * @return this
     */
    public unsetUrl() {
        this._query = {};

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

function uriParamsToObject(uri: URL.Url | vscode.Uri): any {
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
