
let vschc_do_not_show_body_from_file_btn = false;
let vschc_next_response_id = -1;

function vschc_add_header_row(name, value) {
    const CARD = jQuery('#vschc-headers-card');
    const CARD_BODY = CARD.find('.card-body');

    const TABLE = CARD_BODY.find('table');
    if (TABLE.length < 1) {
        return;
    }

    const TABLE_BODY = TABLE.find('tbody');

    const NEW_ROW = jQuery('<tr class="vschc-header-row">' + 
                           '<td class="vschc-name" />' + 
                           '<td class="vschc-value" />' + 
                           '<td class="vschc-actions" />' + 
                           '</tr>');

    const NAME_FIELD = jQuery('<input type="text" class="form-control" />');
    const VALUE_FIELD = jQuery('<input type="text" class="form-control" />');

    NAME_FIELD.on('keyup', function(e) {
        if (13 != e.which) {
            return;
        }
        
        e.preventDefault();

        let controlToFocus = false;

        if (!vschc_is_empty_str( NAME_FIELD.val() )) {
            if (vschc_is_empty_str( VALUE_FIELD.val() )) {
                controlToFocus = VALUE_FIELD;
            }
        }

        if (controlToFocus) {
            controlToFocus.focus();
        } else {
            vschc_add_header_row();
        }
    });
    NAME_FIELD.appendTo( NEW_ROW.find('.vschc-name') );
    
    VALUE_FIELD.on('keyup', function(e) {
        if (13 != e.which) {
            return;
        }
        
        e.preventDefault();
        
        let controlToFocus = false;

        if (vschc_is_empty_str( NAME_FIELD.val() )) {
            controlToFocus = NAME_FIELD;
        }

        if (controlToFocus) {
            controlToFocus.focus();
        } else {
            vschc_add_header_row();
        }
    });
    VALUE_FIELD.appendTo( NEW_ROW.find('.vschc-value') );

    const REMOVE_BTN = jQuery('<a class="btn btn-sm btn-danger align-middle vschc-remove-btn" title="Remove Header">' + 
                              '<i class="fa fa-trash" aria-hidden="true"></i>' + 
                              '</a>');
    REMOVE_BTN.on('click', function() {
        NEW_ROW.remove();

        vschc_update_header_area();
    });
    REMOVE_BTN.appendTo( NEW_ROW.find('.vschc-actions') );

    if (arguments.length > 0) {
        NAME_FIELD.val( vschc_to_string(name) );
        VALUE_FIELD.val( vschc_to_string(value) );
    }

    NEW_ROW.appendTo( TABLE_BODY );

    NAME_FIELD.focus();

    return NEW_ROW;
}

function vschc_auto_add_content_type_header(mime) {
    mime = vschc_normalize_str(mime);
    if ('' === mime) {
        return;
    }

    let addContentType = true;

    const HEADERS_CARD      = jQuery('#vschc-headers-card');
    const HEADERS_CARD_BODY = HEADERS_CARD.find('.card-body');

    HEADERS_CARD_BODY.find('table tbody tr.vschc-header-row').each(function() {
        const ROW = jQuery(this);

        const NAME = vschc_normalize_str( ROW.find('.vschc-name input').val() );
        if ('content-type' === NAME) {
            addContentType = false;
        }
    });

    if (addContentType) {
        vschc_add_header_row('Content-Type', mime);

        vschc_remove_empty_headers();
    }
}

function vschc_body_content() {
    const TEXT_BODY_COL = jQuery('#vschc-input-body-text-col');
    const FROM_FILE_COL = jQuery('#vschc-input-body-file-col');

    let content = false;
    if (TEXT_BODY_COL.is(':visible')) {
        content = btoa( TEXT_BODY_COL.find('textarea').val() );
    } else if (FROM_FILE_COL.is(':visible')) {
        content = FROM_FILE_COL.find('input').val();
    }

    return content;
}

