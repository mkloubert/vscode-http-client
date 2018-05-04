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
import * as vschc_http from './http';
import * as vschc_scripts from './scripts';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';


interface ExecuteScriptResult {
    error?: any;
    response?: {
    };
}

/**
 * A HTTP request.
 */
export interface IHTTPRequest extends vscode.Disposable {
    /**
     * Gets the ID of that instance.
     */
    readonly id: any;
    /**
     * Registers an event listener that is invoked when ths visibility of the web view changes.
     *
     * @param {Function} listener The listener.
     *
     * @return this
     */
    readonly onDidChangeVisibility: (listener: (isVisible: boolean) => void | PromiseLike<void>) => this;
    /**
     * Posts a message to the view.
     *
     * @param {string} command The name of the command to send.
     * @param {any} [data] The optional data for the command.
     *
     * @return {Promise<boolean>} The promise that indicates if operation was successful or not.
     */
    readonly postMessage: (command: string, data?: any) => PromiseLike<boolean>;
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
    request: {
        body: string;
        executionTime: number;
        headers: any;
        method: string;
        startTime: string;
        url: string;
    };
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
     * Hide 'From File' button or not.
     */
    hideBodyFromFileButton?: boolean;
    /**
     * Indicates if body content should be readonly or not.
     */
    isBodyContentReadOnly?: boolean;
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


/**
 * Name of an event that is invoked after a WebView panel has been disposed.
 */
export const EVENT_WEBVIEWPANEL_DISPOSED = 'webviewpanel.disposed';
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
        this._resourceRoot = Path.join(__dirname, './res');

        this._html = '';

        await this.onInitialize();
    }

    /**
     * Invokes an action for a cancellation token source.
     *
     * @param {vscode.CancellationTokenSource} cancelTokenSrc The token source.
     * @param {Function} action The action to invoke.
     * @param {any[]} [args] One or more arguments for the action.
     *
     * @return {Promise<TResult>} The promise with the result of the action.
     */
    protected async invokeForCancellationTokenSource<TResult>(
        cancelTokenSrc: vscode.CancellationTokenSource,
        action: (...args: any[]) => TResult | PromiseLike<TResult>, ...args: any[]
    ) {
        const DISPOSED_LISTENER = () => {
            try {
                cancelTokenSrc.cancel();
            } catch (e) {
                vschc.showError(e);
            }
        };

        this.once(EVENT_WEBVIEWPANEL_DISPOSED, DISPOSED_LISTENER);
        try {
            return await Promise.resolve(
                action.apply(null, args)
            );
        } finally {
            vscode_helpers.tryRemoveListener(this,
                                             EVENT_WEBVIEWPANEL_DISPOSED, DISPOSED_LISTENER);
        }
    }

    /**
     * @inheritdoc
     */
    public onDidChangeVisibility(listener: (isVisible) => void | PromiseLike<void>) {
        const ME = this;

        if (listener) {
            this.panel.onDidChangeViewState((e) => {
                try {
                    Promise.resolve( listener(e.webviewPanel.visible) ).then(() => {
                    }, (err) => {
                        ME.showError(err);
                    });
                } catch (e) {
                    ME.showError(e);
                }
            });
        }

        return this;
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
     * @inheritdoc
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
                        vscode.Uri.file( ME._resourceRoot ),
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
                let err: any;
                try {
                    ME.onDidDispose().then(() => {
                    }, () => {});
                } catch (e) { err = e; }

                ME.emit(EVENT_WEBVIEWPANEL_DISPOSED,
                        err, ME.panel);
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
    private createHTTPFromResponse(response: SendRequestResponse) {
        let http = `HTTP/${ response.httpVersion } ${ response.code } ${ response.status }\r\n`;

        if (response.headers) {
            for (const H in response.headers) {
                http += `${H}: ${ response.headers[H] }\r\n`;
            }
        }

        http += `\r\n`;

        let data = new Buffer(http, 'ascii');
        if (response.body) {
            data = Buffer.concat([
                data,
                new Buffer(response.body, 'base64'),
            ]);
        }

        return data;
    }

    private async executeScript(request: RequestData) {
        const ME = this;

        let result: ExecuteScriptResult;

        try {
            const VISIBLE_EDITORS = vscode_helpers.asArray( vscode.window.visibleTextEditors );
            if (VISIBLE_EDITORS.length > 0) {
                for (const EDITOR of VISIBLE_EDITORS) {
                    await vscode.window.withProgress({
                        cancellable: true,
                        location: vscode.ProgressLocation.Notification,
                        title: 'Executing HTTP Script ...'
                    }, async (progress, cancelToken) => {
                        await vschc_scripts.executeScript({
                            cancelToken: cancelToken,
                            code: EDITOR.document.getText(),
                            handler: ME,
                            onDidSend: async (err: any, result?: vschc_http.SendHTTPRequestResult) => {
                                await ME.sendRequestCompleted(err, result);
                            },
                            progress: progress,
                            request: request,
                        });
                    });
                }
            } else {
                vscode.window.showWarningMessage('No open (script) editor found!');
            }
        } catch (e) {
            result = {
                error: vscode_helpers.toStringSafe(e),
            };
        } finally {
            await ME.postMessage('executeScriptCompleted', result);
        }
    }

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
            case 'executeScript':
                await this.executeScript( msg.data );
                break;

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

                    if (!_.isNil(this.startOptions.isBodyContentReadOnly)) {
                        await this.postMessage('setIfBodyContentIsReadOnly',
                                               vscode_helpers.toBooleanSafe(this.startOptions.isBodyContentReadOnly));
                    }

                    if (!_.isNil(this.startOptions.hideBodyFromFileButton)) {
                        await this.postMessage('setIfHideBodyFromFileButton',
                                               vscode_helpers.toBooleanSafe(this.startOptions.hideBodyFromFileButton));
                    }

                    await this.postMessage('findInitialControlToFocus');
                }
                break;

            case 'openReponseInEditor':
                await this.openReponseInEditor(msg.data);
                break;

            case 'openRequestInEditor':
                await this.openRequestInEditor(msg.data);
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
                await this.sendRequest(msg.data);
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
                            <span>From File</span>
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
            <a class="btn btn-dark" id="vschc-execute-script" role="button">
                <i class="fa fa-cogs" aria-hidden="true"></i>
                <span>Execute Script</span>
            </a>

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
    <i class="fa fa-pencil-square-o text-dark" aria-hidden="true"></i>
