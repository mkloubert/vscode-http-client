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
import * as vschc from './extension';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';


/**
 * Options for 'generateFooter()' function.
 */
export interface GenerateFooterOptions extends ResourceUriResolver {
    /**
     * The function that generates additional footer content.
     */
    getFooter?: GetFooterFunction;
    /**
     * The path to the script.
     */
    scriptFile: string;
    /**
     * The path to the CSS file.
     */
    styleFile: string;
}

/**
 * Options for 'generateHeader()' function.
 */
export interface GenerateHeaderOptions extends ResourceUriResolver {
}

/**
 * Options for 'generateHtmlDocument()' function.
 */
export interface GenerateHtmlDocumentOptions extends HeaderButtonResolver, ResourceUriResolver {
    /**
     * The function that generates the (body) content.
     *
     * @return {string} The content.
     */
    getContent?: () => string;
    /**
     * The function that generates additional footer content.
     */
    getFooter?: GetFooterFunction;
    /**
     * The (internal) name of the document.
     */
    name: string;
}

/**
 * Options for 'generateNavBarHeader()' function.
 */
export interface GenerateNavBarHeaderOptions extends HeaderButtonResolver, ResourceUriResolver {
}

/**
 * Function to generate (additional) footer content.
 *
 * @return {string} The generated HTML code.
 */
export type GetFooterFunction = () => string;

/**
 * Function to generate header buttons.
 *
 * @return {string} The generated HTML code.
 */
export type GetHeaderButtonsFunction = () => string;

/**
 * The function that returns the URI of a resource.
 *
 * @param {string} path The path inside the resource directory.
 *
 * @return {vscode.Uri} The URI.
 */
export type GetResourceUriFunction = (path: string) => vscode.Uri;

/**
 * An object that can resolve the HTML code for header buttons.
 */
export interface HeaderButtonResolver {
    /**
     * Custom function to generate header buttons.
     */
    getHeaderButtons?: GetHeaderButtonsFunction;
}

/**
 * An object that resolves a resource URI.
 */
export interface ResourceUriResolver {
    /**
     * The function that returns the URI of a web view resource.
     */
    getResourceUri: GetResourceUriFunction;
}


/**
 * Returns the (possible) URI of the 'custom.css' file for the views.
 *
 * @return {vscode.Uri} The URI of (a) 'custom.css' file.
 */
export function getCustomCSSUri() {
    return vscode.Uri.file(
        Path.resolve(
            Path.join(vschc.getUsersExtensionDir(), 'custom.css')
        )
    );
}

/**
 * Generates the common content for footer.
 *
 * @param {GenerateFooterOptions} opts Options.
 *
 * @return {string} The generated HTML code.
 */
export function generateFooter(opts: GenerateFooterOptions) {
    let customStyle: vscode.Uri | false = false;
    try {
        const CUSTOM_CSS_FILE = getCustomCSSUri().fsPath;

        if (vscode_helpers.isFileSync( CUSTOM_CSS_FILE )) {
            customStyle = vscode.Uri.file( CUSTOM_CSS_FILE ).with({
                scheme: 'vscode-resource'
            });
        }
    } catch { }

    return `
    <div id="vschc-body-bottom" class="clearfix"></div>

    <div class="fixed-bottom" id="vschc-buttons-on-bottom">
        <a class="btn btn-sm btn-secondary float-right" id="vschc-to-bottom-btn" title="Scoll To Bottom">
            <i class="fa fa-arrow-down text-dark" aria-hidden="true"></i>
        </a>

        <a class="btn btn-sm btn-secondary float-right" id="vschc-to-top-btn" title="Scoll To Top">
            <i class="fa fa-arrow-up text-dark" aria-hidden="true"></i>
        </a>
    </div>

    <link rel="stylesheet" href="${ opts.getResourceUri('css/style.css') }">
    <link rel="stylesheet" href="${ opts.getResourceUri('css/' + opts.styleFile + '.css') }" vschc-style="custom">

${ !customStyle ? '' : `<link rel="stylesheet" href="${ customStyle }">` }

    <script src="${ opts.getResourceUri('js/script.js') }"></script>
    <script src="${ opts.getResourceUri('js/' + opts.scriptFile + '.js') }"></script>

${ opts.getFooter ? opts.getFooter() : '' }

  </body>
</html>`;
}

