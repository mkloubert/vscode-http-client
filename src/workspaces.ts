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
import * as vschc from './extension';
import * as vschc_requests from './requests';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';


/**
 * Configuration data for the extension.
 */
export interface Config extends vscode.WorkspaceConfiguration {
    /**
     * One or more requests to open from files on startup.
     */
    readonly open?: OpenValue | OpenValue[];
    /**
     * Opens a new request on startup or not.
     */
    readonly openNewOnStartup?: boolean;
}

/**
 * An 'open' entry.
 */
export interface OpenEntry {
    /**
     * The path to the file to open.
     */
    readonly file: string;
}

/**
 * A value for an 'open' entry.
 */
export type OpenValue = string | OpenEntry;


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

    public getExistingPath(p: string) {
        p = vscode_helpers.toStringSafe(p);

        if (!Path.isAbsolute(p)) {
            const VSCODE_DIR = Path.join(this.rootPath, '.vscode');
            const EXT_DIR = vschc.getUsersExtensionDir();

            for (const DIR of [VSCODE_DIR, EXT_DIR]) {
                const PATH_TO_CHECK = Path.join( DIR, p );
                if (FSExtra.existsSync(PATH_TO_CHECK)) {
                    p = PATH_TO_CHECK;
                    break;
                }
            }
        }

        return FSExtra.existsSync(p) ? Path.resolve(p)
                                     : false;
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
        } finally {
            ME._isReloadingConfig = false;
        }
    }

    /**
     * Opens all requests that should be opened on startup.
     */
    public async openRequestsOnStartup() {
        const CFG = this.config;
        if (!CFG) {
            return;
        }

        if (vscode_helpers.toBooleanSafe(CFG.openNewOnStartup)) {
            await vschc_requests.startNewRequest();
        }

        if (vscode_helpers.toBooleanSafe(CFG.open)) {
            const OPEN = vscode_helpers.asArray( CFG.open );
            for (const O of OPEN) {
                let entry: OpenEntry;
                if (!_.isObject(O)) {
                    entry = {
                        file: vscode_helpers.toStringSafe(O),
                    };
                } else {
                    entry = <any>O;
                }

                if (vscode_helpers.isEmptyString(entry.file)) {
                    continue;
                }

                const IMPORT_FILE = this.getExistingPath(entry.file);
                if (false !== IMPORT_FILE) {
                    const DATA = await FSExtra.readFile(IMPORT_FILE, 'utf8');
                    const REQUEST: vschc_requests.RequestData = JSON.parse( DATA );

                    await vschc_requests.startNewRequest({
                        data: REQUEST,
                    });
                }
            }
        }
    }
}
