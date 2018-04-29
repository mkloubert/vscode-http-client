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
import * as FS from 'fs';
import * as FSExtra from 'fs-extra';
import * as HTTP from 'http';
import * as HTTPs from 'https';
import * as MimeTypes from 'mime-types';
const NormalizeHeaderCase = require("header-case-normalizer");
import * as Path from 'path';
import * as URL from 'url';
import * as vschc from './extension';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';


/**
 * Request data.
 */
export interface RequestData {
    /**
     * The body.
     */
    body: {
        /**
         * The content for the body field.
         */
        content: string | false;
    };
    /**
     * Headers.
     */
    headers: any;
    /**
     * The HTTP method.
     */
    method: string;
    /**
     * The URL.
     */
    url: string;
}

interface SaveContentData {
    data: string;
    suggestedExtension: string | false;
}

interface SendRequestResponse {
    body: string;
    code: number;
    headers: any;
    httpVersion: string;
    suggestedExtension: string | false;
    status: string;
}

interface SetBodyContentFromFileOptions {
    data: string;
    mime: string | false;
    path: string;
    size: number;
}

/**
 * Options for starting a new HTTP request.
 */
export interface StartNewRquestOptions {
    /**
     * The initial content for the body.
     */
    body?: string;
    /**
     * Initial data.
     */
    data?: RequestData;
    /**
     * The file to load.
     */
    file?: vscode.Uri;
    /**
     * Display options for the tab of the underlying view.
     */
    showOptions?: vscode.ViewColumn;
}

interface WebViewMessage {
    command: string;
    data?: any;
}


/**
 * A basic HTTP request.
 */
export abstract class HTTPRequestBase extends vscode_helpers.DisposableBase {
    /**
     * Stores the HTML for the WebView.
     */
    protected _html: string | false = false;
    private _panel: vscode.WebviewPanel;
    private _resourceRoot: string;
    private _startOptions: StartNewRquestOptions;

    /**
     * Returns an URI from the 'resources' directory.
     *
     * @param {string} p The (relative) path.
     *
     * @return {vscode.Uri} The URI.
     */
    public getResourceUri(p: string): vscode.Uri {
        p = vscode_helpers.toStringSafe(p);

        return vscode.Uri.file(
            Path.join(this._resourceRoot, p)
        ).with({
            scheme: 'vscode-resource'
        });
    }

    /**
     * Initializes the request.
     */
    public async initialize() {
        this._resourceRoot = Path.join(__dirname, './resources');

        this._html = '';

        await this.onInitialize();
    }

    /**
     * Is invoked when the web view received a message from the browser.
     *
     * @param {WebViewMessage} msg The received message.
     */
    protected async onDidReceiveMessage(msg: WebViewMessage) {
    }

    /**
     * The logic to intialize the request.
     */
    protected abstract async onInitialize();

    /**
     * @inheritdoc
     */
    protected onDispose() {
        vscode_helpers.tryDispose(this._panel);
    }

    /**
     * Gets the underlying panel.
     */
    public get panel(): vscode.WebviewPanel {
        return this._panel;
    }

    /**
     * Posts a message to the view.
     *
     * @param {string} command The name of the command to send.
     * @param {any} [data] The optional data for the command.
     *
     * @return {Promise<boolean>} The promise that indicates if operation was successful or not.
     */
    public async postMessage(command: string, data?: any) {
        const MSG: WebViewMessage = {
            command: command,
            data: data,
        };

        return await this.view.postMessage(MSG);
    }

    protected async showError(err: any) {
        return vschc.showError(err);
    }

