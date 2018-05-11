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
import * as ChildProcess from 'child_process';
import * as FSExtra from 'fs-extra';
import * as Marked from 'marked';
const MergeDeep = require('merge-deep');
import * as MimeTypes from 'mime-types';
import * as Moment from 'moment';
import * as Path from 'path';
import * as OS from 'os';
import * as vschc_help from './help';
import * as vschc_html from './html';
import * as vschc_requests from './requests';
import * as vschc_workspaces from './workspaces';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';


/**
 * A result of a 'exec()' function call.
 */
export interface ExecResult {
    /**
     * The standard error content.
     */
    stdErr: string;
    /**
     * The standard output.
     */
    stdOut: string;
}

/**
 * Describes the structure of the package file of that extenstion.
 */
export interface PackageFile {
    /**
     * The display name.
     */
    readonly displayName: string;
    /**
     * The (internal) name.
     */
    readonly name: string;
    /**
     * The version string.
     */
    readonly version: string;
}

/**
 * Extenstion of 'vscode.OpenDialogOptions' interface.
 */
export interface OpenDialogOptions extends vscode.OpenDialogOptions {
}

/**
 * Extenstion of 'vscode.SaveDialogOptions' interface.
 */
export interface SaveDialogOptions extends vscode.SaveDialogOptions {
}

/**
 * A message from and for a WebView.
 */
export interface WebViewMessage {
    /**
     * The command.
     */
    command: string;
    /**
     * The data.
     */
    data?: any;
}


let activeWorkspace: vschc_workspaces.Workspace;
/**
 * The name of the event, when style changed.
 */
export const EVENT_STYLE_CHANGED = 'webview.style.changed';
let extension: vscode.ExtensionContext;
/**
 * Indicates that something is unset.
 */
export const IS_UNSET = Symbol('IS_UNSET');
const KEY_CURRENT_STYLE = 'vschcCurrentStyle';
const KEY_LAST_KNOWN_VERSION = 'vschcLastKnownVersion';
let isDeactivating = false;
const KEY_LAST_KNOWN_DEFAULT_URI = 'vschcLastKnownDefaultUri';
let outputChannel: vscode.OutputChannel;
let packageFile: PackageFile;
let workspaceWatcher: vscode_helpers.WorkspaceWatcherContext<vschc_workspaces.Workspace>;