function vschc_create_response_content(responseData, whenClosed) {
    if (!responseData) {
        return;
    }
    
    const CARD = jQuery('<div class="vschc-response-card-entry" />');
    const CARD_BODY = CARD;

    const CARD_BUTTONS = [];
    const ADD_BUTTON = (btn, col) => {
        CARD_BUTTONS.push({
            button: btn,
            column: col,
        });
    };

    let tabBackground = false;
    let tabForeground = false;
    let tabTitle = '';

    if (!vschc_is_empty_str( responseData.error )) {
        const ALERT = jQuery('<div class="alert alert-danger" role="alert" />');
        ALERT.text( vschc_to_string(responseData.error) );        

        ALERT.appendTo( CARD_BODY );

        tabBackground = 'bg-danger';
        tabForeground = 'text-white';
    } else {
        const RESPONSE = responseData.response;

        const RESPONSE_OVERVIEW = jQuery('<div class="card vschc-response-overview">' + 
                                         '<div class="card-header font-weight-bold" />' +
                                         '<div class="card-body" />' + 
                                         '</div>');

        const RESPONSE_OVERVIEW_HEADER = RESPONSE_OVERVIEW.find('.card-header');

        const RESPONSE_OVERVIEW_BODY = RESPONSE_OVERVIEW.find('.card-body');

        // status & code
        {
            const CODE_SPAN = jQuery('<span class="vschc-http-status-code" />');
            let statusSpan;

            // code
            let code = parseInt( vschc_to_string(RESPONSE.code).trim() );
            if (isNaN(code)) {
                RESPONSE_OVERVIEW_HEADER.addClass('bg-light');

                CODE_SPAN.text('<UNKNOWN>');
            } else {
                if (code >= 100 && code < 200) {
                    RESPONSE_OVERVIEW_HEADER.addClass(tabBackground = 'bg-info')
                                            .addClass(tabForeground = 'text-white');
                } else if (code >= 200 && code < 300) {
                    RESPONSE_OVERVIEW_HEADER.addClass(tabBackground = 'bg-success')
                                            .addClass(tabForeground = 'text-white');
                } else if (code >= 300 && code < 400) {
                    RESPONSE_OVERVIEW_HEADER.addClass(tabBackground = 'bg-light');
                } else if (code >= 400 && code < 600) {
                    RESPONSE_OVERVIEW_HEADER.addClass(tabBackground = 'bg-danger')
                                            .addClass(tabForeground = 'text-white');
                } else {
                    RESPONSE_OVERVIEW_HEADER.addClass(tabBackground = 'bg-warning')
                                            .addClass(tabForeground = 'text-white');
                }

                CODE_SPAN.text( code );
            }

            // status
            let status = vschc_to_string(RESPONSE.status).trim();
            if ('' !== status) {
                statusSpan = jQuery('<span class="vschc-http-status-msg" />');

                statusSpan.text( ' - ' + status );
            }

            RESPONSE_OVERVIEW_HEADER.append(CODE_SPAN);
            if (statusSpan) {
                RESPONSE_OVERVIEW_HEADER.append(statusSpan);
            }
        }
        
        // request short info
        if (RESPONSE.request) {
            const REQUEST_SHORT_INFO = jQuery('<div class="vschc-request-short-info" />');

            const ADD_NEW_LINE = (left, right) => {
                const NEW_INFO_LINE = jQuery('<div class="vschc-line">' + 
                                             '<span class="vschc-left font-weight-bold text-right" />' + 
                                             '<span class="vschc-right" />' + 
                                             '</div>');
                NEW_INFO_LINE.find('.vschc-left')
                                   .text(`${ vschc_to_string(left) }:`);
                NEW_INFO_LINE.find('.vschc-right')
                             .text( vschc_to_string(right) );

                NEW_INFO_LINE.appendTo( REQUEST_SHORT_INFO );
            };

            const REQUEST_URL = vschc_to_string(RESPONSE.request.url).trim();
            if ('' !== REQUEST_URL) {
                ADD_NEW_LINE('URL', REQUEST_URL);
            }

            const REQUEST_METHOD = vschc_to_string(RESPONSE.request.method).toUpperCase().trim();
            if ('' !== REQUEST_METHOD) {
                ADD_NEW_LINE('Method', REQUEST_METHOD);
            }            

            const EXEC_TIME = parseInt( vschc_to_string(RESPONSE.request.executionTime).trim() );
            if (!isNaN(EXEC_TIME)) {
                ADD_NEW_LINE('Execution time', `${ EXEC_TIME } ms`);
            }

            const START_TIME = vschc_to_string( RESPONSE.request.startTime ).trim();
            if ('' !== START_TIME) {
                tabTitle = `[${ moment(START_TIME).local().format('HH:mm:ss  YYYY-MM-DD') }]`;

                const TITLE_SUFFIXES = [];

                if ('' !== REQUEST_METHOD) {
                    TITLE_SUFFIXES.push( `[${ REQUEST_METHOD }]` );
                }
                
                if ('' !== REQUEST_URL) {
                    TITLE_SUFFIXES.push( REQUEST_URL );
                }

                if (TITLE_SUFFIXES.length > 0) {
                    tabTitle += ' - ' + TITLE_SUFFIXES.join( ' ' ).trim();
                }
            }

            if (REQUEST_SHORT_INFO.find('.vschc-line').length > 0) {
                REQUEST_SHORT_INFO.appendTo( RESPONSE_OVERVIEW_BODY );
            }            
        }

        RESPONSE_OVERVIEW.appendTo( CARD_BODY );

        // response data
        {
            const RESPONSE = responseData.response;
            
            const DETAILS_CARD = jQuery('<div class="card vschc-response-details">' + 
                                        '<div class="card-header font-weight-bold">' +
                                        '<ul class="nav nav-pills" />' + 
                                        '</div>' + 
                                        '<div class="card-body" />' + 
                                        '</div>');
            DETAILS_CARD.appendTo( CARD_BODY );

            let reponseId = -1;
            do {
                ++reponseId;

                const EXISTING_PILLS = jQuery(`#vschc-response-nav-pills-${ reponseId }`);
                if (EXISTING_PILLS.length < 1) {
                    break;
                }
            } while (true);

            const TAB = jQuery('<div class="tab-content" />');
            TAB.appendTo( DETAILS_CARD.find('.card-body') );

            const TAB_ITEMS = DETAILS_CARD.find('.nav-pills');
            const TAB_CONTENT = TAB;

            TAB_ITEMS.attr('id', `vschc-response-nav-pills-${ reponseId }`);
            TAB_CONTENT.attr('id', `vschc-response-nav-tab-content-${ reponseId }`);

            let reponseTabId = -1;
            const ADD_NEW_ITEM = (title, content) => {
                ++reponseTabId;

                const NEW_TAB_ID = `vschc-response-nav-tab-item-${ reponseId }-${ reponseTabId }`;
                const NEW_TAB_PANE_ID = `vschc-response-nav-tab-pane-${ reponseId }-${ reponseTabId }`;

                const NEW_TAB_ITEM = jQuery('<li class="nav-item vschc-response-nav-tab-item">' + 
                                            `<a class="nav-link" id="${ NEW_TAB_ID }" data-toggle="pill" href="#${ NEW_TAB_PANE_ID }" aria-controls="${ NEW_TAB_PANE_ID }" />` + 
                                            '</li>');
                NEW_TAB_ITEM.find('a').append( title );

                const NEW_TAB_PANE = jQuery(`<div class="tab-pane active vschc-response-nav-tab-pane" id="${ NEW_TAB_PANE_ID }" role="tabpanel" aria-labelledby="${ NEW_TAB_ID }" />`);
                NEW_TAB_PANE.append( content );

                NEW_TAB_PANE.appendTo( TAB_CONTENT );
                NEW_TAB_ITEM.appendTo( TAB_ITEMS );

                if (0 === reponseTabId) {
                    NEW_TAB_ITEM.find('a').addClass('active');

                    NEW_TAB_PANE.addClass('show');
                }
            };

            // RESPONSE
            {
                const HTTP_CONTENT = jQuery('<div />');

                const BUTTONS = [];

                let http = `HTTP/${ RESPONSE.httpVersion } ${ RESPONSE.code } ${ RESPONSE.status }\r\n`;

                let contentDisplayer;
                let pre;

                const REFRESH_HTTP = () => {
                    if (pre) {
                        pre.remove();
                    }
                    
                    pre = jQuery('<pre><code class="http" /></pre>');

                    const CODE = pre.find('code');
                    CODE.text(http);

                    pre.appendTo( HTTP_CONTENT );
                    hljs.highlightBlock( CODE[0] );
                };

                if (RESPONSE.headers) {
                    contentDisplayer = vschc_get_http_content_displayer(
                        RESPONSE.headers, RESPONSE.body,
                        {
                            contentAppender: (content) => {
                                if (content) {
                                    HTTP_CONTENT.append( content );
                                }
                            },
                            httpAppender: (content) => {
                                http += content;
                            },
                            httpRefresher: REFRESH_HTTP,
                            isText: RESPONSE.bodyIsText
                        }
                    );

                    for (const H in RESPONSE.headers) {
                        http += `${H}: ${ RESPONSE.headers[H] }\r\n`;
                    }
                }
                
                http += "\r\n";

                ADD_NEW_ITEM( jQuery('<span>' + 
                                     '<i class="fa fa-arrow-down" aria-hidden="true"></i>' + 
                                     '<span>RESPONSE</span>' + 
                                     '</span>'), HTTP_CONTENT);
                
                REFRESH_HTTP();

                if (!vschc_is_empty_str(RESPONSE.body)) {
                    if (contentDisplayer) {
                        contentDisplayer();
                    }
                }

                if (!vschc_is_empty_str(RESPONSE.body)) {
                    const SAVE_CONTENT_BTN = jQuery('<a class="btn btn-sm btn-primary" title="Save Response Content">' + 
                                                    '<i class="fa fa-floppy-o" aria-hidden="true"></i>' + 
                                                    '</a>');
                    SAVE_CONTENT_BTN.on('click', function() {
                        vscode.postMessage({
                            command: 'saveContent',
                            data: {
                                data: RESPONSE.body,
                                suggestedExtension: RESPONSE.suggestedExtension,
                            }
                        });
                    });

                    const OPEN_IN_EDITOR_BTN = jQuery('<a class="btn btn-sm btn-dark" title="Open Response In Editor">' + 
                                                      '<i class="fa fa-pencil-square" aria-hidden="true"></i>' + 
                                                      '</a>');
                    OPEN_IN_EDITOR_BTN.on('click', function() {
                        vscode.postMessage({
                            command: 'openReponseInEditor',
                            data: RESPONSE
                        });
                    });

                    const OPEN_IN_APP_BTN = jQuery('<a class="btn btn-sm btn-warning" title="Open Response Content As File In App">' + 
                                                   '<i class="fa fa-external-link" aria-hidden="true"></i>' + 
                                                   '</a>');
                    OPEN_IN_APP_BTN.on('click', function() {
                        vscode.postMessage({
                            command: 'openReponseContentInApp',
                            data: {
                                data: RESPONSE.body,
                                suggestedExtension: RESPONSE.suggestedExtension,
                            }
                        });
                    });

                    BUTTONS.push( SAVE_CONTENT_BTN );
                    BUTTONS.push( OPEN_IN_EDITOR_BTN );
                    BUTTONS.push( OPEN_IN_APP_BTN );
                }

                if (BUTTONS.length > 0) {
                    const BTN_LIST = jQuery('<div class="vschc-button-list" />');

                    for (const B of BUTTONS) {
                        BTN_LIST.append( B );
                    }

                    BTN_LIST.prependTo( HTTP_CONTENT );
                }
            }

            // REQUEST
            if (RESPONSE.request) {
                const HTTP_CONTENT = jQuery('<div />');

                let http = `${ RESPONSE.request.method } ${ RESPONSE.request.url } HTTP/1.1\r\n`;

                let contentDisplayer;
                let pre;

                const REFRESH_HTTP = () => {
                    if (pre) {
                        pre.remove();
                    }
                    
                    pre = jQuery('<pre><code class="http" /></pre>');

                    const CODE = pre.find('code');
                    CODE.text(http);

                    pre.appendTo( HTTP_CONTENT );
                    hljs.highlightBlock( CODE[0] );
                };

                if (RESPONSE.request.headers) {
                    contentDisplayer = vschc_get_http_content_displayer(
                        RESPONSE.request.headers, RESPONSE.request.body,
                        {
                            contentAppender: (content) => {
                                if (content) {
                                    HTTP_CONTENT.append( content );
                                }
                            },
                            httpAppender: (content) => {
                                http += content;
                            },
                            httpRefresher: REFRESH_HTTP,
                            isText: RESPONSE.bodyIsText
                        }
                    );

                    for (const H in RESPONSE.request.headers) {
                        http += `${H}: ${ RESPONSE.request.headers[H] }\r\n`;
                    }
                }

                http += "\r\n";

                ADD_NEW_ITEM( jQuery('<span>' + 
                                     '<i class="fa fa-arrow-up" aria-hidden="true"></i>' + 
                                     '<span>REQUEST</span>' + 
                                     '</span>'), HTTP_CONTENT);

                REFRESH_HTTP();

                if (!vschc_is_empty(RESPONSE.request.body)) {
                    if (contentDisplayer) {
                        contentDisplayer();
                    }
                }

                const BUTTONS = [];

                if (!vschc_is_empty_str(RESPONSE.request.body)) {
                    const OPEN_IN_EDITOR_BTN = jQuery('<a class="btn btn-sm btn-dark" title="Open Request In Editor">' + 
                                                      '<i class="fa fa-pencil-square" aria-hidden="true"></i>' + 
                                                      '</a>');
                    OPEN_IN_EDITOR_BTN.on('click', function() {
                        vscode.postMessage({
                            command: 'openRequestInEditor',
                            data: RESPONSE
                        });
                    });

                    BUTTONS.push( OPEN_IN_EDITOR_BTN );
                }


                const REDO_BTN = jQuery('<a class="btn btn-sm btn-warning" title="Redo That Request">' + 
                                        '<i class="fa fa-repeat" aria-hidden="true"></i>' + 
                                        '</a>');
                REDO_BTN.on('click', function() {
                    vschc_send_request({
                        body: {
                            content: RESPONSE.request.body,
                            file: false,
                            fileSize: false
                        },
                        headers: RESPONSE.request.headers,
                        method: RESPONSE.request.method,
                        title: jQuery('#vschc-input-title').val(),
                        url: RESPONSE.request.url,
                    });
                });

                BUTTONS.push( REDO_BTN );

                if (BUTTONS.length > 0) {
                    const BTN_LIST = jQuery('<div class="vschc-button-list" />');

                    for (const B of BUTTONS) {
                        BTN_LIST.append( B );
                    }

                    BTN_LIST.prependTo( HTTP_CONTENT );
                }
            }
        }
    }

    return {
        content: CARD,
        tab: {
            background: tabBackground,
            foreground: tabForeground,
            title: tabTitle
        }
    };
}