    /**
     * Opens the view to start a request.
     *
     * @param {StartNewRquestOptions} [opts] Custom options.
     *
     * @return {Promise<boolean>} The promise that indicates if operation was successful or not.
     */
    public async start(opts?: StartNewRquestOptions) {
        const ME = this;

        if (this._panel) {
            return false;
        }

        if (_.isNil(opts)) {
            opts = {};
        }

        let showOptions = opts.showOptions;
        if (_.isNil(showOptions)) {
            showOptions = vscode.ViewColumn.One;
        }

        let newPanel: vscode.WebviewPanel;
        try {
            newPanel = vscode.window.createWebviewPanel(
                'vscodeHTTPClient',
                'New HTTP request',
                showOptions,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        vscode.Uri.file(
                            Path.resolve(
                                Path.join(__dirname, './resources')
                            )
                        ),
                    ]
                }
            );

            newPanel.webview.onDidReceiveMessage((msg: WebViewMessage) => {
                try {
                    if (!_.isNil(msg)) {
                        ME.onDidReceiveMessage(msg).then(() => {
                        }, (err) => {
                            ME.showError(err);
                        });
                    }
                } catch (e) {
                    ME.showError(e);
                }
            });

            if (false !== ME._html) {
                newPanel.webview.html = ME._html;
            }

            ME._startOptions = opts;
            ME._panel = newPanel;

            return true;
        } catch (e) {
            vscode_helpers.tryDispose(newPanel);

            throw e;
        }
    }

    /**
     * Gets the last start options.
     */
    public get startOptions(): StartNewRquestOptions {
        return this._startOptions;
    }

    /**
     * Gets the underlying web view.
     */
    public get view(): vscode.Webview {
        return this.panel.webview;
    }
}

/**
 * A HTTP request.
 */
export class HTTPRequest extends HTTPRequestBase {
    //TODO: make async
    private exportRequest(request: RequestData) {
        const ME = this;

        try {
            delete request.body;

            const DATA_TO_SAVE = new Buffer(
                JSON.stringify(request, null, 2), 'utf8'
            );

            vscode.window.showSaveDialog({
                filters: {
                    "HTTP Requests": [ 'http-request' ]
                },
                saveLabel: "Export request",
            }).then((file) => {
                if (!file) {
                    return;
                }

                try {
                    FS.writeFile(file.fsPath, DATA_TO_SAVE, (err) => {
                        if (err) {
                            ME.showError(err);
                        }
                    });
                } catch (e) {
                    ME.showError(e);
                }
            }, (err) => {
                ME.showError(err);
            });
        } catch (e) {
            ME.showError(e);
        }
    }