export async function activate(context: vscode.ExtensionContext) {
    extension = context;

    const WF = vscode_helpers.buildWorkflow();

    // user's extension directory
    WF.next(async () => {
        try {
            const EXT_DIR = getUsersExtensionDir();
            if (!(await vscode_helpers.isDirectory(EXT_DIR))) {
                await FSExtra.mkdirs(EXT_DIR);
            }
        } catch (e) {
            showError(e);
        }
    });

    // output channel
    WF.next(() => {
        context.subscriptions.push(
            outputChannel = vscode.window.createOutputChannel('HTTP Client')
        );

        outputChannel.hide();
    });

    // package file
    WF.next(async () => {
        try {
            const CUR_DIR = __dirname;
            const FILE_PATH = Path.join(CUR_DIR, '../package.json');

            packageFile = JSON.parse(
                await FSExtra.readFile(FILE_PATH, 'utf8')
            );
        } catch { }
    });

    // extension information
    WF.next(() => {
        const NOW = Moment();

        if (packageFile) {
            outputChannel.appendLine(`${packageFile.displayName} (${packageFile.name}) - v${packageFile.version}`);
        }

        outputChannel.appendLine(`Copyright (c) ${NOW.format('YYYY')}-${NOW.format('YYYY')}  Marcel Joachim Kloubert <marcel.kloubert@gmx.net>`);
        outputChannel.appendLine('');
        outputChannel.appendLine(`GitHub : https://github.com/mkloubert/vscode-http-client`);
        outputChannel.appendLine(`Twitter: https://twitter.com/mjkloubert`);
        outputChannel.appendLine(`Donate : https://paypal.me/MarcelKloubert`);

        outputChannel.appendLine('');
    });

    // commands
    WF.next(() => {
        extension.subscriptions.push(
            // newRequest
            vscode.commands.registerCommand('extension.http.client.changeStyle', async () => {
                try {
                    interface StyleFile {
                        file: string;
                        name: string;
                        value?: any;
                    }

                    const CURRENT_FILE = getCurrentStyle();

                    const STYLE_FILES: StyleFile[] = [{
                        file: vscode.Uri.file(Path.resolve(
                            Path.join(__dirname, 'res/css/bootstrap.min.css')
                        )).fsPath,
                        name: '(default)',
                    }];

                    const BOOTSWATCH_DIR = Path.join(__dirname, 'res/css/bootswatch');

                    const FILES = vscode_helpers.from((await vscode_helpers.glob('/*.min.css', {
                        absolute: true,
                        cwd: BOOTSWATCH_DIR,
                        dot: false,
                        nocase: true,
                        nodir: true,
                        nonull: false,
                        nosort: true,
                        root: BOOTSWATCH_DIR,
                    }))).select(f => {
                        let name = Path.basename(f, '.min.css');
                        name = (name[0].toUpperCase() + name.substr(1).toLowerCase()).trim();

                        return <StyleFile>{
                            file: vscode.Uri.file( Path.resolve(f) ).fsPath,
                            name: name,
                            value: 'bootswatch/' + Path.basename(f),
                        };
                    }).orderBy(sf => {
                        return vscode_helpers.normalizeString( sf.name );
                    }).thenBy(sf => {
                        return vscode_helpers.normalizeString( sf.name );
                    }).pushTo( STYLE_FILES );

                    const QUICK_PICKS: vscode.QuickPickItem[] = STYLE_FILES.map((sf, index) => {
                        let isCurrent: boolean;
                        if (false !== CURRENT_FILE) {
                            isCurrent = vscode.Uri.file( Path.resolve(CURRENT_FILE) ).fsPath ===
                                        vscode.Uri.file( Path.resolve(sf.file) ).fsPath;
                        } else {
                            isCurrent = 0 === index;
                        }

                        return {
                            action: async () => {
                                await extension.globalState.update(
                                    KEY_CURRENT_STYLE,
                                    sf.value,
                                );

                                vscode_helpers.EVENTS.emit(
                                    EVENT_STYLE_CHANGED,
                                    vscode.Uri.file(sf.file).with({
                                        scheme: 'vscode-resource'
                                    })
                                );
                            },
                            description: isCurrent ? '(current)' : '',
                            detail: sf.file,
                            label: sf.name,
                        };
                    });

                    const SELECTED_ITEM = await vscode.window.showQuickPick(QUICK_PICKS, {
                        placeHolder: 'Select the style the HTTP request forms ...',
                    });

                    if (SELECTED_ITEM) {
                        await SELECTED_ITEM['action']();
                    }
                } catch (e) {
                    showError(e);
                }
            }),

            // newRequest
            vscode.commands.registerCommand('extension.http.client.newRequest', async () => {
                try {
                    await vschc_requests.startNewRequest();
                } catch (e) {
                    showError(e);
                }
            }),

            // newRequestForEditor
            vscode.commands.registerCommand('extension.http.client.newRequestForEditor', async function(file?: vscode.Uri) {
                let newRequest: vschc_requests.IHTTPRequest;
                try {
                    const DISPOSABLES: vscode.Disposable[] = [];
                    let editorFile: string | false = false;
                    let headers: any;
                    let fileWatcher: vscode.FileSystemWatcher | false;
                    let hideBodyFromFileButton: boolean;
                    let text: string | false = false;

                    if (arguments.length > 0) {
                        text = await FSExtra.readFile(file.fsPath, 'binary');
                        editorFile = file.fsPath;
                    } else {
                        const EDITOR = vscode.window.activeTextEditor;
                        if (EDITOR && EDITOR.document) {
                            text = EDITOR.document.getText();
                            editorFile = EDITOR.document.fileName;
                        }
                    }

                    if (false === text) {
                        vscode.window.showWarningMessage(
                            'No editor (content) found!'
                        );
                    } else {
                        if (false !== editorFile && !vscode_helpers.isEmptyString(editorFile)) {
                            try {
                                const CONTENT_TYPE = MimeTypes.lookup(editorFile);
                                if (false !== CONTENT_TYPE) {
                                    headers = {
                                        'Content-Type': CONTENT_TYPE,
                                    };
                                }
                            } catch { }

                            try {
                                if (await vscode_helpers.isFile(editorFile)) {
                                    let newEditorFileWatcher: vscode.FileSystemWatcher;
                                    try {
                                        newEditorFileWatcher = vscode.workspace.createFileSystemWatcher(
                                            editorFile,
                                            false, false, false,
                                        );

                                        const INVOKE_FOR_FILE = (action: Function) => {
                                            const REQUEST = newRequest;
                                            if (!REQUEST) {
                                                return;
                                            }

                                            try {
                                                Promise.resolve(action()).then(() => {}, (err) => {
                                                    showError(err);
                                                });
                                            } catch (e) {
                                                showError(e);
                                            }
                                        };

                                        let isSettingBodyContent = false;
                                        const SET_BODY_CONTENT = async function(content: string) {
                                            const ARGS = arguments;

                                            if (isSettingBodyContent) {
                                                setTimeout(() => {
                                                    SET_BODY_CONTENT.apply(null, ARGS);
                                                }, 1000);

                                                return;
                                            }

                                            isSettingBodyContent = true;
                                            try {
                                                const REQUEST = newRequest;
                                                if (REQUEST) {
                                                    await REQUEST.postMessage('setBodyContent', {
                                                        data: vscode_helpers.toStringSafe(content),
                                                    });
                                                }
                                            } finally {
                                                isSettingBodyContent = false;
                                            }
                                        };

                                        newEditorFileWatcher.onDidChange((e) => {
                                            INVOKE_FOR_FILE(async () => {
                                                if (await vscode_helpers.isFile(e.fsPath)) {
                                                    await SET_BODY_CONTENT(
                                                        await FSExtra.readFile(e.fsPath, 'binary')
                                                    );
                                                }
                                            });
                                        });
                                        newEditorFileWatcher.onDidCreate((e) => {
                                            INVOKE_FOR_FILE(async () => {
                                                if (await vscode_helpers.isFile(e.fsPath)) {
                                                    await SET_BODY_CONTENT(
                                                        await FSExtra.readFile(e.fsPath, 'binary')
                                                    );
                                                }
                                            });
                                        });

                                        fileWatcher = newEditorFileWatcher;
                                    } catch (e) {
                                        vscode_helpers.tryDispose( newEditorFileWatcher );

                                        throw e;
                                    }
                                }
                            } catch {}
                        }

                        if (false !== fileWatcher) {
                            DISPOSABLES.push( fileWatcher );

                            hideBodyFromFileButton = true;
                        }

                        newRequest = await vschc_requests.startNewRequest({
                            body: vscode_helpers.toStringSafe( text ),
                            disposables: DISPOSABLES,
                            headers: headers,
                            hideBodyFromFileButton: hideBodyFromFileButton,
                            isBodyContentReadOnly: false !== fileWatcher,
                            showOptions: vscode.ViewColumn.Two,
                        });

                        newRequest.onDidChangeVisibility(async (isVisible) => {
                            try {
                                if (isVisible) {
                                    if (false !== editorFile && !vscode_helpers.isEmptyString(editorFile)) {
                                        if (await vscode_helpers.isFile(editorFile)) {
                                            await newRequest.postMessage('setBodyContent', {
                                                data: await FSExtra.readFile(editorFile, 'ascii'),
                                            });
                                        }
                                    }
                                }
                            } catch (e) {
                                showError(e);
                            }
                        });
                    }
                } catch (e) {
                    vscode_helpers.tryDispose(newRequest);

                    showError(e);
                }
            }),

            // newRequestFromFile
            vscode.commands.registerCommand('extension.http.client.newRequestFromFile', async () => {
                try {
                    await openFiles(async (files) => {
                        await vschc_requests.startNewRequest({
                            file: files[0],
                        });
                    }, {
                        openLabel: 'Start request',
                    });
                } catch (e) {
                    showError(e);
                }
            }),

            // newRequestScript
            vscode.commands.registerCommand('extension.http.client.newRequestScript', async () => {
                try {
                    let code = `
// The following modules are supported:
//
// $fs      =>   https://github.com/jprichardson/node-fs-extra
// $h       =>   https://github.com/mkloubert/vscode-helpers
// $moment  =>   https://github.com/moment/moment
// $uuid    =>   https://github.com/kelektiv/node-uuid
// $vs      =>   https://code.visualstudio.com/docs/extensionAPI/vscode-api

const CURRENT_TIME = now();
const CURRENT_UTC_TIME = utc();

const SESSION_ID = $uuid.v4();
const USERS = [ 1, 2, 3 ];

for (let i = 0; i < USERS.length; i++) {
    if (cancel.isCancellationRequested) {
        break;  // user wants to cancel
    }

    const USER_ID = USERS[i];

    // update progress
    progress.report({
        message: \`Execute request for user \${ i + 1 } (ID \${ USER_ID }) of \${ USERS.length }\`,
        increment: 1.0 / USERS.length * 100.0
    });

    // create new request
    // s. https://mkloubert.github.io/vscode-http-client/classes/_http_.httpclient.html
    const REQUEST = new_request();

    // set custom query / URL parameter(s)
    REQUEST.param('user', USER_ID)
           .param('foo', 'bar');

    // set custom header(s)
    REQUEST.header('X-MyApp-Session', SESSION_ID)
           .header('X-MyApp-Time', CURRENT_UTC_TIME.format('YYYY-MM-DD HH:mm:ss'));

    // set custom body from a file, e.g.
    REQUEST.body(
        await $fs.readFile(\`/path/to/user/data/user_\${ USER_ID }.json\`)
    );

    // build and the send request
    //
    // httpResult.response  =>  the object with the response data
    let httpResult;
    try {
        httpResult = await REQUEST.send();
    } catch (e) {
        // send error
    }

    // wait about 1.5 seconds
    await sleep( 1.5 );
}
`;

                    await vscode_helpers.openAndShowTextDocument({
                        content: code,
                        language: 'javascript',
                    });

                    await vschc_requests.startNewRequest({
                        showOptions: vscode.ViewColumn.Two,
                    });
                } catch (e) {
                    showError(e);
                }
            }),

            // newRequestSplitView
            vscode.commands.registerCommand('extension.http.client.newRequestSplitView', async () => {
                try {
                    await vschc_requests.startNewRequest({
                        showOptions: vscode.ViewColumn.Two,
                    });
                } catch (e) {
                    showError(e);
                }
            }),

            // openCustomCSS
            vscode.commands.registerCommand('extension.http.client.openCustomCSS', async () => {
                try {
                    const CUSTOM_CSS_FILE = vschc_html.getCustomCSSUri();

                    if (!(await vscode_helpers.exists(CUSTOM_CSS_FILE.fsPath))) {
                        let newCSS = `/**
 * This is a new CSS file for HTML forms, generated by 'HTTP Client' Visual Studio Code extension (vscode-http-client).
 *
 * The changes will be applied after the file has been saved and a new tab is opened.
 **/

`;

                        await FSExtra.writeFile(CUSTOM_CSS_FILE.fsPath,
                                                new Buffer(newCSS, 'utf8'));
                    }

                    await vscode_helpers.openAndShowTextDocument(
                        CUSTOM_CSS_FILE.fsPath
                    );
                } catch (e) {
                    showError(e);
                }
            }),

            // showHelp
            vscode.commands.registerCommand('extension.http.client.showHelp', async () => {
                try {
                    await vschc_help.showScriptHelp();
                } catch (e) {
                    showError(e);
                }
            }),
        );
    });

    // workspace(s)
    WF.next(async () => {
        extension.subscriptions.push(
            workspaceWatcher = vscode_helpers.registerWorkspaceWatcher(context, async (event, folder, workspace?) => {
                try {
                    switch (event) {
                        case vscode_helpers.WorkspaceWatcherEvent.Added:
                            const NEW_WORKSPACE = new vschc_workspaces.Workspace( folder );
                            {
                                await NEW_WORKSPACE.initialize();
                            }
                            return NEW_WORKSPACE;
                    }
                } finally {
                    await updateActiveWorkspace();
                }
            })
        );

        (<any>vschc_workspaces).getAllWorkspaces = () => {
            return vscode_helpers.from( vscode_helpers.asArray(workspaceWatcher.workspaces) ).orderBy(ws => {
                return ws.folder.index;
            }).thenBy(ws => {
                return vscode_helpers.normalizeString(ws.folder.name);
            }).thenBy(ws => {
                return vscode_helpers.normalizeString(ws.folder.uri.fsPath);
            }).toArray();
        };

        (<any>vschc_workspaces).getActiveWorkspace = () => {
            const AWS = activeWorkspace;
            if (AWS && !AWS.isInFinalizeState) {
                return AWS;
            }

            return false;
        };

        await workspaceWatcher.reload();

        await updateActiveWorkspace();
    });

    // openRequestsOnStartup
    WF.next(async () => {
        try {
            for (const WF of workspaceWatcher.workspaces) {
                try {
                    if (!WF.isInFinalizeState) {
                        try {
                            await WF.openRequestsOnStartup();
                        } finally {
                            WF.executeOpenRequestsOnStartup = true;
                        }
                    }
                } catch (e) {
                    showError(e);
                }
            }
        } catch (e) {
            showError(e);
        }
    });

    // events
    WF.next(() => {
        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(() => {
                updateActiveWorkspace().then(() => {}, (err) => {
                });
            }),
        );
    });

    // restore saved requests
    WF.next(async () => {
        try {
            await vschc_requests.restoreSavedRequests();
        } catch {  }
    });

    // show CHANGELOG
    WF.next(async () => {
        let versionToUpdate: string | false = false;

        try {
            if (packageFile) {
                const VERSION = vscode_helpers.normalizeString( packageFile.version );
                if ('' !== VERSION) {
                    const LAST_VERSION = vscode_helpers.normalizeString(
                        extension.globalState.get(KEY_LAST_KNOWN_VERSION, '')
                    );
                    if (LAST_VERSION !== VERSION) {
                        const CHANGELOG_FILE = Path.resolve(
                            Path.join(__dirname, '../CHANGELOG.md')
                        );

                        if (await vscode_helpers.isFile(CHANGELOG_FILE)) {
                            const MARKDOWN = await FSExtra.readFile(CHANGELOG_FILE, 'utf8');

                            let changeLogView: vscode.WebviewPanel;
                            try {
                                changeLogView = vscode.window.createWebviewPanel(
                                    'vscodeHTTPClientScriptChangelog',
                                    'HTTP Client ChangeLog',
                                    vscode.ViewColumn.One,
                                    {
                                        enableCommandUris: false,
                                        enableFindWidget: false,
                                        enableScripts: false,
                                        retainContextWhenHidden: true,
                                    }
                                );

                                changeLogView.webview.html = Marked(MARKDOWN, {
                                    breaks: true,
                                    gfm: true,
                                    mangle: true,
                                    silent: true,
                                    tables: true,
                                    sanitize: true,
                                });
                            } catch (e) {
                                vscode_helpers.tryDispose( changeLogView );

                                throw e;
                            }
                        }

                        versionToUpdate = VERSION;
                    }
                }
            }
        } catch {
        } finally {
            try {
                if (false !== versionToUpdate) {
                    await extension.globalState.update(KEY_LAST_KNOWN_VERSION,
                                                       versionToUpdate);
                }
            } catch { }
        }
    });

    if (!isDeactivating) {
        await WF.start();
    }
}