</a>
`;
            },
            getResourceUri: (path: string) => {
                return this.getResourceUri(path);
            },
            name: 'http-request',
        });
    }

    private async openReponseInEditor(response: SendRequestResponse) {
        const EDITOR = await vscode.workspace.openTextDocument({
            content: this.createHTTPFromResponse(response).toString('ascii'),
            language: 'http',
        });

        await vscode.window.showTextDocument( EDITOR );
    }

    private async openRequestInEditor(response: SendRequestResponse) {
        const REQUEST = response.request;
        if (!REQUEST) {
            return;
        }

        let data: Buffer;
        {
            let http = `${ REQUEST.method } ${ REQUEST.url } HTTP/1.1\r\n`;

            if (REQUEST.headers) {
                for (const H in REQUEST.headers) {
                    http += `${H}: ${ REQUEST.headers[H] }\r\n`;
                }
            }

            http += `\r\n`;

            data = new Buffer(http, 'ascii');
            if (!vscode_helpers.isEmptyString(REQUEST.body)) {
                data = Buffer.concat([
                    data,
                    new Buffer(REQUEST.body, 'base64'),
                ]);
            }
        }

        const EDITOR = await vscode.workspace.openTextDocument({
            content: data.toString('ascii'),
            language: 'http',
        });

        await vscode.window.showTextDocument( EDITOR );
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
        const DATA_TO_SAVE = this.createHTTPFromResponse(response);

        await vschc.saveFile(async (file) => {
            await FSExtra.writeFile(file.fsPath, DATA_TO_SAVE);
        }, {
            filters: {
                'HTTP file': [ 'http' ]
            },
            saveLabel: 'Save raw response',
        });
    }

    private async sendRequest(request: RequestData) {
        const ME = this;

        await vscode_helpers.using(new vscode.CancellationTokenSource(), async (cancelTokenSrc) => {
            await ME.invokeForCancellationTokenSource(cancelTokenSrc, async () => {
                await vscode_helpers.using(new vschc_http.HTTPClient(ME, request), async (client) => {
                    let err: any;
                    let result: vschc_http.SendHTTPRequestResult;
                    try {
                        result = await client.send(cancelTokenSrc.token);
                    } catch (e) {
                        err = e;
                    }

                    await ME.sendRequestCompleted(err, result);
                });
            });
        });
    }

    private async sendRequestCompleted(err: any, result: vschc_http.SendHTTPRequestResult) {
        let r: SendRequestResponse;
        if (err) {
            err = vscode_helpers.toStringSafe(err);
        } else {
            err = undefined;

            const RESP = result.response;
            const BODY = await vscode_helpers.readAll(RESP);

            let url = `${ result.url.protocol }//`;
            {
                if (!_.isNil(result.url.auth)) {
                    url += vscode_helpers.toStringSafe( result.url.auth ) + '@';
                }

                url += vscode_helpers.toStringSafe( result.url.host );
                url += vscode_helpers.toStringSafe( result.url.path );
            }

            r = {
                body: (BODY && BODY.length > 0) ? BODY.toString('base64') : null,
                code: RESP.statusCode,
                headers: {},
                httpVersion: RESP.httpVersion,
                request: {
                    body: await result.readRequestBody(),
                    executionTime: result.executionTime,
                    headers: vscode_helpers.cloneObject( result.options.headers ),
                    method: result.options.method,
                    startTime: result.startTime.toISOString(),
                    url: url,
                },
                suggestedExtension: false,
                status: RESP.statusMessage,
            };

            if (r.headers) {
                for (const H in RESP.headers) {
                    r.headers[ NormalizeHeaderCase(H) ] = RESP.headers[H];
                }

                r.suggestedExtension = MimeTypes.extension( RESP.headers['content-type'] );
            }
        }

        await this.postMessage('sendRequestCompleted', {
            error: err,
            response: r,
        });
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
 * Restores all saved requests.
 */
export async function restoreSavedRequests() {
    // TODO: implement
}

/**
 * Saves all open requests.
 */
export async function saveOpenRequests() {
    for (const R of vscode_helpers.asArray(REQUESTS)) {
        try {
            // TODO: implement
        } catch { }
    }
}

/**
 * Starts a new request.
 *
 * @param {StartNewRquestOptions} [opts] Custom options.
 *
 * @return {Promise<IHTTPRequest>} The promise with the new request object.
 */
export async function startNewRequest(opts?: StartNewRquestOptions): Promise<IHTTPRequest> {
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