    //TODO: make async
    private importRequest() {
        const ME = this;

        try {
            vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    "HTTP Requests": [ 'http-request' ]
                },
                openLabel: "Import request",
            }).then((files) => {
                if (!files || files.length < 1) {
                    return;
                }

                try {
                    FS.readFile(files[0].fsPath, (err, data) => {
                        if (err) {
                            ME.showError(err);
                        } else {
                            try {
                                const REQUEST: RequestData = JSON.parse( data.toString('utf8') );
                                if (REQUEST) {
                                    ME.postMessage('importRequestCompleted', REQUEST);
                                }
                            } catch (e) {
                                ME.showError(err);
                            }
                        }
                    });
                } catch (e) {
                    ME.showError(e);
                }
            });
        } catch (e) {
            ME.showError(e);
        }
    }

    //TODO: make async
    private loadBodyContent() {
        const ME = this;

        const COMPLETED = (
            err: any,
            data?: string, path?: string, size?: number,
        ) => {
            if (err) {
                ME.showError(err);
            } else {
                ME.setBodyContentFromFile({
                    data: data,
                    mime: MimeTypes.lookup(path),
                    path: path,
                    size: size,
                });
            }
        };

        try {
            vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
            }).then((files) => {
                try {
                    if (!files || files.length < 1) {
                        return;
                    }

                    FS.readFile(files[0].fsPath, (err, data) => {
                        try {
                            if (err) {
                                COMPLETED(err);
                            } else {
                                COMPLETED(null,
                                          data.toString('base64'), Path.resolve(files[0].fsPath), data.length);
                            }
                        } catch (e) {
                            COMPLETED(e);
                        }
                    });
                } catch (e) {
                    COMPLETED(e);
                }
            }, (err) => {
                COMPLETED(err);
            });
        } catch (e) {
            COMPLETED(e);
        }
    }

    /**
     * @inheritdoc
     */
    protected async onDidReceiveMessage(msg: WebViewMessage) {
        const ME = this;

        switch (msg.command) {
            case 'exportRequest':
                ME.exportRequest( msg.data );
                break;

            case 'importRequest':
                ME.importRequest();
                break;

            case 'loadBodyContent':
                ME.loadBodyContent();
                break;

            case 'log':
                console.log( msg.data.message );
                break;

            case 'onLoaded':
                (async () => {
                    if (!_.isNil(ME.startOptions.file)) {
                        const FILE_PATH = ME.startOptions.file.fsPath;
                        const OPTS: SetBodyContentFromFileOptions = {
                            data: (await FSExtra.readFile(FILE_PATH)).toString('base64'),
                            mime: MimeTypes.lookup(FILE_PATH),
                            path: FILE_PATH,
                            size: (await FSExtra.lstat(FILE_PATH)).size,
                        };

                        await ME.setBodyContentFromFile(OPTS);
                    }

                    if (!_.isNil(ME.startOptions.body)) {
                        await ME.postMessage('setBodyContent', {
                            data: ME.startOptions.body
                        });
                    }

                    if (!_.isNil(ME.startOptions.data)) {
                        await ME.postMessage('importRequestCompleted', ME.startOptions.data);
                    }
                })().then(() => {}, (err) => {
                    ME.showError(err);
                });
                break;

            case 'saveContent':
                await ME.saveContent(msg.data);
                break;

            case 'saveRawResponse':
                await ME.saveRawResponse(msg.data);
                break;

            case 'sendRequest':
                ME.sendRequest(msg.data);
                break;

            case 'unsetBodyFromFile':
                await ME.unsetBodyFromFile();
                break;
        }
    }

    /**
     * @inheritdoc
     */
    protected async onInitialize() {
        this._html += `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">

    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <link rel="stylesheet" href="${ this.getResourceUri('css/hljs-atom-one-dark.css') }">
    <link rel="stylesheet" href="${ this.getResourceUri('css/bootstrap.min.css') }">

    <script src="${ this.getResourceUri('js/highlight.pack.js') }"></script>
    <script src="${ this.getResourceUri('js/jquery.min.js') }"></script>
    <script src="${ this.getResourceUri('js/bootstrap.bundle.min.js') }"></script>

    <script>
        const vscode = acquireVsCodeApi();

        function vschc_log(msg) {
            vscode.postMessage({
                command: 'log',
                data: {
                    message: '[vscode-http-client] ' + msg
                }
            });
        }

        window.onerror = function() {
            vschc_log(
                JSON.stringify(arguments)
            );
        };

        const AJAX_LOADER_URL = ${ JSON.stringify( '' + this.getResourceUri('img/ajax-loader.gif') ) };
    </script>

    <title>HTTP Client</title>
  </head>
  <body>
    <header>
        <nav class="navbar navbar-dark fixed-top bg-dark">
            <a class="navbar-brand" href="https://github.com/mkloubert/vscode-http-client" target="_blank">
                <img src="${ this.getResourceUri('img/icon.svg') }" width="30" height="30" class="d-inline-block align-top" alt="">
                <span>HTTP Client</span>
            </a>

            <form class="form-inline">
                <a class="btn btn-secondary" id="vschc-import-request-btn">Import</a>

                <a class="btn btn-primary" id="vschc-export-request-btn">Export</a>
            </form>
        </nav>
    </header>

    <main role="main" class="container">
        <div class="vschc-card card">
            <div class="card-header">
                Request Settings
            </div>

            <div class="card-body">
                <form>
                    <div class="form-group row">
                        <label for="vschc-input-url" class="col-sm-2 col-form-label text-right">URL:</label>

                        <div class="col-sm-8">
                            <input type="url" class="form-control" id="vschc-input-url" placeholder="https://example.com/resource/123">
                        </div>

                        <div class="col-sm-2">
                            <select class="form-control" id="vschc-input-method">
                                <option>DELETE</option>
                                <option selected>GET</option>
                                <option>HEAD</option>
                                <option>OPTIONS</option>
                                <option>PATCH</option>
                                <option>POST</option>
                                <option>PUT</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group row">
                        <label for="vschc-input-body-text" class="col-sm-2 col-form-label text-right">Body:</label>

                        <div class="col-sm-10" id="vschc-input-body-text-col" style="display: none;">
                            <textarea class="form-control" id="vschc-input-body-text" rows="10"></textarea>
                        </div>

                        <div class="col-sm-10" id="vschc-input-body-file-col" style="display: none;">
                            <div id="vschc-body-file-path"><a class="vschc-path" title="Click here to reset ..." href="#"></a>&nbsp;<span class="vschc-size"></span></div>
                            <div id="vschc-body-file-content-to-display" style="display: none;"></div>
                            <input type="hidden" id="vschc-input-body-file">
                        </div>
                    </div>

                    <div class="form-group row" id="vschc-btn-from-file-col" style="display: none;">
                        <label class="col-sm-2 text-right"></label>

                        <div class="col-sm-10">
                            <a class="btn btn-primary" id="vschc-btn-from-file" role="button">From file</a>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <div class="vschc-card card" id="vschc-headers-card">
            <div class="card-header">
                Custom Headers
            </div>

            <div class="card-body"></div>
        </div>

        <div class="row">
            <div class="col-sm-12 text-right" id="vschc-send-request-col">
                <a class="btn btn-success" id="vschc-send-request" role="button">Send Request</a>
            </div>
        </div>

        <div class="vschc-card card" id="vschc-response-card">
            <div class="card-header">
                <span class="align-middle">Response</span>
                <a class="btn btn-primary btn-sm float-right" id="vschc-save-raw-response-btn" style="display: none;">Save raw response</a>
            </div>

            <div class="card-body">
                No request started yet
            </div>
        </div>
    </main>

    <link rel="stylesheet" href="${ this.getResourceUri('css/style.css') }">
    <script src="${ this.getResourceUri('js/script.js') }"></script>
  </body>
</html>`;
    }

    private async saveContent(data: SaveContentData) {
        const OPTS: vscode.SaveDialogOptions = {
            saveLabel: 'Save response content',
        };

        if (data.suggestedExtension) {
            OPTS.filters = {
                'HTTP Response': [ data.suggestedExtension ]
            };
        }

        const FILE = await vscode.window.showSaveDialog(OPTS);

        if (FILE) {
            await FS.writeFile(FILE.fsPath, new Buffer(data.data, 'base64'));
        }
    }

    private async saveRawResponse(response: SendRequestResponse) {
        let http = `HTTP/${ response.httpVersion } ${ response.code } ${ response.status }\r\n`;

        if (response.headers) {
            for (const H in response.headers) {
                http += `${H}: ${ response.headers[H] }\r\n`;
            }
        }

        http += `\r\n`;

        let dataToSave = new Buffer(http, 'ascii');
        if (response.body) {
            dataToSave = Buffer.concat([
                dataToSave,
                new Buffer(response.body, 'base64'),
            ]);
        }

        const FILE = await vscode.window.showSaveDialog({
            filters: {
                'HTTP file': [ 'http' ]
            },
            saveLabel: 'Save raw response',
        });

        if (FILE) {
            await FSExtra.writeFile(FILE.fsPath, dataToSave);
        }
    }

    private sendRequest(request: RequestData) {
        const ME = this;

        const COMPLETED = async (err: any, resp?: HTTP.ClientResponse) => {
            let r: SendRequestResponse;
            if (!err) {
                const BODY = await vscode_helpers.readAll(resp);

                r = {
                    body: (BODY && BODY.length > 0) ? BODY.toString('base64') : null,
                    code: resp.statusCode,
                    headers: {},
                    httpVersion: resp.httpVersion,
                    suggestedExtension: false,
                    status: resp.statusMessage,
                };

                if (r.headers) {
                    for (const H in resp.headers) {
                        r.headers[ NormalizeHeaderCase(H) ] = resp.headers[H];
                    }

                    r.suggestedExtension = MimeTypes.extension( resp.headers['content-type'] );
                }
            }

            try {
                await ME.postMessage('sendRequestCompleted', {
                    error: vscode_helpers.toStringSafe(err),
                    response: r,
                });
            } catch (e) {
                ME.showError(e);
            }
        };

        let requestUrlValue = vscode_helpers.toStringSafe( request.url );
        if (!requestUrlValue.toLowerCase().trim().startsWith('http')) {
            requestUrlValue = 'http://' + requestUrlValue;
        }

        const REQUEST_URL = URL.parse(requestUrlValue);

        let createRequest: (() => HTTP.ClientRequest) | false = false;

        const CALLBACK = (resp: HTTP.ClientResponse) => {
            COMPLETED(null, resp).then(() => {
            }, (err) => {
                ME.showError(err);
            });
        };

        const PROTOCOL = vscode_helpers.normalizeString(REQUEST_URL.protocol);

        const OPTS: HTTP.RequestOptions = {
            headers: {},
            hostname: vscode_helpers.toStringSafe(REQUEST_URL.hostname),
            method: vscode_helpers.toStringSafe(request.method).toUpperCase().trim(),
            path: REQUEST_URL.path,
        };

        if (request.headers) {
            for (const H in request.headers) {
                const NAME = NormalizeHeaderCase(H);
                if ('' !== NAME) {
                    OPTS.headers[NAME] = vscode_helpers.toStringSafe( request.headers[H] );
                }
            }
        }

        if (vscode_helpers.isEmptyString(OPTS.hostname)) {
            OPTS.hostname = '127.0.0.1';
        }
        if (vscode_helpers.isEmptyString(OPTS.method)) {
            OPTS.method = 'GET';
        }

        OPTS.port = parseInt( vscode_helpers.normalizeString(REQUEST_URL.port) );

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

        const REQ = createRequest();

        let body: Buffer;
        if (request.body) {
            if (false !== request.body.content) {
                body = new Buffer(vscode_helpers.toStringSafe(request.body.content).trim(), 'base64');
            }
        }

        if (body && body.length > 0) {
            REQ.write( body );
        }

        REQ.end();
    }

    private async setBodyContentFromFile(opts: SetBodyContentFromFileOptions) {
        return this.postMessage('setBodyContentFromFile', opts);
    }

    private async unsetBodyFromFile() {
        const SELECTED_ITEM = await vscode.window.showWarningMessage('Do really want to unset the current body?', {
            title: 'No',
            isCloseAffordance: true,
            value: 0,
        }, {
            title: 'Yes',
            value: 1,
        });

        if (SELECTED_ITEM) {
            if (1 === SELECTED_ITEM.value) {
                await this.setBodyContentFromFile(null);
            }
        }
    }
}


/**
 * Starts a new request.
 *
 * @param {StartNewRquestOptions} [opts] Custom options.
 *
 * @return {Promise<HTTPRequest>} The promise with the new request object.
 */
export async function startNewRequest(opts?: StartNewRquestOptions) {
    let newRequest: HTTPRequest;
    try {
        newRequest = new HTTPRequest();

        await newRequest.initialize();

        await newRequest.start(opts);

        return newRequest;
    } catch (e) {
        vscode_helpers.tryDispose(newRequest);

        throw e;
    }
}