/**
 * Shows a confirm window.
 *
 * @param {Function} action The action to invoke.
 * @param {string} prompt The promt text.
 *
 * @return {Promise<TResult>} The promise with the result of the action.
 */
export async function confirm<TResult = any>(
    action: (yes: boolean) => TResult | PromiseLike<TResult>,
    prompt: string
): Promise<TResult> {
    const SELECTED_ITEM = await vscode.window.showWarningMessage(prompt, {
        title: 'No',
        isCloseAffordance: true,
        value: 0,
    }, {
        title: 'Yes',
        value: 1,
    });

    if (SELECTED_ITEM) {
        return await Promise.resolve(
            action(1 === SELECTED_ITEM.value)
        );
    }
}

export async function deactivate() {
    if (isDeactivating) {
        return;
    }
    isDeactivating = true;

    // save open requests
    try {
        await vschc_requests.saveOpenRequests();
    } catch {  }
}

/**
 * Executes a file / command.
 *
 * @param {string} command The command to execute.
 *
 * @return {Promise<ExecResult>} The promise with the result.
 */
export function exec(command: string): Promise<ExecResult> {
    command = vscode_helpers.toStringSafe(command);

    return new Promise<ExecResult>((resolve, reject) => {
        const COMPLETED = vscode_helpers.createCompletedAction(resolve, reject);

        try {
            ChildProcess.exec(command, (err, stdout, stderr) => {
                COMPLETED(err, {
                    stdErr: stderr,
                    stdOut: stdout,
                });
            });
        } catch (e) {
            COMPLETED(e);
        }
    });
}

