'use strict';

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
import * as HTTP from 'http';
import * as HTTPs from 'https';
import * as MimeTypes from 'mime-types';
const NormalizeHeaderCase = require("header-case-normalizer");
import * as Path from 'path';
import * as URL from 'url';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';

interface SaveContentData {
    data: string;
    suggestedExtension: string | false;
}

interface SendRequestData {
    body: {
        content: string | false;
    };
    headers: any;
    method: string;
    url: string;
}

interface SendRequestResponse {
    body: string;
    code: number;
    headers: any;
    httpVersion: string;
    suggestedExtension: string | false;
    status: string;
}

interface StartOptions {
    body?: string;
    showOptions?: vscode.ViewColumn;
}

interface WebViewMessage {
    command: string;
    data?: any;
}

let extension: vscode.ExtensionContext;

class HTTPRequest extends vscode_helpers.DisposableBase {
    private _html: string;
    private _panel: vscode.WebviewPanel;
    private _resourceRoot: string;

    private getResourceUri(p: string): vscode.Uri {
        return vscode.Uri.file(
            Path.join(this._resourceRoot, p)
        ).with({
            scheme: 'vscode-resource'
        });
    }

    public async initialize() {
        this._resourceRoot = Path.join(__dirname, './resources');

        this._html = '';

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
                    message: msg
                }
            });
        }

        const AJAX_LOADER_URL = ${ JSON.stringify( '' + this.getResourceUri('img/ajax-loader.gif') ) };
    </script>

    <title>HTTP Client</title>
  </head>
  <body>
    <header>
        <nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
            <a class="navbar-brand" href="https://github.com/mkloubert/vscode-http-client" target="_blank">
                <img src="${ this.getResourceUri('img/icon.svg') }" width="30" height="30" class="d-inline-block align-top" alt="">
                <span>HTTP Client</span>
            </a>
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

    private loadBodyContent() {
        const ME = this;

        const COMPLETED = (
            err: any,
            data?: string, path?: string, size?: number,
        ) => {
            if (err) {
                ME.showError(err);
            } else {
                ME.postMessage('setBodyContentFromFile', {
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
                        }
                        catch (e) {
                            COMPLETED(e);
                        }
                    });
                }
                catch (e) {
                    COMPLETED(e);
                }
            }, (err) => {
                COMPLETED(err);
            });
        }
        catch (e) {
            COMPLETED(e);
        }
    }

    protected onDispose() {
        vscode_helpers.tryDispose(this._panel);
    }

    public get panel(): vscode.WebviewPanel {
        return this._panel;
    }

    private postMessage(command: string, data?: any) {
        const MSG: WebViewMessage = {
            command: command,
            data: data,
        };

        this.view.postMessage(MSG);
    }

    private saveContent(data: SaveContentData) {
        const ME = this;

        const COMPLETED = (err: any) => {
            if (err) {
                ME.showError(err);
            }
        };

        const OPTS: vscode.SaveDialogOptions = {
            saveLabel: 'Save response',
        };

        if (data.suggestedExtension) {
            OPTS.filters = {
                'HTTP Response': [ data.suggestedExtension ]
            };
        }

        try {
            vscode.window.showSaveDialog(OPTS).then((file) => {
                if (!file) {
                    return;
                }

                try {
                    FS.writeFile(file.fsPath, new Buffer(data.data, 'base64'), (err) => {
                        COMPLETED(err);
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

    private saveRawResponse(response: SendRequestResponse) {
        const ME = this;

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

        try {
            vscode.window.showSaveDialog({
                filters: {
                    'HTTP file': [ 'http' ]
                },
                saveLabel: 'Save raw response',
            }).then((file) => {
                if (!file) {
                    return;
                }

                try {
                    FS.writeFile(file.fsPath, dataToSave, (err) => {
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

    private sendRequest(request: SendRequestData) {
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

            ME.postMessage('sendRequestCompleted', {
                error: vscode_helpers.toStringSafe(err),
                response: r,
            });
        };

        try {
            const REQUEST_URL = URL.parse( request.url );

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
                case '':
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
                    body = new Buffer( vscode_helpers.toStringSafe(request.body.content).trim(), 'base64' );
                }
            }

            if (body && body.length > 0) {
                REQ.write( body );
            }

            REQ.end();
        } catch (e) {
            COMPLETED(e).then(() => {                
            }, (err) => {
                ME.showError(err);
            });
        }
    }

    private showError(err: any) {
        if (err) {
            vscode.window.showErrorMessage(
                `[ERROR] ${ vscode_helpers.toStringSafe(err) }`
            );
        }
    }

    public async start(opts: StartOptions) {
        const ME = this;

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
                switch (msg.command) {
                    case 'loadBodyContent':
                        ME.loadBodyContent();
                        break;

                    case 'log':
                        console.log( msg.data.message );
                        break;

                    case 'onLoaded':
                        {
                            if (!_.isNil(opts.body)) {
                                this.postMessage('setBodyContent', {
                                    data: opts.body
                                });
                            }
                        }
                        break;

                    case 'saveContent':
                        ME.saveContent(msg.data);
                        break;

                    case 'saveRawResponse':
                        ME.saveRawResponse(msg.data);
                        break;

                    case 'sendRequest':
                        ME.sendRequest(msg.data);
                        break;

                    case 'unsetBodyFromFile':
                        ME.unsetBodyFromFile();
                        break;
                }
            });

            newPanel.webview.html = ME._html;

            this._panel = newPanel;
        } catch (e) {
            vscode_helpers.tryDispose(newPanel);

            throw e;
        }
    }

    private unsetBodyFromFile() {
        const ME = this;

        vscode.window.showWarningMessage('Do really want to unset the current body?', {
            title: 'No',
            isCloseAffordance: true,
            value: 0,
        }, {
            title: 'Yes',
            value: 1,
        }).then((selectedItem) => {
            try {
                if (selectedItem) {
                    if (1 === selectedItem.value) {
                        ME.postMessage('setBodyContentFromFile', null);
                    }
                }
            } catch (e) {
                ME.showError(e);
            }
        }, (err) => {
            ME.showError(err);
        });
    }

    public get view(): vscode.Webview {
        return this.panel.webview;
    }
}


async function startNewRequest(opts?: StartOptions) {
    if (!opts) {
        opts = {};
    }

    let request: HTTPRequest;
    try {
        request = new HTTPRequest();

        await request.initialize();

        await request.start(opts);
    } catch (e) {
        vscode_helpers.tryDispose(request);
    }
}

export async function activate(context: vscode.ExtensionContext) {
    extension = context;

    extension.subscriptions.push(
        vscode.commands.registerCommand('extension.http.client.newRequest', async () => {
            await startNewRequest();
        }),

        vscode.commands.registerCommand('extension.http.client.newRequestForActiveEditor', async () => {
            const EDITOR = vscode.window.activeTextEditor;
            if (EDITOR && EDITOR.document) {
                await startNewRequest({
                    body: EDITOR.document.getText(),
                    showOptions: vscode.ViewColumn.Two,
                });
            } else {
                vscode.window.showWarningMessage(
                    'No active editor found!'
                );
            }
        }),
    );
}

export async function deactivate() {
}
