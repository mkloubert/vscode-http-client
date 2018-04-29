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

import * as vschc_requests from './requests';
import * as vschc_workspaces from './workspaces';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';

let extension: vscode.ExtensionContext;
let isDeactivating = false;
let workspaceWatcher: vscode_helpers.WorkspaceWatcherContext<vschc_workspaces.Workspace>;

export async function activate(context: vscode.ExtensionContext) {
    extension = context;

    const WF = vscode_helpers.buildWorkflow();

    // commands
    WF.next(() => {
        extension.subscriptions.push(
            vscode.commands.registerCommand('extension.http.client.newRequest', async () => {
                await vschc_requests.startNewRequest();
            }),

            vscode.commands.registerCommand('extension.http.client.newRequestForActiveEditor', async () => {
                const EDITOR = vscode.window.activeTextEditor;
                if (EDITOR && EDITOR.document) {
                    await vschc_requests.startNewRequest({
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

    if (!isDeactivating) {
        await WF.start();
    }
}

export async function deactivate() {
    if (isDeactivating) {
        return;
    }
    
    isDeactivating = true;
}
