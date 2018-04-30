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
import * as FSExtra from 'fs-extra';
import * as HTTP from 'http';
import * as HTTPs from 'https';
import * as MimeTypes from 'mime-types';
const NormalizeHeaderCase = require("header-case-normalizer");
import * as Path from 'path';
import * as URL from 'url';
import * as UUID from 'uuid';
import * as vschc from './extension';
import * as vschc_html from './html';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';


/**
 * A HTTP request.
 */
export interface IHTTPRequest extends vscode.Disposable {
    /**
     * Gets the ID of that instance.
     */
    readonly id: any;
}

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
        /**
         * The path of the file.
         */
        file: string | false;
        /**
         * The file size.
         */
        fileSize: number | false;
        /**
         * The MIME type.
         */
        mime?: string | false;
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
     * The title of the request.
     */
    title: string;
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
     * A list of one or more disposable to be owned by the request.
     */
    disposables?: vscode.Disposable | vscode.Disposable[];
    /**
     * The file to load.
     */
    file?: vscode.Uri;
    /**
     * One or more initial headers.
     */
    headers?: any;
    /**
     * Display options for the tab of the underlying view.
     */
    showOptions?: vscode.ViewColumn;
    /**
     * The title for the view.
     */
    title?: string;
}

interface WebViewMessage {
    command: string;
    data?: any;
}


let nextHTTPRequestId = Number.MIN_SAFE_INTEGER;
/**
 * The global list of requests.
 */
export const REQUESTS: IHTTPRequest[] = [];


/**
 * A basic HTTP request.
 */
export abstract class HTTPRequestBase extends vscode_helpers.DisposableBase implements IHTTPRequest {
    /**
     * Stores the HTML for the WebView.
     */
    protected _html: string | false = false;
    private _panel: vscode.WebviewPanel;
    private _resourceRoot: string;
    private _startOptions: StartNewRquestOptions;

    /**
     * Initializes a new instance of that class.
     */
    public constructor() {
        super();

        this.id = `${nextHTTPRequestId++}\n${ UUID.v4() }`;
    }

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
     * @inheritdoc
     */
    public readonly id: any;

    /**
     * Initializes the request.
     */
    public async initialize() {
        this._resourceRoot = Path.join(__dirname, './resources');

        this._html = '';

        await this.onInitialize();
    }

    /**
     * Is invoked after the underlying panel has been disposed.
     */
    protected async onDidDispose() {
        removeRequest(this);
    }

    /**
     * Is invoked when the web view received a message from the browser.
     *
     * @param {WebViewMessage} msg The received message.
     */
    protected async onDidReceiveMessage(msg: WebViewMessage) {
    }

    /**
     * @inheritdoc
     */
    protected onDispose() {
        vscode_helpers.tryDispose(this._panel);

        const OPTS = this.startOptions;
        if (OPTS) {
            for (const DISP of vscode_helpers.asArray(OPTS.disposables)) {
                vscode_helpers.tryDispose( DISP );
            }
        }
    }

    /**
     * The logic to intialize the request.
     */
    protected abstract async onInitialize();

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

    /**
     * Shows an error.
     *
     * @param {any} err The error to show.
     */
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

        let title = vscode_helpers.toStringSafe(opts.title).trim();
        if ('' === title) {
            title = 'New HTTP Request';
        }

        let showOptions = opts.showOptions;
        if (_.isNil(showOptions)) {
            showOptions = vscode.ViewColumn.One;
        }