/**
 * Returns the current extension context.
 */
export function getContext(): vscode.ExtensionContext {
    return extension;
}

/**
 * Returns the path of the current, existing style (CSS) file.
 *
 * @return {string|false} The file path or (false) if not found.
 */
export function getCurrentStyle(): string | false {
    let value = vscode_helpers.toStringSafe(
        extension.globalState.get(KEY_CURRENT_STYLE, '')
    );
    if (!vscode_helpers.isEmptyString(value)) {
        value = Path.resolve(
            Path.join(__dirname + '/res/css', value)
        );

        if (vscode_helpers.isFileSync(value)) {
            return Path.resolve( value );
        }
    }

    return false;
}

/**
 * Returns the URI for the current style file.
 *
 * @param {Function} getResourceUri The function to use to resolve the default URI.
 *
 * @return {vscode.Uri} The resource URI of the current style.
 */
export function getCurrentStyleUri(getResourceUri: (path: string) => vscode.Uri) {
    let uri: vscode.Uri;

    let style = getCurrentStyle();
    if (false === style) {
        uri = getResourceUri('css/bootstrap.min.css');
    } else {
        uri = vscode.Uri.file( style ).with({
            scheme: 'vscode-resource'
        });
    }

    return uri;
}

async function getDefaultUriForDialogs() {
    let uri: vscode.Uri;

    const CHECKERS: (() => Promise<void>)[] = [
        // first check last known
        async () => {
            const LAST_KNOWN = vscode_helpers.toStringSafe( extension.workspaceState.get(KEY_LAST_KNOWN_DEFAULT_URI, '') );
            if (!vscode_helpers.isEmptyString(LAST_KNOWN)) {
                if (await vscode_helpers.isDirectory(LAST_KNOWN)) {
                    uri = vscode.Uri.file(LAST_KNOWN);
                }
            }
        },

        // then check active workspace
        async () => {
            const ACTIVE_WORKSPACE = vschc_workspaces.getActiveWorkspace();
            if (ACTIVE_WORKSPACE) {
                const DIRS = [
                    // .vscode sub folder
                    Path.join(ACTIVE_WORKSPACE.folder.uri.fsPath, '.vscode'),
                    // workspace folder
                    ACTIVE_WORKSPACE.folder.uri.fsPath,
                ];

                for (const D of DIRS) {
                    try {
                        if (uri) {
                            break;
                        }

                        if (await vscode_helpers.isDirectory(D)) {
                            uri = vscode.Uri.file(D);
                        }
                    } catch { }
                }
            }
        },

        // last, but not least => try home directory
        async () => {
            const EXT_DIR = getUsersExtensionDir();
            if (await vscode_helpers.isDirectory(EXT_DIR)) {
                uri = vscode.Uri.file(EXT_DIR);
            }
        },
    ];

    for (const CHK of CHECKERS) {
        if (uri) {
            break;
        }

        try {
            await CHK();
        } catch { }
    }

    return uri;
}

