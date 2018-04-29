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

import * as Path from 'path';
import * as vschc_requests from './requests';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';


/**
 * Configuration data for the extension.
 */
export interface Config extends vscode.WorkspaceConfiguration {
    /**
     * Opens a new request on startup or not.
     */
    readonly openOnStartup?: boolean;
}


/**
 * A workspace (handler).
 */
export class Workspace extends vscode_helpers.WorkspaceBase {
    private _config: Config;
    private _configSrc: vscode_helpers.WorkspaceConfigSource;
    private _isReloadingConfig = false;

    /**
     * Gets the current configuration.
     */
    public get config() {
        return this._config;
    }

    /**
     * @inheritdoc
     */
    public get configSource() {
        return this._configSrc;
    }

    /**
     * Initializes that workspace object.
     */
    public async initialize() {
        this._configSrc = {
            section: 'http.client',
            resource: vscode.Uri.file( Path.join(this.rootPath,
                                                 '.vscode/settings.json') ),
        };

        await this.onDidChangeConfiguration();
    }

    /**
     * @inheritdoc
     */
    public async onDidChangeConfiguration() {
        const ME = this;

        const MY_ARGS = arguments;

        if (ME._isReloadingConfig) {
            vscode_helpers.invokeAfter(async () => {
                await ME.onDidChangeConfiguration
                        .apply(ME, MY_ARGS);
            }, 1000);

            return;
        }

        ME._isReloadingConfig = true;
        try {
            let loadedCfg: Config = vscode.workspace.getConfiguration(ME.configSource.section,
                                                                      ME.configSource.resource) || <any>{};

            ME._config = loadedCfg;

            if (vscode_helpers.toBooleanSafe(loadedCfg.openOnStartup)) {
                await vschc_requests.startNewRequest();
            }
        } finally {
            ME._isReloadingConfig = false;
        }
    }
}
