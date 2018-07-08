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
import * as Path from 'path';
import * as SanitizeFilename from 'sanitize-filename';
import * as vschc from './extension';
import * as vschc_html from './html';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';


interface RequestConstantResult {
    content: false | string;
}

interface RequestFunctionResult {
    content: false | string;
}

interface ScriptsTOC {
    constants: string[];
    functions: string[];
    'getting-started': string | false;
    modules: string | false;
}

interface WebViewMessage extends vschc.WebViewMessage {
}


/**
 * Shows a help tab for scripting.
 *
 * @return {Promise<vscode.WebviewPanel>} The promise with the new WebView panel.
 */
export async function showScriptHelp() {
    const RESOURCE_URIS = vschc.getWebViewResourceUris();

    const GET_RES_URI = (p: string): vscode.Uri => {
        p = vscode_helpers.toStringSafe(p);

        let u: vscode.Uri;

        for (const R of RESOURCE_URIS) {
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
    };

    const HTML = vschc_html.generateHtmlDocument({
        getContent: () => {
            return `<main role="main" class="container-fluid">
  <div class="card">
    <div class="card-header text-white bg-info">Script Help</div>

    <div class="card-body">
      <div class="row">
        <div class="col col-3">
          <div class="nav flex-column nav-pills" id="vschc-tab" role="tablist" aria-orientation="vertical">
            <a class="nav-link active" id="vschc-getting-started-tab" data-toggle="pill" href="#vschc-getting-started" role="tab" aria-controls="vschc-getting-started" aria-selected="false">
                Getting Started
            </a>

            <a class="nav-link" id="vschc-constants-tab" data-toggle="pill" href="#vschc-constants" role="tab" aria-controls="vschc-constants" aria-selected="false">
                Constants
            </a>

            <a class="nav-link" id="vschc-functions-tab" data-toggle="pill" href="#vschc-functions" role="tab" aria-controls="vschc-functions" aria-selected="true">
                Functions
            </a>

            <a class="nav-link" id="vschc-modules-tab" data-toggle="pill" href="#vschc-modules" role="tab" aria-controls="vschc-modules" aria-selected="true">
                Modules
            </a>
          </div>
        </div>

        <div class="col col-9">
          <div class="tab-content" id="vschc-tabcontent">
            <div class="tab-pane show active" id="vschc-getting-started" role="tabpanel" aria-labelledby="vschc-getting-started-tab"></div>

            <div class="tab-pane show" id="vschc-constants" role="tabpanel" aria-labelledby="vschc-constants-tab">
                <form>
                  <div class="form-group">
                    <select class="form-control" id="vschc-constants-select">
                        <option value="">----- Select a constant -----</option>
                    </select>
                  </div>
                </form>

                <div class="vschc-content"></div>
            </div>

            <div class="tab-pane" id="vschc-functions" role="tabpanel" aria-labelledby="vschc-functions-tab">
                <form>
                  <div class="form-group">
                    <select class="form-control" id="vschc-functions-select">
                        <option value="">----- Select a function -----</option>
                    </select>
                  </div>
                </form>

                <div class="vschc-content"></div>
            </div>

            <div class="tab-pane" id="vschc-modules" role="tabpanel" aria-labelledby="vschc-modules-tab"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>`;
        },
        getResourceUri: GET_RES_URI,
        name: 'help',
    });

    const PANEL = vscode.window.createWebviewPanel(
        'vscodeHTTPClientHelp', 'HTTP Client Help', vscode.ViewColumn.Two, {
            enableCommandUris: true,
            enableFindWidget: true,
            enableScripts: true,
            localResourceRoots: RESOURCE_URIS,
            retainContextWhenHidden: true,
        }
    );

    PANEL.webview.html = HTML;

    const POST = async (cmd: string, data?: any) => {
        return await PANEL.webview.postMessage({
            command: vscode_helpers.toStringSafe(cmd),
            data: data,
        });
    };

    const HANDLE_MSG = async (msg: WebViewMessage) => {
        switch (msg.command) {
            case 'onLoaded':
                {
                    const TOC: ScriptsTOC = {
                        constants: [],
                        functions: [],
                        'getting-started': false,
                        modules: false,
                    };

                    const HELP_DIR = Path.join(__dirname, 'res/help');
                    if (await vscode_helpers.isDirectory(HELP_DIR)) {
                        const MD_FILES = await vscode_helpers.glob('/*.md', {
                            absolute: true,
                            cwd: HELP_DIR,
                            dot: false,
                            nocase: false,
                            nodir: true,
                            nosort: false,
                            root: HELP_DIR,
                        });

                        for (const MD of MD_FILES) {
                            const FILE_NAME = Path.basename( MD );
                            if (FILE_NAME.startsWith('constant_')) {
                                TOC.constants.push(
                                    FILE_NAME.substr(
                                        9, FILE_NAME.length - 9 - 3
                                    )
                                );
                            } else if (FILE_NAME.startsWith('func_')) {
                                TOC.functions.push(
                                    FILE_NAME.substr(
                                        5, FILE_NAME.length - 5 - 3
                                    )
                                );
                            } else {
                                let loader: ((data: string) => PromiseLike<void>) | false = false;

                                switch (FILE_NAME) {
                                    case 'getting_started_scripts.md':
                                        loader = async (data) => {
                                            TOC['getting-started'] = data;
                                        };
                                        break;

                                    case 'modules.md':
                                        loader = async (data) => {
                                            TOC.modules = data;
                                        };
                                        break;
                                }

                                if (false !== loader) {
                                    try {
                                        await loader(
                                            await FSExtra.readFile(MD, 'utf8')
                                        );
                                    } catch { }
                                }
                            }
                        }
                    }

                    await POST('updateTOC', TOC);
                }
                break;

            case 'requestConstant':
                {
                    const RESULT: RequestConstantResult = {
                        content: false,
                    };

                    const FILE_NAME = SanitizeFilename(
                        `constant_${ vscode_helpers.normalizeString(msg.data) }.md`
                    );
                    if ('' !== FILE_NAME) {
                        const FILE_URI = GET_RES_URI(`help/${FILE_NAME}`);
                        if (await vscode_helpers.isFile(FILE_URI.fsPath)) {
                            RESULT.content = await FSExtra.readFile(FILE_URI.fsPath, 'utf8');
                        }
                    }

                    await POST('requestConstantCompleted',
                               RESULT);
                }
                break;

            case 'requestFunction':
                {
                    const RESULT: RequestFunctionResult = {
                        content: false,
                    };

                    const FILE_NAME = SanitizeFilename(
                        `func_${ vscode_helpers.normalizeString(msg.data) }.md`
                    );
                    if ('' !== FILE_NAME) {
                        const FILE_URI = GET_RES_URI(`help/${FILE_NAME}`);
                        if (await vscode_helpers.isFile(FILE_URI.fsPath)) {
                            RESULT.content = await FSExtra.readFile(FILE_URI.fsPath, 'utf8');
                        }
                    }

                    await POST('requestFunctionCompleted',
                               RESULT);
                }
                break;
        }
    };

    PANEL.webview.onDidReceiveMessage((msg) => {
        try {
            if (vschc.handleDefaultWebViewMessage(msg)) {
                return;
            }

            Promise.resolve( HANDLE_MSG(msg) ).then(() => {
            }, (err) => {
                vschc.showError(err);
            });
        } catch (e) {
            vschc.showError(e);
        }
    });

    return PANEL;
}