function vschc_execute_script() {
    const BTN = jQuery('#vschc-execute-script');

    const URL_FIELD = jQuery('#vschc-input-url');

    if (vschc_is_empty_str( URL_FIELD.val() )) {
        URL_FIELD.focus();
    } else {
        BTN.addClass('disabled');
        BTN.find('span').text('Executing ...');

        vschc_update_response_button_states(false);

        vscode.postMessage({
            command: 'executeScript',
            data: vschc_prepare_request()
        });
    }
}

function vschc_get_headers() {
    const HEADERS = {};

    const HEADERS_CARD      = jQuery('#vschc-headers-card');
    const HEADERS_CARD_BODY = HEADERS_CARD.find('.card-body');

    HEADERS_CARD_BODY.find('table tbody tr.vschc-header-row').each(function() {
        const ROW = jQuery(this);

        const NAME = vschc_normalize_str( ROW.find('.vschc-name input').val() );
        if ('' !== NAME) {
            HEADERS[ NAME ] = vschc_to_string( ROW.find('.vschc-value input').val() );
        }
    });

    return HEADERS;
}

function vschc_get_http_content_displayer(
    headers, body,
    opts
) {
    let contentDisplayer;

    const APPEND_CONTENT = (content) => {
        if (opts && opts.contentAppender) {
            opts.contentAppender( content );
        }
    };

    const APPEND_TO_HTTP = (content) => {
        if (opts && opts.httpAppender) {
            opts.httpAppender( content );
        }
    };

    const REFRESH_HTTP = () => {
        if (opts && opts.httpRefresher) {
            opts.httpRefresher();
        }
    };

    const TEXT_DISPLAYER = () => {
        if (!vschc_is_empty_str(body)) {
            APPEND_TO_HTTP( atob(body) );
        }        

        REFRESH_HTTP();
    };

    if (headers && !vschc_is_empty_str(body)) {
        const MIME = vschc_get_content_type(headers);
        if (!vschc_is_empty_str(MIME)) {
            let jsonResp;
            try {
                jsonResp = JSON.parse( atob(body) );
            } catch (e) {
                jsonResp = false;
            }

            if (jsonResp) {
                contentDisplayer = () => {
                    const JSON_PRE = jQuery('<pre><code class="json" /></pre>');
                    const JSON_CODE = JSON_PRE.find('code');

                    JSON_CODE.text(JSON.stringify(
                        jsonResp, null, 2
                    ));

                    APPEND_CONTENT( JSON_PRE );
                    hljs.highlightBlock( JSON_CODE[0] );

                    suggestedExtension = 'json';
                };
            } else if (vschc_is_mime(MIME, [ 'text/css' ])) {
                contentDisplayer = () => {
                    const CSS = atob( body );

                    const CSS_PRE = jQuery('<pre><code class="css" /></pre>');
                    const CSS_CODE = CSS_PRE.find('code');

                    CSS_CODE.text(CSS);

                    APPEND_CONTENT( CSS_PRE );
                    hljs.highlightBlock( CSS_CODE[0] );
                };
            } else if (vschc_is_mime(MIME, [ 'text/html' ])) {
                contentDisplayer = () => {
                    const HTML = atob( body );

                    const HTML_PRE = jQuery('<pre><code class="html" /></pre>');
                    const HTML_CODE = HTML_PRE.find('code');

                    HTML_CODE.text(HTML);

                    APPEND_CONTENT( HTML_PRE );
                    hljs.highlightBlock( HTML_CODE[0] );
                };
            } else if (vschc_is_mime(MIME, [ 'text/markdown' ])) {
                contentDisplayer = () => {
                    const MD = atob( body );

                    const MD_PRE = jQuery('<pre><code class="markdown" /></pre>');
                    const MD_CODE = MD_PRE.find('code');

                    MD_CODE.text(MD);

                    APPEND_CONTENT( MD_PRE );
                    hljs.highlightBlock( MD_CODE[0] );
                };
            } else if (vschc_is_mime(MIME, [ 'text/xml' ])) {
                contentDisplayer = () => {
                    const XML = atob( body );

                    const XML_PRE = jQuery('<pre><code class="xml" /></pre>');
                    const XML_CODE = XML_PRE.find('code');

                    XML_CODE.text(XML);

                    APPEND_CONTENT( XML_PRE );
                    hljs.highlightBlock( XML_CODE[0] );
                };
            } else if (vschc_is_mime(MIME, [ 'application/javascript', 'text/javascript' ])) {
                contentDisplayer = () => {
                    const JS = atob( body );

                    const JS_PRE = jQuery('<pre><code class="javascript" /></pre>');
                    const JS_CODE = JS_PRE.find('code');

                    JS_CODE.text(JS);

                    APPEND_CONTENT( JS_PRE );
                    hljs.highlightBlock( JS_CODE[0] );
                };
            } else if (vschc_is_mime(MIME, [ 'application/x-yaml', 'text/yaml' ])) {
                contentDisplayer = () => {
                    const YAML = atob( body );

                    const YAML_PRE = jQuery('<pre><code class="yaml" /></pre>');
                    const YAML_CODE = YAML_PRE.find('code');

                    YAML_CODE.text(YAML);

                    APPEND_CONTENT( JS_PRE );
                    hljs.highlightBlock( YAML_CODE[0] );
                };
            } else if (MIME.startsWith('text/')) {
                contentDisplayer = TEXT_DISPLAYER;
            } else if (MIME.startsWith('image/')) {
                contentDisplayer = () => {
                    const IMG = jQuery('<img />');
                    IMG.attr('src', `data:${ MIME };base64,${ body.trim() }`);
                    IMG.addClass( 'img-fluid' );

                    APPEND_CONTENT( IMG );
                };
            }
        }
    }

    if (!contentDisplayer) {
        if (opts) {
            if (true === opts.isText) {
                contentDisplayer = TEXT_DISPLAYER;
            }
        }
    }

    return contentDisplayer;
}