/**
 * Generates the common content for 'head' tag.
 *
 * @param {GenerateHeaderOptions} opts Options.
 *
 * @return {string} The generated HTML code.
 */
export function generateHeader(opts: GenerateHeaderOptions) {
    const STYLE = vschc.getCurrentStyleUri(
        opts.getResourceUri
    );

    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">

        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

        <link rel="stylesheet" href="${ opts.getResourceUri('css/font-awesome.css') }">
        <link rel="stylesheet" href="${ opts.getResourceUri('css/hljs-atom-one-dark.css') }">
        <link rel="stylesheet" href="${ STYLE }" vschc-style="bootstrap">

        <link rel="stylesheet" href="${ opts.getResourceUri('css/select2.min.css') }">
        <link rel="stylesheet" href="${ opts.getResourceUri('css/select2-bootstrap4.min.css') }">

        <script src="${ opts.getResourceUri('js/moment-with-locales.min.js') }"></script>
        <script src="${ opts.getResourceUri('js/highlight.pack.js') }"></script>
        <script src="${ opts.getResourceUri('js/showdown.min.js') }"></script>
        <script src="${ opts.getResourceUri('js/jquery.min.js') }"></script>
        <script src="${ opts.getResourceUri('js/bootstrap.bundle.min.js') }"></script>

        <script src="${ opts.getResourceUri('js/select2.full.min.js') }"></script>

        <script>
            const vscode = acquireVsCodeApi();

            function vschc_log(msg) {
                try {
                    if (msg instanceof Error) {
                        msg = \`ERROR: \${ msg.message }

    \${ msg.stack }\`;
                    }

                    vscode.postMessage({
                        command: 'log',
                        data: {
                            message: JSON.stringify(msg)
                        }
                    });
                } catch (e) { }
            }

            window.onerror = function() {
                vschc_log(
                    JSON.stringify(arguments)
                );

                return false;
            };

            const AJAX_LOADER_URL = ${ JSON.stringify( '' + opts.getResourceUri('img/ajax-loader.gif') ) };
        </script>

        <title>HTTP Client</title>
    </head>
    <body>
        <div id="vschc-body-top" class="clearfix"></div>
`;
}

/**
 * Generates a full HTML document.
 *
 * @param {GenerateHtmlDocumentOptions} opts Options.
 *
 * @return {string} The generated HTML code.
 */
export function generateHtmlDocument(opts: GenerateHtmlDocumentOptions) {
    return `${ generateHeader({
    getResourceUri: opts.getResourceUri,
}) }

${ generateNavBarHeader({
    getHeaderButtons: opts.getHeaderButtons,
    getResourceUri: opts.getResourceUri,
}) }

${ opts.getContent ? opts.getContent() : '' }

${ generateFooter({
    getFooter: opts.getFooter,
    getResourceUri: opts.getResourceUri,
    scriptFile: opts.name,
    styleFile: opts.name,
}) }`;
}

/**
 * Generates the common HTML for a header navbar.
 *
 * @param {GenerateNavBarHeaderOptions} opts Options.
 *
 * @return {string} The generated HTML code.
 */
export function generateNavBarHeader(opts: GenerateNavBarHeaderOptions) {
    return `
<header>
    <nav class="navbar navbar-dark fixed-top bg-dark">
        <a class="navbar-brand" href="#">
            <img src="${ opts.getResourceUri('img/icon.svg') }" width="30" height="30" class="d-inline-block align-top" alt="">
            <span>HTTP Client</span>
        </a>

        <form class="form-inline">
            ${ opts.getHeaderButtons ? opts.getHeaderButtons() : '' }

            <div id="vschc-social-media-btns">
                <a class="btn btn-dark btn-sm vschc-btn-with-known-url" vschc-url="github" title="Open Project On GitHub">
                    <i class="fa fa-github" aria-hidden="true"></i>
                </a>

                <a class="btn btn-dark btn-sm vschc-btn-with-known-url" vschc-url="twitter" title="Follow Author On Twitter">
                    <i class="fa fa-twitter" aria-hidden="true"></i>
                </a>

                <a class="btn btn-dark btn-sm vschc-btn-with-known-url" vschc-url="paypal" title="Support Project via PayPal">
                    <i class="fa fa-paypal" aria-hidden="true"></i>
                </a>
            </div>
        </form>
    </nav>
</header>
`;
}
