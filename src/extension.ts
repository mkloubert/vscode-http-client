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
import * as FSExtra from 'fs-extra';
const MergeDeep = require('merge-deep');
import * as MimeTypes from 'mime-types';
import * as Path from 'path';
import * as OS from 'os';
import * as vschc_requests from './requests';
import * as vschc_workspaces from './workspaces';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';


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


let extension: vscode.ExtensionContext;
let isDeactivating = false;
let workspaceWatcher: vscode_helpers.WorkspaceWatcherContext<vschc_workspaces.Workspace>;


export function activate(context: vscode.ExtensionContext) {
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

    // commands
    WF.next(() => {
        extension.subscriptions.push(
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
                try {
                    let text: string | false = false;
                    let headers: any;
                    let editorFile: string | false = false;

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
                        }

                        await vschc_requests.startNewRequest({
                            body: vscode_helpers.toStringSafe( text ),
                            headers: headers,
                            showOptions: vscode.ViewColumn.Two,
                        });
                    }
                } catch (e) {
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
        );
    });

    // workspace(s)
    WF.next(async () => {
        extension.subscriptions.push(
            workspaceWatcher = vscode_helpers.registerWorkspaceWatcher(context, async (event, folder, workspace?) => {
                if (event === vscode_helpers.WorkspaceWatcherEvent.Added) {
                    const NEW_WORKSPACE = new vschc_workspaces.Workspace( folder );

                    await NEW_WORKSPACE.initialize();

                    return NEW_WORKSPACE;
                }
            })
        );

        await workspaceWatcher.reload();
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

    if (!isDeactivating) {
        WF.start().then(() => {}, (err) => {
            showError(err);
        });
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

export function deactivate() {
    if (isDeactivating) {
        return;
    }
    isDeactivating = true;
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
        openLabel: 'Open',
    };

    try {
        const EXT_DIR = getUsersExtensionDir();
        if (await vscode_helpers.isDirectory(EXT_DIR)) {
            DEFAULT_OPTS.defaultUri = vscode.Uri.file(EXT_DIR);
        }
    } catch { }

    const OPTS: OpenDialogOptions = MergeDeep(DEFAULT_OPTS, options);

    const FILES = await vscode.window.showOpenDialog(OPTS);
    if (FILES && FILES.length > 0) {
        return Promise.resolve(
            action(FILES)
        );
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
        saveLabel: 'Save',
    };

    try {
        const EXT_DIR = getUsersExtensionDir();
        if (await vscode_helpers.isDirectory(EXT_DIR)) {
            DEFAULT_OPTS.defaultUri = vscode.Uri.file(EXT_DIR);
        }
    } catch { }

    const OPTS: SaveDialogOptions = MergeDeep(DEFAULT_OPTS, options);

    const FILE = await vscode.window.showSaveDialog(OPTS);
    if (FILE) {
        return Promise.resolve(
            action(FILE)
        );
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