function vschc_prepare_request() {
    const URL_FIELD    = jQuery('#vschc-input-url');
    const METHOD_FIELD = jQuery('#vschc-input-method');
    const TITLE_FIELD  = jQuery('#vschc-input-title');

    const URL = vschc_to_string( URL_FIELD.val() ).trim();

    const IS_FILE = jQuery('#vschc-input-body-file-col').is(':visible');

    return {
        body: {
            content: vschc_body_content(),
            file: IS_FILE ? jQuery('#vschc-body-file-path .vschc-path').text()
                          : false,
            fileSize: IS_FILE ? parseInt( vschc_to_string(jQuery('#vschc-input-body-file-col .vschc-size').text()).trim() )
                              : false
        },
        headers: vschc_get_headers(),
        method: METHOD_FIELD.val(),
        title: TITLE_FIELD.val(),
        url: URL
    };
}

function vschc_remove_empty_headers() {
    const HEADERS_CARD      = jQuery('#vschc-headers-card');
    const HEADERS_CARD_BODY = HEADERS_CARD.find('.card-body');

    HEADERS_CARD_BODY.find('table tbody tr.vschc-header-row').each(function() {
        const ROW = jQuery(this);

        const NAME = vschc_normalize_str( ROW.find('.vschc-name input').val() );
        if ('' === NAME) {
            ROW.remove();
        }
    });
}

function vschc_reset_body_file() {
    const BODY_FILE = jQuery('#vschc-input-body-file');
    BODY_FILE.val( '' );

    const BODY_FILE_CONTENT_TO_DISPLAY = jQuery('#vschc-body-file-content-to-display');
    BODY_FILE_CONTENT_TO_DISPLAY.hide();
    BODY_FILE_CONTENT_TO_DISPLAY.html('');    
}