        let newPanel: vscode.WebviewPanel;
        try {
            newPanel = vscode.window.createWebviewPanel(
                'vscodeHTTPClient',
                title,
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

            newPanel.onDidDispose(() => {
                try {
                    ME.onDidDispose().then(() => {
                    }, (err) => {});
                } catch { }
            });

            if (false !== ME._html) {
                newPanel.webview.html = vscode_helpers.toStringSafe( ME._html );
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
    private async exportRequest(request: RequestData) {
        if (request.body) {
            delete request.body.mime;
        }

        const DATA_TO_SAVE = new Buffer(
            JSON.stringify(request, null, 2), 'utf8'
        );

        await vschc.saveFile(async (file) => {
            await FSExtra.writeFile(file.fsPath, DATA_TO_SAVE);
        }, {
            filters: {
                "HTTP Requests": [ 'http-request' ]
            },
            saveLabel: "Export Request",
        });
    }

    private async importRequest() {
        await vschc.openFiles(async (files) => {
            const DATA = (await FSExtra.readFile(files[0].fsPath)).toString('utf8');
            if (!vscode_helpers.isEmptyString(DATA)) {
                const REQUEST: RequestData = JSON.parse( DATA );
                if (REQUEST) {
                    if (REQUEST.body) {
                        const FILE = REQUEST.body.file;
                        if (false !== FILE && !vscode_helpers.isEmptyString(FILE)) {
                            REQUEST.body.mime = MimeTypes.lookup(FILE);
                        }
                    }

                    await this.postMessage('importRequestCompleted', REQUEST);
                }
            }
        }, {
            filters: {
                "HTTP Requests": [ 'http-request' ]
            },
            openLabel: "Import Request",
        });
    }

    private async loadBodyContent() {
        await vschc.openFiles(async (files) => {
            const PATH = files[0].fsPath;
            const DATA = await FSExtra.readFile(PATH);

            await this.setBodyContentFromFile({
                data: DATA.toString('base64'),
                mime: MimeTypes.lookup(PATH),
                path: PATH,
                size: DATA.length,
            });
        });
    }

    /**
     * @inheritdoc
     */
    protected async onDidReceiveMessage(msg: WebViewMessage) {
        switch (msg.command) {
            case 'exportRequest':
                await this.exportRequest( msg.data );
                break;

            case 'importRequest':
                await this.importRequest();
                break;

            case 'loadBodyContent':
                await this.loadBodyContent();
                break;

            case 'log':
                console.log(`[vscode-http-client] '${ msg.data.message }'`);
                break;

            case 'onLoaded':
                {
                    await this.postMessage('initTitle',
                                           vscode_helpers.toStringSafe(this.panel.title));

                    if (!_.isNil(this.startOptions.file)) {
                        const FILE_PATH = this.startOptions.file.fsPath;
                        const OPTS: SetBodyContentFromFileOptions = {
                            data: (await FSExtra.readFile(FILE_PATH)).toString('base64'),
                            mime: MimeTypes.lookup(FILE_PATH),
                            path: FILE_PATH,
                            size: (await FSExtra.lstat(FILE_PATH)).size,
                        };

                        await this.setBodyContentFromFile(OPTS);
                    }

                    if (!_.isNil(this.startOptions.body)) {
                        await this.postMessage('setBodyContent', {
                            data: this.startOptions.body
                        });
                    }

                    if (!_.isNil(this.startOptions.headers)) {
                        await this.postMessage('setHeaders',
                                               this.startOptions.headers);
                    }

                    if (!_.isNil(this.startOptions.data)) {
                        await this.postMessage('importRequestCompleted', this.startOptions.data);
                    }

                    await this.postMessage('findInitialControlToFocus');
                }
                break;

            case 'resetAllHeaders':
                await this.resetAllHeaders();
                break;

            case 'resetResponses':
                await this.resetResponses();
                break;

            case 'saveContent':
                await this.saveContent(msg.data);
                break;

            case 'saveRawResponse':
                await this.saveRawResponse(msg.data);
                break;

            case 'sendRequest':
                this.sendRequest(msg.data);
                break;

            case 'titleUpdated':
                try {
                    this.panel.title = vscode_helpers.toStringSafe(msg.data);
                } catch { }
                break;

            case 'unsetBodyFromFile':
                await this.unsetBodyFromFile();
                break;
        }
    }

    /**
     * @inheritdoc
     */
    protected async onInitialize() {
        this._html = vschc_html.generateHtmlDocument({
            getContent: () => `
<main role="main" class="container">
    <div class="vschc-card card">
        <div class="card-header bg-info text-white">
            <span>Request Settings</span>
        </div>

        <div class="card-body">
            <form>
                <div class="form-group row">
                    <label for="vschc-input-title" class="col-sm-2 col-form-label text-right">
                        <span class="align-middle">Title:</span>
                    </label>

                    <div class="col-sm-10">
                        <input type="url" class="form-control" id="vschc-input-title" placeholder="Title of that request">
                    </div>
                </div>

                <div class="form-group row">
                    <label for="vschc-input-url" class="col-sm-2 col-form-label text-right">
                        <span class="align-middle">URL:</span>
                    </label>

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
                    <label for="vschc-input-body-text" id="vschc-input-body-text-label" class="col-sm-2 col-form-label text-right">Body:</label>

                    <div class="col-sm-10" id="vschc-input-body-text-col" style="display: none;">
                        <textarea class="form-control" id="vschc-input-body-text" rows="10"></textarea>
                    </div>

                    <div class="col-sm-10" id="vschc-input-body-file-col" style="display: none;">
                        <div id="vschc-body-file-path"><a class="vschc-path" title="Click here to reset ..." href="#"></a>&nbsp;(<span class="vschc-size"></span>)</div>
                        <div id="vschc-body-file-content-to-display" style="display: none;"></div>
                        <input type="hidden" id="vschc-input-body-file">
                    </div>
                </div>

                <div class="form-group row" id="vschc-btn-from-file-col" style="display: none;">
                    <label class="col-sm-2 text-right"></label>

                    <div class="col-sm-10">
                        <a class="btn btn-primary" id="vschc-btn-from-file" role="button">
                            <i class="fa fa-file-text" aria-hidden="true"></i>
                            <span>From file</span>
                        </a>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <div id="vschc-headers-card-accordion">
        <div class="vschc-card card" id="vschc-headers-card">
            <div class="card-header bg-info text-white" id="vschc-headers-card-heading">
                <span class="align-middle" data-toggle="collapse" data-target="#vschc-headers-card-body" aria-expanded="true" aria-controls="vschc-headers-card-body">Custom Headers</span>

                <a class="btn btn-danger btn-sm float-right" id="vschc-reset-all-headers-btn" title="Remove All Headers">
                    <i class="fa fa-eraser" aria-hidden="true"></i>
                </a>

                <a class="btn btn-dark btn-sm float-right" id="vschc-add-header-btn" title="Add New Header">
                    <i class="fa fa-plus-circle" aria-hidden="true"></i>
                </a>
            </div>

            <div id="vschc-headers-card-body" class="collapse show" aria-labelledby="vschc-headers-card-heading" data-parent="#vschc-headers-card-accordion">
                <div class="card-body"></div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-sm-12 text-right" id="vschc-send-request-col">
            <a class="btn btn-success" id="vschc-send-request" role="button">
                <i class="fa fa-paper-plane" aria-hidden="true"></i>
                <span>Send Request</span>
            </a>
        </div>
    </div>

    <div class="vschc-card card" id="vschc-response-card">
        <div class="card-header bg-info text-white">
            <span class="align-middle">Responses</span>

            <a class="btn btn-danger btn-sm float-right" id="vschc-reset-responses-btn" style="display: none;" title="Reset Responses">
                <i class="fa fa-eraser" aria-hidden="true"></i>
            </a>
        </div>

        <div class="card-body"></div>
    </div>
</main>
`,
            getHeaderButtons: () => {
                return `
<a class="btn btn-primary btn-sm" id="vschc-import-request-btn" title="Load Request Settings From File">
    <i class="fa fa-book" aria-hidden="true"></i>
</a>

<a class="btn btn-secondary btn-sm" id="vschc-export-request-btn" title="Save Request Settings To File">
    <i class="fa fa-pencil-square-o" aria-hidden="true"></i>
</a>
`;
            },
            getResourceUri: (path: string) => {
                return this.getResourceUri(path);
            },
            name: 'http-request',
        });
    }

    private async resetAllHeaders() {
        const ME = this;

        await vschc.confirm(async (yes) => {
            if (yes) {
                await ME.postMessage('resetAllHeadersCompleted');
            }
        }, 'Really remove all headers?');
    }

    private async resetResponses() {
        const ME = this;

        await vschc.confirm(async (yes) => {
            if (yes) {
                await ME.postMessage('resetResponsesCompleted');
            }
        }, 'Are you sure to reset the current list of responses?');
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

        await vschc.saveFile(async (file) => {
            await FSExtra.writeFile(file.fsPath, new Buffer(data.data, 'base64'));
        }, OPTS);
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

        await vschc.saveFile(async (file) => {
            await FSExtra.writeFile(file.fsPath, dataToSave);
        }, {
            filters: {
                'HTTP file': [ 'http' ]
            },
            saveLabel: 'Save raw response',
        });
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
        const ME = this;

        await vschc.confirm(async (yes) => {
            if (yes) {
                await ME.setBodyContentFromFile(null);
            }
        }, 'Do really want to unset the current body?');
    }
}


/**
 * Adds a request to the global list.
 *
 * @param {IHTTPRequest} request The request to add.
 *
 * @return {boolean} Item has been added or not.
 */
export function addRequest(request: IHTTPRequest) {
    if (request) {
        return REQUESTS.push( request );
    }

    return false;
}

/**
 * Removes a request from the global list.
 *
 * @param {IHTTPRequest} request The request to remove.
 *
 * @return {IHTTPRequest[]} The list of removed items.
 */
export function removeRequest(request: IHTTPRequest) {
    const REMOVED_REQUESTS: IHTTPRequest[] = [];

    if (request) {
        for (let i = 0; i < REQUESTS.length; ) {
            const R = REQUESTS[i];

            if (R.id === request.id) {
                REQUESTS.splice(i, 1);

                REMOVED_REQUESTS.push(R);
            } else {
                ++i;
            }
        }
    }

    return REMOVED_REQUESTS;
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

        addRequest( newRequest );
        return newRequest;
    } catch (e) {
        vscode_helpers.tryDispose(newRequest);

        throw e;
    }
}
