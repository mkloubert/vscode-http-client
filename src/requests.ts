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
import * as Crypto from 'crypto';
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
     * Applies request settings to the view.
     *
     * @param {RequestData} requestData The data to apply.
     *
     * @return {Promise<boolean>} The promise that indicates if operation was successful or not.
     */
    readonly applyRequest: (requestData: RequestData) => PromiseLike<boolean>;
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

interface OpenContentData {
    data: string;
    suggestedExtension: string | false;
}

/**
 * Request data.
 */
export interface RequestData {
    /**
     * The body.
     */
    body: RequestDataBody;
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
    title: string | false;
    /**
     * The URL.
     */
    url: string;
}

/**
 * Body for request data.
 */
export interface RequestDataBody {
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
}

interface SaveContentData {
    data: string;
    suggestedExtension: string | false;
}

interface SendRequestResponse {
    body: string;
    bodyIsText: boolean;
    code: number;
    headers: any;
    httpVersion: string;
    request: {
        body: string;
        bodyIsText: boolean;
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
     * An optional callback, that is invoked after page of webview has been loaded.
     */
    onLoaded?: () => void | PromiseLike<void>;
    /**
     * Display options for the tab of the underlying view.
     */
    showOptions?: vscode.ViewColumn;
    /**
     * The title for the view.
     */
    title?: string;
}

interface WebViewMessage extends vschc.WebViewMessage {
}


/**
 * Name of an event that is invoked after a WebView panel has been disposed.
 */
export const EVENT_WEBVIEWPANEL_DISPOSED = 'webviewpanel.disposed';
const KNOWN_URLS = {
    'github': 'https://github.com/mkloubert/vscode-http-client',
    'paypal': 'https://twitter.com/mjkloubert',
    'twitter': 'https://paypal.me/MarcelKloubert',
};
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
    private _startOptions: StartNewRquestOptions;
    private _styleChangedListener: (uri: vscode.Uri) => void;

    /**
     * Initializes a new instance of that class.
     */
    public constructor() {
        super();

        this.id = `${nextHTTPRequestId++}\n${ UUID.v4() }`;
    }

    /**
     * @inheritdoc
     */
    public async applyRequest(requestData: RequestData) {
        return this.postMessage('applyRequest', requestData);
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

        let u: vscode.Uri;

        for (const R of vschc.getWebViewResourceUris()) {
            const PATH_TO_CHECK = Path.resolve(
                Path.join(R.fsPath, p)
            );

            u = vscode.Uri.file( PATH_TO_CHECK ).with({
                scheme: 'vscode-resource'
            });

            try {
                if (vscode_helpers.isFileSync(PATH_TO_CHECK)) {
                    break;
                }
            } catch { }
        }

        return u;
    }

    /**
     * @inheritdoc
     */
    public readonly id: any;

    /**
     * Initializes the request.
     */
    public async initialize() {
        const ME = this;

        ME._html = '';

        ME._styleChangedListener = (uri) => {
            const RES_URI = `${ uri }`;

            ME.postMessage('styleChanged',
                           RES_URI);
        };

        vscode_helpers.EVENTS.addListener(
            vschc.EVENT_STYLE_CHANGED,
            ME._styleChangedListener
        );

        await ME.onInitialize();
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
        super.onDispose();

        vscode_helpers.tryRemoveListener(
            vscode_helpers.EVENTS,
            vschc.EVENT_STYLE_CHANGED, this._styleChangedListener
        );

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
     * Gets the root directories for the web view's resources.
     */
    public get resourceRoots(): string[] {
        return vschc.getWebViewResourceUris()
                    .map(u => u.fsPath);
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
                    enableCommandUris: true,
                    enableFindWidget: true,
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: vschc.getWebViewResourceUris(),
                }
            );