function vschc_reset_headers() {
    const CARD      = jQuery('#vschc-headers-card');
    const CARD_BODY = CARD.find('.card-body');

    CARD_BODY.html('');

    const TABLE = jQuery('<table class="table">' + 
                         '<thead>' + 
                         '<tr>' + 
                         '<th class="vschc-name">Name</th>' + 
                         '<th class="vschc-value">Value</th>' + 
                         '<th class="vschc-actions">Actions</th>' + 
                         '</tr>' + 
                         '</thead>' + 
                         '<tbody />' + 
                         '</table>');

    TABLE.appendTo( CARD_BODY );

    vschc_add_header_row();
}

function vschc_reset_response() {
    jQuery('#vschc-reset-responses-btn').hide();

    jQuery('#vschc-response-card .card-body').text( 'No request started yet.' );    

    vschc_next_response_id = -1;
}

function vschc_send_request(requestToSend) {
    if (arguments.length < 1) {
        requestToSend = vschc_prepare_request();
    }

    const BTN = jQuery('#vschc-send-request');

    const URL_FIELD = jQuery('#vschc-input-url');

    if (vschc_is_empty_str( URL_FIELD.val() )) {
        URL_FIELD.focus();
    } else {
        BTN.addClass('disabled');
        BTN.find('span').text('Sending ...');

        vschc_update_response_button_states(false);

        vscode.postMessage({
            command: 'sendRequest',
            data: requestToSend
        });
    }
}

function vschc_set_body_content(content) {
    const BODY_TEXT = jQuery('#vschc-input-body-text');
    BODY_TEXT.val( content.data );
    
    vschc_reset_body_file();                    
    vschc_update_body_area();
}

function vschc_set_body_content_from_file(content) {
    let contentDisplayer;

    const BODY_FILE      = jQuery('#vschc-input-body-file');
    const BODY_FILE_PATH = jQuery('#vschc-body-file-path');
    
    const BODY_FILE_CONTENT_TO_DISPLAY = jQuery('#vschc-body-file-content-to-display');
    BODY_FILE_CONTENT_TO_DISPLAY.hide();
    BODY_FILE_CONTENT_TO_DISPLAY.html('');

    if (content && content.data.length > 1) {
        BODY_FILE.val( content.data );

        BODY_FILE_PATH.find('.vschc-path').text( content.path );
        BODY_FILE_PATH.find('.vschc-size').text( `${ content.size }` );

        if (content.mime) {
            const MIME = vschc_normalize_str(content.mime);

            if (MIME.startsWith('image/')) {
                contentDisplayer = () => {
                    const IMG = jQuery('<img />');
                    IMG.attr('src', `data:${ MIME };base64,${ content.data.trim() }`);
                    IMG.addClass( 'img-fluid' );

                    IMG.appendTo( BODY_FILE_CONTENT_TO_DISPLAY );

                    BODY_FILE_CONTENT_TO_DISPLAY.show();
                };
            }
        }
    } else {
        vschc_reset_body_file();
    }

    vschc_update_body_area();
    
    vschc_auto_add_content_type_header( content.mime );

    if (contentDisplayer) {
        contentDisplayer();
    }
}

function vschc_update_body_area() {
    const BODY_FILE     = jQuery('#vschc-input-body-file');
    const COL_BODY_TEXT = jQuery('#vschc-input-body-text-col');
    const COL_FILE_TEXT = jQuery('#vschc-input-body-file-col');

    if (vschc_is_empty_str( BODY_FILE.val() )) {
        COL_FILE_TEXT.hide();
        COL_BODY_TEXT.show();

        vschc_update_body_from_file_btn_visibility(true);
    } else {
        COL_FILE_TEXT.show();
        COL_BODY_TEXT.hide();

        vschc_update_body_from_file_btn_visibility(false);
    }
}

function vschc_update_body_from_file_btn_visibility(isVisible) {
    if (arguments.length < 1) {
        vschc_update_body_area();
        return;
    }

    const COL_FROM_FILE = jQuery('#vschc-btn-from-file-col');    

    COL_FROM_FILE.hide();

    if (isVisible) {
        if (!vschc_do_not_show_body_from_file_btn) {
            COL_FROM_FILE.show();
        }    
    }
}

function vschc_update_header_area() {
    const HEADERS_CARD = jQuery('#vschc-headers-card');
    const HEADERS_CARD_BODY = HEADERS_CARD.find('.card-body');

    if (HEADERS_CARD_BODY.find('table tbody tr.vschc-header-row').length < 1) {
        vschc_reset_headers();
    }
}

function vschc_update_response_button_states(areEnabled) {
    const EXEC_SCRIPT_BTN = jQuery('#vschc-execute-script');
    const RESET_REQUEST_BTN = jQuery('#vschc-reset-responses-btn');
    const SEND_REQUEST_BTN = jQuery('#vschc-send-request');
    
    EXEC_SCRIPT_BTN.removeClass('disabled');
    SEND_REQUEST_BTN.removeClass('disabled');

    if (areEnabled) {
        RESET_REQUEST_BTN.show();
        
        EXEC_SCRIPT_BTN.find('span').text('Execute Script');
        SEND_REQUEST_BTN.find('span').text('Send Request');
    } else {
        RESET_REQUEST_BTN.hide();

        EXEC_SCRIPT_BTN.addClass('disabled');
        SEND_REQUEST_BTN.addClass('disabled');
    }
}

jQuery(() => {
    jQuery('#vschc-input-method').select2({
        tags: true
    });
})