/**
 * Returns the current output channel.
 *
 * @return {vscode.OutputChannel} The output channel.
 */
export function getOutputChannel() {
    return outputChannel;
}

/**
 * Returns the extension's path inside the user's home directory.
 *
 * @return string The path to the (possible) directory.
 */
export function getUsersExtensionDir() {
    return Path.resolve(
        Path.join(
            OS.homedir(), '.vscode-http-client'
        )
    );
}

/**
 * Returns all possible resource URIs for web views.
 *
 * @return {vscode.Uri[]} The list of URIs.
 */
export function getWebViewResourceUris(): vscode.Uri[] {
    const URIs: vscode.Uri[] = [];

    try {
        URIs.push(
            vscode.Uri.file( getUsersExtensionDir() )
        );
    } catch { }

    try {
        URIs.push(
            vscode.Uri.file(Path.resolve(
                Path.join(__dirname, './res')
            ))
        );
    } catch { }

    return URIs;
}

/**
 * Invokes an action for an 'oprn files' dialog.
 *
 * @param {Function} action The action to invoke.
 * @param {OpenDialogOptions} [options] Custom options.
 *
 * @return {Promise<TResult>} The promise with the result of the action.
 */
export async function openFiles<TResult = any>(
    action: (files: vscode.Uri[]) => TResult | PromiseLike<TResult>,
    options?: OpenDialogOptions
): Promise<TResult> {
    const DEFAULT_OPTS: OpenDialogOptions = {
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        defaultUri: await getDefaultUriForDialogs(),
        openLabel: 'Open',
    };

    const OPTS: OpenDialogOptions = MergeDeep(DEFAULT_OPTS, options);

    const FILES = await vscode.window.showOpenDialog(OPTS);
    if (FILES && FILES.length > 0) {
        const FIRST_FILE = FILES[0];
        let lastKnownUri = OPTS.defaultUri;

        try {
            return await Promise.resolve(
                action(FILES)
            );
        } finally {
            try {
                if (vscode_helpers.from(FILES).all(f => f.fsPath === FIRST_FILE.fsPath)) {
                    lastKnownUri = vscode.Uri.file(
                        Path.dirname(FIRST_FILE.fsPath)
                    );
                }
            } catch { }

            await updateLastKnownDefaultUriForDialogs(lastKnownUri);
        }
    }
}

