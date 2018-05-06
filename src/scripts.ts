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

 /**
  * Options for 'executeScript()' function.
  */
export interface ExecuteScriptOptions {
    /**
     * The cancellation token.
     */
    cancelToken: any;
    /**
     * The code to execute.
     */
    code: string;
    /**
     * A function that returns the resource for a webview.
     */
    getResourceUri: (path: string) => any;
    /**
     * The request handler.
     */
    handler: any;
    /**
     * An 'onDidSend' event listener.
     */
    onDidSend: Function;
    /**
     * The output channel.
     */
    output: any;
    /**
     * The progress context.
     */
    progress: any;
    /**
     * The request data.
     */
    request: any;
    /**
     * A list of one or more possible resource roots for a web view.
     */
    webResourceRoots: string | string[];
}

interface OpenMarkdownOptions {
    css?: string;
    title?: string;
}

/**
 * Executes a script.
 *
 * @param {ExecuteScriptOptions} _e0bcc1df_3f0b_4a19_9e42_238d7fe990c5 The (obfuscated) options.
 *
 * @return {Promise<any>} The promise with the result.
 */
export async function executeScript(_e0bcc1df_3f0b_4a19_9e42_238d7fe990c5: ExecuteScriptOptions) {
    const $moment = require('moment');
    require('moment-timezone');

    const _ = require('lodash');
    const $fs = require('fs-extra');
    const $h = require('vscode-helpers');
    const $html = require('html-entities');
    const $md = require('marked');
    const $linq = require('node-enumerable');
    const $vs = require('vscode');

    // create HTML parser
    const _bf05825d085f4b6aa8956078285e8be4 = (version: string) => {
        version = $h.normalizeString( version );

        let parserFactory: Function | false = false;

        switch (version) {
            case '':
            case 'all':
                parserFactory = () => new $html.AllHtmlEntities();
                break;

            case '4':
            case 'v4':
            case 'html4':
                parserFactory = () => new $html.Html4Entities();
                break;

            case '5':
            case 'v5':
            case 'html5':
                parserFactory = () => new $html.Html5Entities();
                break;

            case 'x':
            case 'xml':
                parserFactory = () => new $html.XmlEntities();
                break;
        }

        if (false === parserFactory) {
            throw new Error(`Version '${ version }' is not supported!`);
        }

        return parserFactory();
    };

    // localResourceRoots
    const _744faeb77ac041098dc7b7a2728d7372 = () => {
        return $h.asArray( _e0bcc1df_3f0b_4a19_9e42_238d7fe990c5.webResourceRoots )
                 .map(x => $h.toStringSafe( x ))
                 .filter(x => !$h.isEmptyString( x ))
                 .map(x => $vs.Uri.file( x ));
    };

    const alert = async (msg: any, ...args: any[]) => {
        msg = $h.toStringSafe(msg);
        args = $h.asArray(args, false)
                 .map(x => $h.toStringSafe(x));

        return $vs.window.showWarningMessage
                         .apply(null, [ msg ].concat(args));
    };
    const cancel = _e0bcc1df_3f0b_4a19_9e42_238d7fe990c5.cancelToken;
    const decode_html = (str: string, version?: string) => {
        return _bf05825d085f4b6aa8956078285e8be4(version).decode(
            $h.toStringSafe( str )
        );
    };
    const encode_html = (str: string, version?: string) => {
        return _bf05825d085f4b6aa8956078285e8be4(version).encode(
            $h.toStringSafe( str )
        );
    };
    const from = $h.from;
    const guid = (ver?: string, ...args: any[]): string => {
        const UUID = require('uuid');

        ver = $h.normalizeString(ver);

        let func: Function | false = false;
        switch (ver) {
            case '1':
            case 'v1':
                func = UUID.v1;
                break;

            case '':
            case '4':
            case 'v4':
                func = UUID.v4;
                break;

            case '5':
            case 'v5':
                func = UUID.v5;
                break;
        }

        if (false === func) {
            throw new Error(`Version '${ ver }' is not supported!`);
        }

        return func.apply(null, args);
    };
    const open_html = (htmlCode: string, title?: string) => {
        htmlCode = $h.toStringSafe(htmlCode);

        title = $h.toStringSafe(title).trim();
        if ('' === title) {
            title = 'HTTP Client Script';
        }

        const NEW_PANEL = $vs.window.createWebviewPanel(
            'vscodeHTTPClientScriptHtml',
            title,
            $vs.ViewColumn.Three,
            {
                enableCommandUris: true,
                enableFindWidget: true,
                enableScripts: true,
                localResourceRoots: _744faeb77ac041098dc7b7a2728d7372(),
                retainContextWhenHidden: true,
            }
        );

        NEW_PANEL.webview.html = htmlCode;

        return NEW_PANEL;
    };
    const open_markdown = (markdown: string, titleOrOptions?: string | OpenMarkdownOptions) => {
        if (!_.isObject(titleOrOptions)) {
            titleOrOptions = {
                title: $h.toStringSafe(titleOrOptions),
            };
        }

        let title = $h.toStringSafe( (<OpenMarkdownOptions>titleOrOptions).title );
        if ('' === title) {
            title = 'HTTP Client Script';
        }

        const CSS = $h.toStringSafe( (<OpenMarkdownOptions>titleOrOptions).css );

        markdown = $h.toStringSafe(markdown);

        const HTML_CODE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">

    <link rel="stylesheet" href="${ _e0bcc1df_3f0b_4a19_9e42_238d7fe990c5.getResourceUri('css/hljs-atom-one-dark.css') }">

    <script src="${ _e0bcc1df_3f0b_4a19_9e42_238d7fe990c5.getResourceUri('js/highlight.pack.js') }"></script>
    <script src="${ _e0bcc1df_3f0b_4a19_9e42_238d7fe990c5.getResourceUri('js/jquery.min.js') }"></script>
  </head>
  <body>

${ $md(markdown, {
    breaks: true,
    gfm: true,
    mangle: true,
    silent: true,
    tables: true,
    sanitize: true,
}) }

<style type="text/css">

${ CSS }

</style>

<script>

jQuery(() => {
  jQuery(document).ready(function() {
    jQuery('body pre code').each(function(i, block) {
      hljs.highlightBlock(block);
    });
  });
});

</script>

  </body>
</html>`;

        const NEW_PANEL = $vs.window.createWebviewPanel(
            'vscodeHTTPClientScriptMarkdown',
            title,
            $vs.ViewColumn.Three,
            {
                enableCommandUris: false,
                enableFindWidget: false,
                enableScripts: true,
                localResourceRoots: _744faeb77ac041098dc7b7a2728d7372(),
                retainContextWhenHidden: true,
            }
        );

        NEW_PANEL.webview.html = HTML_CODE;

        return NEW_PANEL;
    };
    const new_request = () => {
        const REQ = new (require('./http').HTTPClient)(
            _e0bcc1df_3f0b_4a19_9e42_238d7fe990c5.handler,
            _e0bcc1df_3f0b_4a19_9e42_238d7fe990c5.request,
            _e0bcc1df_3f0b_4a19_9e42_238d7fe990c5.cancelToken,
        );

        REQ.onDidSend(async function() {
            const THIS_ARGS = _e0bcc1df_3f0b_4a19_9e42_238d7fe990c5;
            const ON_DID_SEND = THIS_ARGS.onDidSend;

            return Promise.resolve(
                ON_DID_SEND.apply(THIS_ARGS, arguments)
            );
        });

        return REQ;
    };
    const now = (timeZone?: string) => {
        const N = $moment();

        timeZone = $h.toStringSafe(timeZone).trim();

        return '' === timeZone ? N
                               : N.tz(timeZone);
    };
    const output = _e0bcc1df_3f0b_4a19_9e42_238d7fe990c5.output;
    const progress = _e0bcc1df_3f0b_4a19_9e42_238d7fe990c5.progress;
    const sleep = async (secs?: number) => {
        let ms = Math.floor( parseFloat($h.toStringSafe(secs).trim()) * 1000.0 );
        if (isNaN(ms)) {
            ms = undefined;
        }

        await $h.sleep(ms);
    };
    const uuid = guid;
    const utc = () => {
        return $moment.utc();
    };

    return await Promise.resolve(
        eval(`(async () => {

${ $h.toStringSafe(_e0bcc1df_3f0b_4a19_9e42_238d7fe990c5.code) }

});`)()
    );
}