jQuery(() => {
    window.addEventListener('message', (e) => {
        if (!e) {
            return;
        }

        const MSG = e.data;
        if (!MSG) {
            return;
        }

        switch (MSG.command) {
            case 'applyRequest':
            case 'importRequestCompleted':
                {
                    const REQUEST = MSG.data;

                    const METHOD_LIST = jQuery('#vschc-input-method');

                    let body    = REQUEST.body;
                    let headers = REQUEST.headers;
                    let method  = REQUEST.method;
                    let title   = REQUEST.title;
                    let url     = REQUEST.url;

                    if (vschc_is_empty_str(method)) {
                        method = 'GET';
                    }
                    {
                        method = ('' + method).toUpperCase().trim();

                        let methodFound = false;

                        METHOD_LIST.find('option').each(function() {
                            const OPTION = jQuery(this);

                            if (OPTION.val() === method) {
                                found = true;
                            }
                        });

                        if (!methodFound) {
                            METHOD_LIST.append( jQuery('<option />').text(method) );
                        }
                    }

                    if (vschc_is_empty_str(url)) {
                        url = '';
                    }

                    if (!headers) {
                        headers = {};
                    }
                    {
                        const HEADERS_CARD      = jQuery('#vschc-headers-card');
                        const HEADERS_CARD_BODY = HEADERS_CARD.find('.card-body');

                        HEADERS_CARD_BODY.find('table tbody tr.vschc-header-row').remove();

                        for (const H in headers) {
                            if (!vschc_is_empty_str(H)) {
                                vschc_add_header_row(vschc_to_string(H),
                                                     headers[H]);
                            }
                        }
                    }

                    jQuery('#vschc-input-url').val( '' + url );      
                    METHOD_LIST.val( method )
                               .trigger('change');
                    
                    if (false !== title) {
                        jQuery('#vschc-input-title').val( '' + vschc_to_string(title) )
                                                    .trigger('change');
                    }

                    if (body) {
                        if (body.file) {
                            vschc_set_body_content_from_file({
                                data: body.content,
                                mime: body.mime,
                                path: body.file,
                                size: body.fileSize
                            });
                        } else {
                            vschc_set_body_content({
                                data: atob(body.content)
                            });
                        }
                    } else {
                        vschc_update_body_area();
                    }

                    vschc_update_header_area();

                    jQuery('#vschc-input-url').focus();                    
                }
                break;

            case 'executeScriptCompleted':
                vschc_update_response_button_states(true);
                break;

            case 'findInitialControlToFocus':
                {
                    const URL_FIELD = jQuery('#vschc-input-url');

                    let controlToFocus = false;

                    if (vschc_is_empty_str( URL_FIELD.val() )) {
                        controlToFocus = URL_FIELD;
                    }

                    if (!controlToFocus) {
                        const HEADERS_CARD = jQuery('#vschc-headers-card');
                        const HEADERS_CARD_BODY = HEADERS_CARD.find('.card-body');

                        HEADERS_CARD_BODY.find('table tbody tr.vschc-header-row').each(function() {
                            const ROW = jQuery(this);

                            const NAME_FIELD = ROW.find('.vschc-name input');

                            if (vschc_is_empty_str( NAME_FIELD.val() )) {
                                if (!controlToFocus) {
                                    controlToFocus = NAME_FIELD;
                                }
                            }   
                        });
                    }

                    if (!controlToFocus) {
                        controlToFocus = URL_FIELD;
                    }

                    controlToFocus.focus();
                }
                break;

            case 'initTitle':
                {
                    const TITLE_FIELD = jQuery('#vschc-input-title');

                    TITLE_FIELD.val( vschc_to_string(MSG.data) );
                    TITLE_FIELD.on('change', () => {
                        vscode.postMessage({
                            command: 'titleUpdated',
                            data: vschc_to_string( TITLE_FIELD.val() ),
                        });
                    });
                }                
                break;

            case 'resetAllHeadersCompleted':
                vschc_reset_headers();
                break;

            case 'resetResponsesCompleted':
                vschc_reset_response();
                break;

            case 'sendRequestCompleted':
                {
                    const RESPONSE_DATA = MSG.data;
                    const RESPONSE = RESPONSE_DATA.response;

                    const CARD      = jQuery('#vschc-response-card');
                    const CARD_BODY = CARD.find('.card-body');

                    let onCardClosed;

                    let scrollToAction = () => {
                        const SEND_BTN = jQuery('#vschc-send-request');

                        jQuery(document).scrollTop(
                            SEND_BTN.offset().top - SEND_BTN.outerHeight(true) - 24
                        );
                    };

                    const NEW_RESPONSE_CARD = vschc_create_response_content(RESPONSE_DATA, () => {
                        if (onCardClosed) {
                            onCardClosed();
                        }
                    });

                    if (NEW_RESPONSE_CARD.content) {
                        let tab = CARD_BODY.find('#vschc-response-tab');
                        if (tab.length < 1) {
                            CARD_BODY.html('');

                            tab = jQuery('<div id="vschc-response-tab">' + 
                                         '<ul class="nav nav-tabs" id="vschc-response-tab-list" role="tablist" />' + 
                                         '<div class="tab-content" id="vschc-response-tab-content" />' + 
                                         '</div>');

                            tab.appendTo( CARD_BODY );
                        }

                        const EXISTING_TAB_PANES = tab.find('.vschc-response-card-entry');
                        EXISTING_TAB_PANES.each(function() {
                            const P = jQuery(this);

                            P.removeClass('active')
                             .removeClass('show');
                        });

                        // kloobi
                        const NEXT_ID = ++vschc_next_response_id;

                        const TAB_ITEM_ID = `vschc-response-tab-item-${NEXT_ID}`;
                        const TAB_PANE_ID = `vschc-response-tab-pane-${NEXT_ID}`;

                        const NEW_NAV_ITEM = jQuery('<li class="nav-item vschc-response-tab-item">' + 
                                                    `<a class="nav-link" id="${ TAB_ITEM_ID }" data-toggle="tab" href="#${ TAB_PANE_ID }" role="tab" aria-controls="${ TAB_PANE_ID }" aria-selected="true"><span class="vschc-title" /><span class="vschc-buttons" /></a>` + 
                                                    '</li>');
                        const NEW_NAV_ITEM_LINK = NEW_NAV_ITEM.find('a.nav-link');
                        NEW_NAV_ITEM_LINK.find('span.vschc-title').text(`Response #${NEXT_ID + 1}`);
                        
                        if (NEW_RESPONSE_CARD.tab.background) {
                            NEW_NAV_ITEM.find('a.nav-link').addClass( NEW_RESPONSE_CARD.tab.background );
                        }
                        if (NEW_RESPONSE_CARD.tab.foreground) {
                            NEW_NAV_ITEM.find('a.nav-link').addClass( NEW_RESPONSE_CARD.tab.foreground );
                        }
                        NEW_NAV_ITEM.attr('title', NEW_RESPONSE_CARD.tab.title);

                        const NEW_TAB_PANE = jQuery(`<div class="tab-pane vschc-response-tab-pane" id="${ TAB_PANE_ID }" role="tabpanel" aria-labelledby="${ TAB_ITEM_ID }" />`);
                        NEW_TAB_PANE.append( NEW_RESPONSE_CARD.content );

                        tab.find('.nav-tabs').prepend( NEW_NAV_ITEM );
                        tab.find('.tab-content').prepend( NEW_TAB_PANE );

                        NEW_NAV_ITEM.find('a').tab('show');

                        const DETAILS_NAV_ITEMS = NEW_TAB_PANE.find('.vschc-response-nav-tab-item a');
                        if (DETAILS_NAV_ITEMS.length > 1) {
                            const OLD_SCROLL_ACTION = scrollToAction;

                            scrollToAction = () => {
                                jQuery(DETAILS_NAV_ITEMS[1]).tab('show');

                                setTimeout(() => {
                                    jQuery(DETAILS_NAV_ITEMS[0]).tab('show');

                                    OLD_SCROLL_ACTION();
                                }, 250);
                            };                            
                        }

                        onCardClosed = () => {
                            const CURRENT_INDEX = NEW_NAV_ITEM.index();

                            NEW_TAB_PANE.remove();
                            NEW_NAV_ITEM.remove();

                            let newIndex = CURRENT_INDEX;
                            while (newIndex > 0 && newIndex >= tab.find('.vschc-response-tab-item').length) {
                                --newIndex;
                            }

                            const REMAING_TABS = tab.find('.vschc-response-tab-item');
                            if (REMAING_TABS.length > 0) {
                                const ITEM_TO_SHOW = REMAING_TABS[newIndex];
                                
                                if (ITEM_TO_SHOW) {
                                    jQuery(ITEM_TO_SHOW).find('a').tab('show');
                                }
                            }
                        };
                    }                    

                    vschc_update_response_button_states(true);

                    if (scrollToAction) {
                        scrollToAction();
                    }
                }
                break;

            case 'setBodyContent':
                vschc_set_body_content(MSG.data);
                break;

            case 'setHeaders':
                {
                    vschc_reset_headers();

                    const CARD      = jQuery('#vschc-headers-card');
                    const CARD_BODY = CARD.find('.card-body');

                    const HEADER_TABLE = CARD_BODY.find('table');
                    const HEADER_TABLE_ROWS = HEADER_TABLE.find('tbody .vschc-header-row');

                    HEADER_TABLE_ROWS.remove();

                    const HEADERS = MSG.data;
                    if (HEADERS) {
                        for (const H in HEADERS) {
                            const NAME = vschc_to_string(H).trim();

                            if ('' !== NAME) {
                                vschc_add_header_row(NAME,
                                                     HEADERS[H]);
                            }
                        }
                    }

                    if (HEADER_TABLE_ROWS.length < 1) {
                        vschc_reset_headers();
                    }
                }
                break;

            case 'setBodyContentFromFile':
                vschc_set_body_content_from_file(MSG.data);
                break;

            case 'setIfBodyContentIsReadOnly':
                jQuery('#vschc-input-body-text').prop('readonly', !!MSG.data);
                break;

            case 'setIfHideBodyFromFileButton':
                vschc_do_not_show_body_from_file_btn = !!MSG.data;
                vschc_update_body_from_file_btn_visibility();
                break;

            case 'styleChanged':
                {
                    const CSS_FILE = vschc_to_string(MSG.data);
                    if ('' !== CSS_FILE.trim()) {
                        const OLD_LINK = jQuery("head link[vschc-style='bootstrap']");

                        const NEW_LINK = document.createElement("link");
                        NEW_LINK.setAttribute("rel", "stylesheet");
                        NEW_LINK.setAttribute("type", "text/css");
                        NEW_LINK.setAttribute("href", CSS_FILE);
                        NEW_LINK.setAttribute('vschc-style', 'bootstrap');

                        OLD_LINK.replaceWith( NEW_LINK );
                    }
                }
                break;
        }
    });

    jQuery('#vschc-btn-from-file').on('click', function() {
        vscode.postMessage({
            command: 'loadBodyContent'            
        });
    });

    jQuery('#vschc-body-file-path .vschc-path').on('click', function() {
        vscode.postMessage({
            command: 'unsetBodyFromFile'            
        });
    });

    jQuery('#vschc-execute-script').on('click', function() {
        vschc_execute_script();
    });

    jQuery('#vschc-send-request').on('click', function() {
        vschc_send_request();
    });

    jQuery('#vschc-input-url').on('keyup', function(e) {
        if (13 == e.which) {
            e.preventDefault();

            vschc_send_request();
        }
    });

    jQuery('#vschc-export-request-btn').on('click', function() {
        vscode.postMessage({
            command: 'exportRequest',
            data: vschc_prepare_request()
        });
    });

    jQuery('#vschc-import-request-btn').on('click', function() {
        vscode.postMessage({
            command: 'importRequest'
        });
    });

    jQuery('#vschc-clone-request-btn').on('click', function() {
        vschc_post('cloneRequest',
                   vschc_prepare_request());
    });

    jQuery('#vschc-reset-responses-btn').on('click', function() {
        vscode.postMessage({
            command: 'resetResponses'
        });
    });

    jQuery('#vschc-reset-all-headers-btn').on('click', function() {
        vscode.postMessage({
            command: 'resetAllHeaders'
        });
    });

    jQuery('#vschc-add-header-btn').on('click', function() {
        vschc_add_header_row();
    });    

    jQuery('#vschc-input-url-group .input-group-append').on('click', function() {
        const URL_FIELD = jQuery('#vschc-input-url');
        if (vschc_is_empty_str(URL_FIELD.val())) {
            URL_FIELD.focus();

            return;
        }

        const WIN = jQuery('#vschc-edit-url-parameters-modal');
        
        const WIN_BODY = WIN.find('.modal-body');
        const WIN_FOOTER = WIN.find('.modal-footer');

        let url = vschc_to_string( URL_FIELD.val() );

        const RESET_FORM = () => {
            WIN_BODY.html('');

            const PARAM_TABLE = jQuery('<table class="table table-hover vschc-param-list">' +
                                    '<thead>' + 
                                    '<tr>' + 
                                    '<th class="vschc-name">Name</th>' + 
                                    '<th class="vschc-value">Value</th>' + 
                                    '<th class="vschc-functions">&nbsp;</th>' + 
                                    '</tr>' + 
                                    '</thead>' + 
                                    '<tbody />' + 
                                    '</table>');

            PARAM_TABLE.appendTo( WIN_BODY );

            const PARAM_TABLE_BODY = PARAM_TABLE.find('tbody');        

            let initRowListIfNeeded;

            const ADD_ROW = () => {
                const NEW_ROW = jQuery('<tr>' + 
                                    '<td class="vschc-name">' + 
                                    '<input type="text" class="form-control">' + 
                                    '</td>' + 
                                    '<td class="vschc-value">' + 
                                    '<input type="text" class="form-control">' + 
                                    '</td>' + 
                                    '<td class="vschc-functions" />' + 
                                    '</tr>');

                const DELETE_BTN = jQuery('<a class="btn btn-sm btn-danger">' +
                                        '<i class="fa fa-trash" aria-hidden="true"></i>' +
                                        '</a>');
                DELETE_BTN.attr('title', 'Remove Parameter ...');
                DELETE_BTN.on('click', function() {
                    NEW_ROW.remove();

                    initRowListIfNeeded();
                });
                NEW_ROW.find('.vschc-functions')
                    .append( DELETE_BTN );

                NEW_ROW.appendTo( PARAM_TABLE_BODY );

                return NEW_ROW;
            };

            initRowListIfNeeded = () => {
                if (PARAM_TABLE_BODY.find('tr').length < 1) {
                    ADD_ROW();
                }

                let controlToFocus = false;

                PARAM_TABLE_BODY.find('tr').each(function() {
                    const ROW = jQuery(this);

                    const NAME_FIELD = ROW.find('.vschc-name input');
                    const VALUE_FIELD = ROW.find('.vschc-value input');

                    if (false === controlToFocus) {
                        if (vschc_is_empty_str( NAME_FIELD.val() )) {
                            controlToFocus = NAME_FIELD;
                        } else if (vschc_is_empty_str( VALUE_FIELD.val() )) {
                            controlToFocus = VALUE_FIELD;   
                        }
                    }
                });

                if (false !== controlToFocus) {
                    controlToFocus.focus();
                }
            };

            const QUERY_SEP = url.indexOf('?');
            if (QUERY_SEP > -1) {
                const SEARCH = url.substr(QUERY_SEP + 1);
                if (!vschc_is_empty_str(SEARCH)) {
                    const PARAM_LIST = SEARCH.split('&').filter(x => {
                        return '' !== x.trim();
                    }).map(x => {
                        let name;
                        let value;

                        const PARAM_SEP = x.indexOf('=');
                        if (PARAM_SEP > -1) {
                            name = x.substr(0, PARAM_SEP);
                            value = x.substr(PARAM_SEP + 1);
                        } else {
                            name = x;
                        }

                        return {
                            name: vschc_to_string(name).trim(),
                            value: decodeURIComponent( vschc_to_string(value) )
                        };
                    });

                    const PARAMS = {};
                    for (const P of PARAM_LIST) {
                        const NEW_ROW = ADD_ROW();

                        NEW_ROW.find('.vschc-name input')
                            .val(P.name);
                        NEW_ROW.find('.vschc-value input')
                            .val(P.value);
                    }
                }
            }

            WIN_FOOTER.find('.vschc-add-btn').off('click').on('click', function() {
                ADD_ROW();
            });

            WIN_FOOTER.find('.vschc-update-btn').off('click').on('click', function() {
                let newUrl = url;
                if (QUERY_SEP > -1) {
                    newUrl = newUrl.substr(0, QUERY_SEP);
                }
                
                const PARAMS_TO_APPEND = [];
                
                PARAM_TABLE_BODY.find('tr').each(function() {
                    const ROW = jQuery(this);

                    const NAME = ROW.find('.vschc-name input').val();
                    const VALUE = ROW.find('.vschc-value input').val();

                    if (!vschc_is_empty_str(NAME) || !vschc_is_empty_str(VALUE)) {
                        PARAMS_TO_APPEND.push({
                            name: NAME.trim(),
                            value: VALUE
                        });
                    }
                });

                PARAMS_TO_APPEND.forEach((p, i) => {
                    newUrl += `${i > 0 ? '&' : '?'}` + 
                            `${ p.name }=${ encodeURIComponent(p.value) }`;
                });

                URL_FIELD.val( newUrl );

                WIN.modal('hide');    
            });

            const ADD_ROW_BTN = jQuery('<a type="button" class="btn btn-dark vschc-add-btn">' + 
                                       '<i class="fa fa-plus-square" aria-hidden="true"></i>' + 
                                       '</a>');
            ADD_ROW_BTN.attr('title', 'Add New Parameter ...');
            ADD_ROW_BTN.on('click', function() {
                ADD_ROW();
            });
            ADD_ROW_BTN.prependTo( WIN_BODY );

            initRowListIfNeeded();
        };

        WIN_FOOTER.find('.vschc-undo-btn').off('click').on('click', function() {
            RESET_FORM();
        });

        RESET_FORM();

        WIN.modal('show');
    });

    jQuery('#vschc-import-headers-btn').on('click', function() {
        const WIN = jQuery('#vschc-import-headers-modal');
        const WIN_FOOTER = WIN.find('.modal-footer');

        const HEADER_LIST_FIELD = WIN.find('.modal-body textarea');
        HEADER_LIST_FIELD.val('');

        WIN_FOOTER.find('.vschc-import-btn').off('click').on('click', function() {
            const HEADERS = vschc_to_string( HEADER_LIST_FIELD.val() ).split("\n").filter(l => {
                return !vschc_is_empty_str( l );
            }).map(l => {
                let name;
                let value = '';

                const SEP = l.indexOf(':');
                if (SEP > -1) {
                    name = l.substr(0, SEP);
                    value = l.substr(SEP + 1);
                } else {
                    name = l;
                }

                return {
                    name: name.trim(),
                    value: value.trim(),
                };
            });

            if (HEADERS.length < 1) {
                HEADER_LIST_FIELD.focus();
                return;
            }

            for (const H of HEADERS) {
                let matchingRow = false;

                jQuery('#vschc-headers-card .card-body table tr.vschc-header-row').each(function() {
                    if (false !== matchingRow) {
                        return;
                    }

                    const ROW = jQuery(this);

                    const NAME = vschc_normalize_str( ROW.find('.vschc-name input').val() );
                    const VALUE = vschc_to_string( ROW.find('.vschc-value input').val() );

                    if (vschc_normalize_str(H.name) === NAME) {
                        matchingRow = ROW;
                    } else {
                        if (vschc_is_empty_str(NAME) && vschc_is_empty_str(VALUE)) {
                            matchingRow = ROW;
                        }
                    }
                });

                if (false === matchingRow) {
                    vschc_add_header_row(H.name, H.value);
                } else {
                    matchingRow.find('.vschc-name input')
                               .val( H.name );

                    matchingRow.find('.vschc-value input')
                               .val( H.value );
                }
            }

            WIN.modal('hide');
        });

        WIN.modal('show');
    });

    jQuery('#vschc-import-headers-modal').on('shown.bs.modal', function () {
        const WIN = jQuery(this);

        WIN.find('.modal-body textarea')
           .focus();
    });

    jQuery('#vschc-import-http-file-btn').on('click', function() {
        vschc_post('importHTTPFile');
    });
});

jQuery(() => {
    vschc_reset_body_file();
    vschc_update_body_area();
    vschc_reset_headers();
    vschc_reset_response();
});

jQuery(() => {
    jQuery('#vschc-input-url').focus();
});

jQuery(() => {
    vscode.postMessage({
        command: 'onLoaded'            
    });
});