/**
 * Invokes an action for an 'oprn files' dialog.
 *
 * @param {Function} action The action to invoke.
 * @param {SaveDialogOptions} [options] Custom options.
 *
 * @return {Promise<TResult>} The promise with the result of the action.
 */
export async function saveFile<TResult = any>(
    action: (file: vscode.Uri) => TResult | PromiseLike<TResult>,
    options?: SaveDialogOptions
): Promise<TResult> {
    const DEFAULT_OPTS: SaveDialogOptions = {
        defaultUri: await getDefaultUriForDialogs(),
        saveLabel: 'Save',
    };

    const OPTS: SaveDialogOptions = MergeDeep(DEFAULT_OPTS, options);

    const FILE = await vscode.window.showSaveDialog(OPTS);
    if (FILE) {
        let lastKnownUri = OPTS.defaultUri;

        try {
            return await Promise.resolve(
                action(FILE)
            );
        } finally {
            try {
                lastKnownUri = vscode.Uri.file(
                    Path.dirname(FILE.fsPath)
                );
            } catch { }

            await updateLastKnownDefaultUriForDialogs(lastKnownUri);
        }
    }
}

/**
 * Shows an error.
 *
 * @param {any} err The error to show.
 */
export async function showError(err: any) {
    if (!_.isNil(err)) {
        return await vscode.window.showErrorMessage(
            `[ERROR] '${ vscode_helpers.toStringSafe(err) }'`
        );
    }
}