            newPanel.webview.onDidReceiveMessage((msg: WebViewMessage) => {
                try {
                    if (_.isNil(msg)) {
                        return;
                    }

                    let action: Function = async () => {
                        await ME.onDidReceiveMessage(msg);
                    };

                    switch (msg.command) {
                        case 'openKnownUrl':
                            const KU = KNOWN_URLS[ vscode_helpers.normalizeString(msg.data) ];
                            if (!_.isNil(KU)) {
                                action = async () => {
                                    await vschc.open( KU );
                                };
                            }
                            break;

                        case 'openLink':
                            const LINK = vscode_helpers.toStringSafe(msg.data).trim();
                            if (LINK.toLowerCase().startsWith('http://') || LINK.toLowerCase().startsWith('https://')) {
                                action = async () => {
                                    await vschc.open( LINK );
                                };
                            }
                            break;
                    }

                    if (action) {
                        Promise.resolve( action() ).then(() => {
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
    private async cloneRequest(request: RequestData) {
        let newRequest: IHTTPRequest;
        try {
            newRequest = await startNewRequest({
                onLoaded: async () => {
                    await newRequest.applyRequest(request);
                }
            });
        } catch (e) {
            vscode_helpers.tryDispose( newRequest );

            throw e;
        }
    }

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
            let editorsFound = false;

            const VISIBLE_EDITORS = vscode_helpers.asArray( vscode.window.visibleTextEditors ).filter(e => {
                return e.document &&
                       !e.document.isClosed;
            });
            if (VISIBLE_EDITORS.length > 0) {
                for (const EDITOR of VISIBLE_EDITORS) {
                    try {
                        const DOC = EDITOR.document;

                        if (!DOC.isUntitled) {
                            if (!vscode_helpers.isEmptyString(DOC.fileName)) {
                                if (!(await vscode_helpers.isFile(DOC.fileName))) {
                                    continue;
                                }
                            }
                        }

                        editorsFound = true;

                        await vscode.window.withProgress({
                            cancellable: true,
                            location: vscode.ProgressLocation.Notification,
                            title: 'Executing HTTP Script ...'
                        }, async (progress, cancelToken) => {
                            await vschc_scripts.executeScript({
                                cancelToken: cancelToken,
                                code: DOC.getText(),
                                getResourceUri: (p) => {
                                    return ME.getResourceUri(p);
                                },
                                handler: ME,
                                onDidSend: async (err: any, result?: vschc_http.SendHTTPRequestResult) => {
                                    await ME.sendRequestCompleted(err, result);
                                },
                                output: vschc.getOutputChannel(),
                                progress: progress,
                                request: request,
                                webResourceRoots: ME.resourceRoots,
                            });
                        });
                    } catch (e) {
                        await ME.sendRequestCompleted(e, null);
                    }
                }
            }

            if (!editorsFound) {
                vscode.window.showWarningMessage('No open (script) editor found!');
            }
        } catch (e) {
            await ME.sendRequestCompleted(e, null);
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

    private async getBodyLength(request: RequestData) {
        let length: number | false = false;

        if (request.body) {
            if (false !== request.body.content) {
                length = (new Buffer(request.body.content.trim(), 'base64')).length;
            }
        }

        await this.postMessage('getBodyLengthCompleted',
                               length);
    }

    private async getBodyMD5(request: RequestData) {
        let md5: string | false = false;

        if (request.body) {
            if (false !== request.body.content) {
                const DIGEST = Crypto.createHash('md5');

                DIGEST.update( new Buffer(request.body.content.trim(), 'base64') );

                md5 = DIGEST.digest().toString('base64');
            }
        }

        await this.postMessage('getBodyMD5Completed',
                               md5);
    }

    private async importHTTPFile() {
        const ME = this;

        await vschc.openFiles(async (files) => {
            const REQUEST = await fromHTTPFile( files[0].fsPath );
            if (REQUEST) {
                await ME.importRequestCompleted( REQUEST );
            }
        }, {
            filters: {
                "HTTP File": [ 'http' ]
            },
            openLabel: "Import HTTP File",
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

                    await this.importRequestCompleted(REQUEST);
                }
            }
        }, {
            filters: {
                "HTTP Requests": [ 'http-request' ]
            },
            openLabel: "Import Request",
        });
    }

    private async importRequestCompleted(request: RequestData) {
        return this.applyRequest(request);
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
            case 'cloneRequest':
                await this.cloneRequest( msg.data );
                break;

            case 'executeScript':
                await this.executeScript( msg.data );
                break;

            case 'exportRequest':
                await this.exportRequest( msg.data );
                break;

            case 'getBodyLength':
                await this.getBodyLength( msg.data );
                break;

            case 'getBodyMD5':
                await this.getBodyMD5( msg.data );
                break;

            case 'importHTTPFile':
                await this.importHTTPFile();
                break;

            case 'importRequest':
                await this.importRequest();
                break;

            case 'loadBodyContent':
                await this.loadBodyContent();
                break;

            case 'log':
                console.log(`[vscode-http-client] '${ vscode_helpers.toStringSafe(msg.data.message) }'`);
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

                    if (this.startOptions.onLoaded) {
                        await Promise.resolve( this.startOptions.onLoaded() );
                    }
                }
                break;

            case 'openReponseContentInApp':
                await this.openReponseContentInApp(msg.data);
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
                        <div class="input-group" id="vschc-input-url-group">
                            <input type="url" class="form-control" id="vschc-input-url" placeholder="https://example.com/resource/123">

                            <div class="input-group-append" title="Edit URL Parameters">
                                <div class="input-group-text">
                                    <i class="fa fa-pencil" aria-hidden="true"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-sm-2" id="vschc-input-method-col">
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
            <div class="card-header bg-info" id="vschc-headers-card-heading">
                <span title="Click Here To (Un)Collapse" class="align-middle text-white" data-toggle="collapse" data-target="#vschc-headers-card-body" aria-expanded="true" aria-controls="vschc-headers-card-body">
                    Custom Headers
                </span>

                <a class="btn btn-danger btn-sm float-right" id="vschc-reset-all-headers-btn" title="Remove All Headers">
                    <i class="fa fa-eraser" aria-hidden="true"></i>
                </a>

                <a class="btn btn-secondary btn-sm float-right" id="vschc-import-headers-btn" title="Import Header List">
                    <i class="fa fa-arrow-circle-o-down text-dark" aria-hidden="true"></i>
                </a>

                <a class="btn btn-dark btn-sm float-right" id="vschc-add-header-btn" title="Add New Header">
                    <i class="fa fa-plus-circle" aria-hidden="true"></i>
                </a>
            </div>

            <div id="vschc-headers-card-body" class="collapse show" aria-labelledby="vschc-headers-card-heading" data-parent="#vschc-headers-card-accordion">
                <div class="card-body"></div>
            </div>

            <div class="card-footer">
                <a title="Insert 'Content-MD5' Header" class="btn btn-sm btn-dark float-right align-middle" id="vschc-insert-md5-header-btn">
                    MD5
                </a>

                <a title="Insert 'Content-Length' Header" class="btn btn-sm btn-dark float-right align-middle" id="vschc-insert-length-header-btn">
                    LEN
                </a>
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
            getFooter: () => {
                return `

<div class="modal" tabindex="-1" role="dialog" id="vschc-edit-url-parameters-modal">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title">Edit URL Parameters</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true" class="text-white">&times;</span>
        </button>
      </div>

      <div class="modal-body"></div>

      <div class="modal-footer">
        <a type="button" class="btn btn-warning vschc-undo-btn">
          <i class="fa fa-undo" aria-hidden="true"></i>
          <span>Undo</span>
        </a>

        <a type="button" class="btn btn-success vschc-update-btn">
            <i class="fa fa-floppy-o" aria-hidden="true"></i>
            <span>Update</span>
        </a>
      </div>
    </div>
  </div>
</div>

<div class="modal" tabindex="-1" role="dialog" id="vschc-import-headers-modal">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title">Import Header List</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true" class="text-white">&times;</span>
        </button>
      </div>

      <div class="modal-body">
        <form>
          <textarea class="form-control" rows="5" placeholder="Enter one header and its value per line, like: 'X-Header: Header value'"></textarea>
        </form>
      </div>

      <div class="modal-footer">
        <a type="button" class="btn btn-success vschc-import-btn">
            <i class="fa fa-floppy-o" aria-hidden="true"></i>
            <span>Import</span>
        </a>
      </div>
    </div>
  </div>
</div>

`;
            },
            getHeaderButtons: () => {
                return `
<a class="btn btn-primary btn-sm" id="vschc-import-request-btn" title="Load Request Settings From File">
    <i class="fa fa-book" aria-hidden="true"></i>
</a>

<a class="btn btn-secondary btn-sm" id="vschc-export-request-btn" title="Save Request Settings To File">
    <i class="fa fa-floppy-o text-dark" aria-hidden="true"></i>
</a>

<a class="btn btn-secondary btn-sm" id="vschc-import-http-file-btn" title="Import HTTP File">
    <i class="fa fa-file-text text-dark" aria-hidden="true"></i>
</a>

<a class="btn btn-primary btn-sm" id="vschc-clone-request-btn" title="Clone The Settings Of That Request">
    <i class="fa fa-clone" aria-hidden="true"></i>
</a>
`;
            },
            getResourceUri: (path: string) => {
                return this.getResourceUri(path);
            },
            name: 'http-request',
        });
    }

    private async openReponseContentInApp(data: OpenContentData) {
        let extension = data.suggestedExtension;
        if (false === extension) {
            extension = '';
        }
        extension = vscode_helpers.normalizeString(extension);
        if ('' === extension) {
            extension = 'txt';
        }

        await vscode_helpers.tempFile(async (tempFile) => {
            let tryDeleteTempFile = true;

            try {
                await vschc.confirm(async (yes) => {
                    if (!yes) {
                        return;
                    }

                    const DATA = new Buffer(data.data, 'base64');

                    await FSExtra.writeFile(tempFile, DATA);

                    await vschc.exec(tempFile);

                    tryDeleteTempFile = false;
                }, `The content will be opened / executed as '${ tempFile }'. Are you sure to do that?`);
            } finally {
                if (tryDeleteTempFile) {
                    try {
                        if (await vscode_helpers.isFile( tempFile )) {
                            await FSExtra.unlink( tempFile );
                        }
                    } catch { }
                }
            }
        }, {
            keep: true,
            prefix: 'vschc-',
            suffix: '.' + extension,
        });
    }

    private async openReponseInEditor(response: SendRequestResponse) {
        await vscode_helpers.openAndShowTextDocument({
            content: this.createHTTPFromResponse(response).toString('ascii'),
            language: 'http',
        });
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

        await vscode_helpers.openAndShowTextDocument({
            content: data.toString('ascii'),
            language: 'http',
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
                        client.setupFromActiveWorkspace();

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

            const GET_IF_TEXT = async (d: Buffer | string) => {
                try {
                    if (!_.isNil(d)) {
                        if (!Buffer.isBuffer(d)) {
                            d = new Buffer(d, 'base64');
                        }

                        if (d.length > 0) {
                            return !(await vscode_helpers.isBinaryContent(d));
                        }
                    }

                    return true;
                } catch { }

                return false;
            };

            let url = `${ result.url.protocol }//`;
            {
                if (!_.isNil(result.url.auth)) {
                    url += vscode_helpers.toStringSafe( result.url.auth ) + '@';
                }

                url += vscode_helpers.toStringSafe( result.url.host );
                url += vscode_helpers.toStringSafe( result.url.path );
            }

            const REQUEST_BODY = await result.readRequestBody();

            r = {
                body: (BODY && BODY.length > 0) ? BODY.toString('base64') : null,
                bodyIsText: await GET_IF_TEXT(BODY),
                code: RESP.statusCode,
                headers: {},
                httpVersion: RESP.httpVersion,
                request: {
                    body: REQUEST_BODY,
                    bodyIsText: await GET_IF_TEXT(REQUEST_BODY),
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
 * Creates a request data object from a HTTP file.
 *
 * @param {string} file The path to the file.
 *
 * @return {RequestData|false} The new object or (false) if failed.
 */
export async function fromHTTPFile(file: string) {
    file = vscode_helpers.toStringSafe(file);

    let data: RequestData | false = false;

    const CRLF = vscode_helpers.toEOL( vscode.EndOfLine.CRLF );

    const HTTP = await FSExtra.readFile(file, 'ascii');
    const HTTP_LINES = vscode_helpers.from( HTTP.split(CRLF) ).skipWhile(x => {
        return vscode_helpers.isEmptyString(x);
    }).toArray();

    if (HTTP_LINES.length > 0) {
        let body: Buffer;
        let headers: any = {};
        let method: string;
        let mime: string | false = '';
        let url = '';

        const FIRST_LINE = HTTP_LINES[0].trim();

        const METHOD_URL_SEP = FIRST_LINE.indexOf(' ');
        if (METHOD_URL_SEP > -1) {
            method = FIRST_LINE.substr(0, METHOD_URL_SEP).trim();

            const URL_VERSION_SEP = FIRST_LINE.lastIndexOf(' ');
            if (URL_VERSION_SEP > -1) {
                // 012345678901234 [15]
                // abcdef bcd jaka
                // POST https://example.com/api/comments/1 HTTP/1.1

                // 34 = 48

                url = FIRST_LINE.substr(METHOD_URL_SEP + 1,
                                        URL_VERSION_SEP - METHOD_URL_SEP - 1);
            } else {
                url = FIRST_LINE.substr(METHOD_URL_SEP + 1);
            }
        } else {
            method = FIRST_LINE;
        }

        method = method.toUpperCase().trim();
        if ('' === method) {
            method = 'GET';
        }

        url = vscode_helpers.toStringSafe(url).trim();

        const HEADER_LINES = vscode_helpers.from( HTTP_LINES ).skip(1).select(l => {
            return l.trim();
        }).takeWhile(l => '' !== l).forEach(l => {
            let name: string;
            let value: string;

            const NAME_VALUE_SEP = l.indexOf(':');
            if (NAME_VALUE_SEP > -1) {
                name = l.substr(0, NAME_VALUE_SEP);
                value = l.substr(NAME_VALUE_SEP + 1);
            } else {
                name = l;
            }

            name = vscode_helpers.toStringSafe(name).trim();
            if ('' !== name) {
                headers[ name ] = vscode_helpers.toStringSafe(value).trim();
            }
        });

        for (const H in headers) {
            const NAME = vscode_helpers.normalizeString(H);
            const VALUE = headers[H];

            switch (NAME) {
                case 'content-type':
                    mime = vscode_helpers.from(VALUE).takeWhile(c => {
                        return ';' !== c;
                    }).joinToString('');
                    break;
            }
        }

        mime = vscode_helpers.normalizeString( mime );
        if ('' === mime) {
            mime = false;
        }

        body = new Buffer(
            vscode_helpers.from( HTTP_LINES ).skipWhile(l => {
                return !vscode_helpers.isEmptyString(l);
            }).skip(1).joinToString(CRLF),
            'ascii'
        );

        let requestBody: RequestDataBody = {
            content: false,
            file: false,
            fileSize: false,
            mime: mime,
        };
        if (Buffer.isBuffer( body )) {
            let fileSuffix: string | false = false;
            if (false !== mime) {
                fileSuffix = MimeTypes.extension( mime );
            }

            await vscode_helpers.tempFile(async (bodyFile) => {
                await FSExtra.writeFile(bodyFile, body);

                requestBody.content = await FSExtra.readFile(bodyFile, 'base64');
                requestBody.file = bodyFile;
                requestBody.fileSize = await vscode_helpers.size(bodyFile);
            }, {
                suffix: false === fileSuffix ? ''
                                             : ('.' + fileSuffix),
            });
        }

        data = {
            body: requestBody,
            headers: headers,
            method: method,
            title: false,
            url: url,
        };
    }

    return data;
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
