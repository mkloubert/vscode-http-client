
let vschc_do_not_show_body_from_file_btn = false;

function vschc_add_header_row(name, value) {
    const CARD = jQuery('#vschc-headers-card');
    const CARD_BODY = CARD.find('.card-body');

    const TABLE = CARD_BODY.find('table');
    if (TABLE.length < 1) {
        return;
    }

    let controlToFocus = false;

    if (arguments.length < 1) {
        TABLE.find('tr.vschc-header-row').each(function() {
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

        controlToFocus = NAME_FIELD;
    }

    if (controlToFocus) {
        controlToFocus.focus();
    }
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
    const INSERT_BUTTONS = () => {
        const CLOSE_CARD_BTN = jQuery('<a class="btn btn-sm btn-danger align-middle vschc-remove-response-btn float-right" title="Close">' + 
                                      '<i class="fa fa-times" aria-hidden="true"></i>' + 
                                      '</a>');
        CLOSE_CARD_BTN.on('click', () => {
            CARD.remove();

            if (whenClosed) {
                whenClosed();
            }

            if (jQuery('.vschc-response-card-entry').length < 1) {
                vschc_reset_response();
            }
        });
        CARD_BUTTONS.push( CLOSE_CARD_BTN );

        const BUTTON_LIST = jQuery('<div class="vschc-response-buttons" />');

        for (const CB of CARD_BUTTONS) {
            CB.appendTo( BUTTON_LIST );
        }

        BUTTON_LIST.appendTo( CARD_BODY );

        CARD_BODY.append( '<div class="clearfix" />' );            
    };
    
    if (!vschc_is_empty_str( responseData.error )) {
        INSERT_BUTTONS();

        const ALERT = jQuery('<div class="alert alert-danger" role="alert" />');
        ALERT.text( vschc_to_string(responseData.error) );        

        ALERT.appendTo( CARD_BODY );        
    } else {
        const RESPONSE = responseData.response;

        let contentDisplayer = false;
        let suggestedExtension = RESPONSE.suggestedExtension;

        // card buttons
        {
            if (!vschc_is_empty(RESPONSE.body)) {
                const SAVE_BTN = jQuery('<a class="btn btn-sm btn-primary vschc-save-response-btn" title="Save Content">' + 
                                        '<i class="fa fa-floppy-o" aria-hidden="true"></i>' + 
                                        '</a>');
                SAVE_BTN.on('click', function() {
                    vscode.postMessage({
                        command: 'saveContent',
                        data: {
                            data: RESPONSE.body,
                            suggestedExtension: suggestedExtension,
                        }
                    });
                });

                CARD_BUTTONS.push( SAVE_BTN );
            }

            const SAVE_RAW_RESP_BTN = jQuery('<a class="btn btn-sm btn-secondary vschc-save-raw-response-btn" title="Save Raw">' + 
                                             '<i class="fa fa-file-text" aria-hidden="true"></i>' + 
                                             '</a>');
            SAVE_RAW_RESP_BTN.on('click', () => {
                vscode.postMessage({
                    command: 'saveRawResponse',
                    data: RESPONSE
                });
            });
            CARD_BUTTONS.push( SAVE_RAW_RESP_BTN );

            const OPEN_RESPONSE_IN_EDITOR_BTN = jQuery('<a class="btn btn-sm btn-dark vschc-open-response-btn" title="Open Response In Editor">' + 
                                                       '<i class="fa fa-arrow-down" aria-hidden="true"></i>' + 
                                                       '</a>');
            OPEN_RESPONSE_IN_EDITOR_BTN.on('click', () => {
                vscode.postMessage({
                    command: 'openReponseInEditor',
                    data: RESPONSE
                });
            });
            CARD_BUTTONS.push( OPEN_RESPONSE_IN_EDITOR_BTN );

            const OPEN_REQUEST_IN_EDITOR_BTN = jQuery('<a class="btn btn-sm btn-dark vschc-open-request-btn" title="Open Request In Editor">' + 
                                                      '<i class="fa fa-arrow-up" aria-hidden="true"></i>' + 
                                                      '</a>');
            OPEN_REQUEST_IN_EDITOR_BTN.on('click', () => {
                vscode.postMessage({
                    command: 'openRequestInEditor',
                    data: RESPONSE
                });
            });
            CARD_BUTTONS.push( OPEN_REQUEST_IN_EDITOR_BTN );
        }

        INSERT_BUTTONS();

        let http = `HTTP/${ RESPONSE.httpVersion } ${ RESPONSE.code } ${ RESPONSE.status }\r\n`;

        let pre;

        const REFRESH_HTTP = () => {
            if (pre) {
                pre.remove();
            }
            
            pre = jQuery('<pre><code class="http" /></pre>');

            const CODE = pre.find('code');
            CODE.text(http);

            pre.appendTo( CARD_BODY );
            hljs.highlightBlock( CODE[0] );
        };

        if (RESPONSE.headers) {
            const MIME = vschc_get_content_type(RESPONSE.headers);
            if ('' !== MIME) {
                let jsonResp;
                try {
                    jsonResp = JSON.parse( atob( RESPONSE.body ) );
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

                        JSON_PRE.appendTo( CARD_BODY );
                        hljs.highlightBlock( JSON_CODE[0] );

                        suggestedExtension = 'json';
                    };
                } else if (vschc_is_mime(MIME, [ 'text/css' ])) {
                    contentDisplayer = () => {
                        const CSS = atob( RESPONSE.body );

                        const CSS_PRE = jQuery('<pre><code class="css" /></pre>');
                        const CSS_CODE = CSS_PRE.find('code');

                        CSS_CODE.text(CSS);

                        CSS_PRE.appendTo( CARD_BODY );
                        hljs.highlightBlock( CSS_CODE[0] );
                    };
                } else if (vschc_is_mime(MIME, [ 'text/html' ])) {
                    contentDisplayer = () => {
                        const HTML = atob( RESPONSE.body );

                        const HTML_PRE = jQuery('<pre><code class="html" /></pre>');
                        const HTML_CODE = HTML_PRE.find('code');

                        HTML_CODE.text(HTML);

                        HTML_PRE.appendTo( CARD_BODY );
                        hljs.highlightBlock( HTML_CODE[0] );
                    };
                } else if (vschc_is_mime(MIME, [ 'text/markdown' ])) {
                    contentDisplayer = () => {
                        const MD = atob( RESPONSE.body );

                        const MD_PRE = jQuery('<pre><code class="markdown" /></pre>');
                        const MD_CODE = MD_PRE.find('code');

                        MD_CODE.text(MD);

                        MD_PRE.appendTo( CARD_BODY );
                        hljs.highlightBlock( MD_CODE[0] );
                    };
                } else if (vschc_is_mime(MIME, [ 'text/xml' ])) {
                    contentDisplayer = () => {
                        const XML = atob( RESPONSE.body );

                        const XML_PRE = jQuery('<pre><code class="xml" /></pre>');
                        const XML_CODE = XML_PRE.find('code');

                        XML_CODE.text(XML);

                        XML_PRE.appendTo( CARD_BODY );
                        hljs.highlightBlock( XML_CODE[0] );
                    };
                } else if (vschc_is_mime(MIME, [ 'application/javascript', 'text/javascript' ])) {
                    contentDisplayer = () => {
                        const JS = atob( RESPONSE.body );

                        const JS_PRE = jQuery('<pre><code class="javascript" /></pre>');
                        const JS_CODE = JS_PRE.find('code');

                        JS_CODE.text(JS);

                        JS_PRE.appendTo( CARD_BODY );
                        hljs.highlightBlock( JS_CODE[0] );
                    };
                } else if (vschc_is_mime(MIME, [ 'application/x-yaml', 'text/yaml' ])) {
                    contentDisplayer = () => {
                        const YAML = atob( RESPONSE.body );

                        const YAML_PRE = jQuery('<pre><code class="yaml" /></pre>');
                        const YAML_CODE = YAML_PRE.find('code');

                        YAML_CODE.text(YAML);

                        YAML_PRE.appendTo( CARD_BODY );
                        hljs.highlightBlock( YAML_CODE[0] );
                    };
                } else if (MIME.startsWith('text/')) {
                    contentDisplayer = () => {
                        http += atob( RESPONSE.body );

                        REFRESH_HTTP();
                    };
                } else if (MIME.startsWith('image/')) {
                    contentDisplayer = () => {
                        const IMG = jQuery('<img />');
                        IMG.attr('src', `data:${ MIME };base64,${ RESPONSE.body.trim() }`);
                        IMG.addClass( 'img-fluid' );

                        IMG.appendTo( CARD_BODY );
                    };
                }
            }

            for (const H in RESPONSE.headers) {
                http += `${H}: ${ RESPONSE.headers[H] }\r\n`;
            }
        }
        
        http += "\r\n";
        
        REFRESH_HTTP();

        if (!vschc_is_empty(RESPONSE.body)) {
            if (contentDisplayer) {
                contentDisplayer();
            }
        }
    }

    return CARD;
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
}

function vschc_send_request() {
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
            data: vschc_prepare_request()
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
    window.addEventListener('message', (e) => {
        if (!e) {
            return;
        }

        const MSG = e.data;
        if (!MSG) {
            return;
        }

        switch (MSG.command) {
            case 'executeScriptCompleted':
                {
                    vschc_update_response_button_states(true);
                }
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

            case 'importRequestCompleted':
                {
                    const REQUEST = MSG.data;

                    let body    = REQUEST.body;
                    let headers = REQUEST.headers;
                    let method  = REQUEST.method;
                    let title   = REQUEST.title;
                    let url     = REQUEST.url;

                    if (vschc_is_empty_str(method)) {
                        method = 'GET';
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
                    jQuery('#vschc-input-method').val( ('' + method).toUpperCase().trim() );
                    jQuery('#vschc-input-title').val( '' + title )
                                                .trigger('change');

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

                    const NEW_RESPONSE_CARD = vschc_create_response_content(RESPONSE_DATA, () => {
                        if (onCardClosed) {
                            onCardClosed();
                        }
                    });

                    if (NEW_RESPONSE_CARD) {
                        let tab = CARD_BODY.find('#vschc-response-tab');
                        if (tab.length < 1) {
                            CARD_BODY.html('');

                            tab = jQuery('<div id="vschc-response-tab">' + 
                                         '<ul class="nav nav-tabs" id="vschc-response-tab-list" role="tablist" />' + 
                                         '<div class="tab-content" id="vschc-response-tab-content" />' + 
                                         '</div>');

                            tab.appendTo( CARD_BODY );
                        }

                        const EXISTING_TAB_PANES = tab.find('.tab-content .tab-pane');
                        EXISTING_TAB_PANES.each(function() {
                            const P = jQuery(this);

                            P.removeClass('active')
                             .removeClass('show');
                        });

                        const NEXT_ID = EXISTING_TAB_PANES.length;

                        const TAB_ITEM_ID = `vschc-response-tab-item-${NEXT_ID}`;
                        const TAB_PANE_ID = `vschc-response-tab-pane-${NEXT_ID}`;

                        const NEW_NAV_ITEM = jQuery('<li class="nav-item vschc-response-tab-item">' + 
                                                    `<a class="nav-link" id="${ TAB_ITEM_ID }" data-toggle="tab" href="#${ TAB_PANE_ID }" role="tab" aria-controls="${ TAB_PANE_ID }" aria-selected="true"><span class="vschc-title" /><span class="vschc-buttons" /></a>` + 
                                                    '</li>');
                        const NEW_NAV_ITEM_LINK = NEW_NAV_ITEM.find('a.nav-link');
                        NEW_NAV_ITEM_LINK.find('span.vschc-title').text(`Response #${NEXT_ID + 1}`);

                        const NEW_TAB_PANE = jQuery(`<div class="tab-pane vschc-response-tab-pane" id="${ TAB_PANE_ID }" role="tabpanel" aria-labelledby="${ TAB_ITEM_ID }" />`);
                        NEW_TAB_PANE.append( NEW_RESPONSE_CARD );

                        tab.find('.nav-tabs').prepend( NEW_NAV_ITEM );
                        tab.find('.tab-content').prepend( NEW_TAB_PANE );

                        NEW_NAV_ITEM.find('a').tab('show');

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

                    const SEND_BTN = jQuery('#vschc-send-request');
                    jQuery(document).scrollTop(
                        SEND_BTN.offset().top - SEND_BTN.outerHeight(true) - 24
                    );
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