async function updateActiveWorkspace() {
    let aws: vschc_workspaces.Workspace;

    try {
        const ALL_WORKSPACES = vschc_workspaces.getAllWorkspaces();
        if (ALL_WORKSPACES.length > 0) {
            if (1 === ALL_WORKSPACES.length) {
                aws = ALL_WORKSPACES[0];
            } else {
                aws = activeWorkspace;

                const ACTIVE_EDITOR = vscode.window.activeTextEditor;
                if (ACTIVE_EDITOR) {
                    const DOC = ACTIVE_EDITOR.document;
                    if (DOC) {
                        const FILE = DOC.fileName;
                        if (!vscode_helpers.isEmptyString(FILE)) {
                            const LAST_MATCHING_WORKSPACE = vscode_helpers.from(ALL_WORKSPACES)
                                                                          .firstOrDefault(ws => ws.isPathOf(FILE), false);
                            if (LAST_MATCHING_WORKSPACE) {
                                aws = LAST_MATCHING_WORKSPACE;
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {
        aws = null;
    }

    activeWorkspace = aws;
}

async function updateLastKnownDefaultUriForDialogs(uri: vscode.Uri) {
    try {
        if (uri) {
            try {
                await extension.workspaceState.update(KEY_LAST_KNOWN_DEFAULT_URI,
                                                      uri.fsPath);
            } catch { }
        }
    } catch { }
}
