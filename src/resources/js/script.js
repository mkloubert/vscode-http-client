
let vschcNextHeaderRowId = -1;

function vschc_add_header_row(name, value) {
    const CARD = jQuery('#vschc-headers-card');
    const CARD_BODY = CARD.find('.card-body');

    const TABLE = CARD_BODY.find('table');
    if (TABLE.length < 1) {
        return;
    }

    const TABLE_BODY = TABLE.find('tbody');

    const ID = ++vschcNextHeaderRowId;

    const NEW_ROW = jQuery('<tr class="vschc-header-row">' + 
                           '<td class="vschc-name" />' + 
                           '<td class="vschc-value" />' + 
                           '<td class="vschc-actions" />' + 
                           '</tr>');
    NEW_ROW.attr('id', 'vschc-header-row-' + ID);

    const NAME_FIELD = jQuery('<input type="text" class="form-control" />');
    NAME_FIELD.appendTo( NEW_ROW.find('.vschc-name') );
    
    const VALUE_FIELD = jQuery('<input type="text" class="form-control" />');
    VALUE_FIELD.appendTo( NEW_ROW.find('.vschc-value') );

    const REMOVE_BTN = jQuery('<a class="btn btn-sm btn-danger align-middle vschc-remove-btn" />').text('-');
    REMOVE_BTN.on('click', function() {
        NEW_ROW.remove();

        if (TABLE_BODY.find('.vschc-header-row').length < 1) {
            vschc_reset_headers();
        }
    });
    REMOVE_BTN.appendTo( NEW_ROW.find('.vschc-actions') );

    const ADD_BTN = jQuery('<a class="btn btn-sm btn-primary align-middle vschc-add-btn" />').text('+');
    ADD_BTN.on('click', function() {
        vschc_add_header_row();
    });
    ADD_BTN.appendTo( NEW_ROW.find('.vschc-actions') );

    if (arguments.length > 0) {
        NAME_FIELD.val( name );
        VALUE_FIELD.val( value );
    }

    NEW_ROW.appendTo( TABLE_BODY );
}

function vschc_auto_add_content_type_header(mime) {
    if (!mime) {
        return;
    }

    mime = ('' + mime).toLowerCase().trim();

    let addContentType = true;

    const HEADERS_CARD = jQuery('#vschc-headers-card');
    const HEADERS_CARD_BODY = HEADERS_CARD.find('.card-body');

    HEADERS_CARD_BODY.find('table tbody tr.vschc-header-row').each(function() {
        const ROW = jQuery(this);

        const NAME = ROW.find('.vschc-name input').val();
        if (NAME) {
            if ('content-type' === NAME.toLowerCase().trim()) {
                addContentType = false;
            }
        }
    });

    if (addContentType) {
        vschc_add_header_row( 'Content-type', mime );

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

function vschc_get_headers() {
    const HEADERS = {};

    const HEADERS_CARD = jQuery('#vschc-headers-card');
    const HEADERS_CARD_BODY = HEADERS_CARD.find('.card-body');

    HEADERS_CARD_BODY.find('table tbody tr.vschc-header-row').each(function() {
        const ROW = jQuery(this);

        const NAME = ROW.find('.vschc-name input').val();
        if (NAME) {
            HEADERS[ ('' + NAME).trim() ] = ROW.find('.vschc-value input').val();
        }
    });

    return HEADERS;
}

function vschc_prepare_request() {
    const URL_FIELD = jQuery('#vschc-input-url');
    const METHOD_FIELD = jQuery('#vschc-input-method');

    let url = URL_FIELD.val();
    if (url) {
        url = url.trim();
    }

    return {
        body: {
            content: vschc_body_content()
        },
        headers: vschc_get_headers(),
        method: METHOD_FIELD.val(),
        url: url
    };
}

function vschc_remove_empty_headers() {
    const HEADERS_CARD = jQuery('#vschc-headers-card');
    const HEADERS_CARD_BODY = HEADERS_CARD.find('.card-body');

    HEADERS_CARD_BODY.find('table tbody tr.vschc-header-row').each(function() {
        const ROW = jQuery(this);

        const NAME = ROW.find('.vschc-name input').val();
        if (!NAME) {
            ROW.remove();
        }
    });
}

function vschc_reset_body_file() {
    const BODY_FILE = jQuery('#vschc-input-body-file');
    BODY_FILE.val( '' );
}

function vschc_reset_headers() {
    const CARD = jQuery('#vschc-headers-card');
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

function vschc_send_request() {
    const BTN = jQuery('#vschc-send-request');

    const URL_FIELD = jQuery('#vschc-input-url');

    if (!URL_FIELD.val() || URL_FIELD.val().trim().length < 1) {
        URL_FIELD.focus();
    } else {
        BTN.addClass('disabled');

        jQuery('#vschc-save-raw-response-btn').hide();

        const CARD = jQuery('#vschc-response-card');
        const CARD_BODY = CARD.find('.card-body');

        CARD_BODY.html('');
        {
            const AJAX_LOADER = jQuery('<img />');
            AJAX_LOADER.addClass('vschc-ajax-loader');
            AJAX_LOADER.attr('src', AJAX_LOADER_URL);

            AJAX_LOADER.appendTo( CARD_BODY );
        }

        vscode.postMessage({
            command: 'sendRequest',
            data: vschc_prepare_request()
        });
    }
}

function vschc_update_body_area() {
    const COL_BODY_TEXT = jQuery('#vschc-input-body-text-col');
    const COL_FILE_TEXT = jQuery('#vschc-input-body-file-col');
    const COL_FROM_FILE = jQuery('#vschc-btn-from-file-col');
    
    const BODY_FILE = jQuery('#vschc-input-body-file');
    const BODY_FILE_VAL = BODY_FILE.val();

    if (BODY_FILE_VAL && BODY_FILE_VAL.length > 0) {
        COL_FILE_TEXT.show();

        COL_BODY_TEXT.hide();
        COL_FROM_FILE.hide();
    } else {
        COL_FILE_TEXT.hide();

        COL_BODY_TEXT.show();
        COL_FROM_FILE.show();
    }
}

jQuery(() => {
    window.addEventListener('message', (e) => {
        vschc_log('Message: ' + JSON.stringify(e));

        if (!e) {
            return;
        }

        const MSG = e.data;
        if (!MSG) {
            return;
        }

        switch (MSG.command) {
            case 'importRequestCompleted':
                {
                    const REQUEST = MSG.data;

                    let headers = REQUEST.headers;
                    let method = REQUEST.method;
                    let url = REQUEST.url;

                    if (!method) {
                        method = 'GET';
                    }
                    if (!url) {
                        url = '';
                    }

                    if (!headers) {
                        headers = {};
                    }
                    {
                        const HEADERS_CARD = jQuery('#vschc-headers-card');
                        const HEADERS_CARD_BODY = HEADERS_CARD.find('.card-body');

                        HEADERS_CARD_BODY.find('table tbody tr.vschc-header-row').remove();

                        for (const H in headers) {
                            const NAME = '' + H;
                            if ('' !== NAME.trim()) {
                                vschc_add_header_row(NAME, headers[H]);
                            }
                        }
                    }

                    jQuery('#vschc-input-url').val( '' + url );
                    jQuery('#vschc-input-method').val( ('' + method).toUpperCase().trim() );

                    vschc_reset_body_file();
                    jQuery('#vschc-input-body-text').val('');

                    vschc_update_body_area();
                }
                break;

            case 'sendRequestCompleted':
                {
                    const RESPONSE_DATA = MSG.data;

                    const CARD = jQuery('#vschc-response-card');
                    const CARD_BODY = CARD.find('.card-body');

                    CARD_BODY.html('');

                    if ('' !== RESPONSE_DATA.error) {
                        const ALERT = jQuery('<div class="alert alert-danger" role="alert" />');
                        ALERT.text( RESPONSE_DATA.error );

                        ALERT.appendTo( CARD_BODY );
                    } else {
                        const RESPONSE = RESPONSE_DATA.response;

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
                        
                        let contentDisplayer = false;
                        let suggestedExtension = RESPONSE.suggestedExtension;

                        if (RESPONSE.headers) {
                            const CONTENT_TYPE = RESPONSE.headers[ 'Content-Type' ];
                            if (CONTENT_TYPE) {
                                const MIME = CONTENT_TYPE.toLowerCase().trim();

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
                                }
                                else if (MIME.startsWith('text/html')) {
                                    contentDisplayer = () => {
                                        const HTML = atob( RESPONSE.body );

                                        const HTML_PRE = jQuery('<pre><code class="html" /></pre>');
                                        const HTML_CODE = HTML_PRE.find('code');

                                        HTML_CODE.text(HTML);

                                        HTML_PRE.appendTo( CARD_BODY );
                                        hljs.highlightBlock( HTML_CODE[0] );
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

                        if (RESPONSE.body && RESPONSE.body.length > 0) {
                            if (contentDisplayer) {
                                contentDisplayer();
                            }

                            CARD_BODY.append( '<div class="clearfix" />' );

                            const SAVE_BTN = jQuery('<a class="btn btn-primary" id="vschc-save-response-btn">Save content</a>');
                            SAVE_BTN.on('click', function() {
                                vscode.postMessage({
                                    command: 'saveContent',
                                    data: {
                                        data: RESPONSE.body,
                                        suggestedExtension: suggestedExtension,
                                    }
                                });
                            });

                            SAVE_BTN.appendTo( CARD_BODY );                                                           
                        }

                        jQuery('#vschc-save-raw-response-btn').off('click').on('click', function() {
                            vscode.postMessage({
                                command: 'saveRawResponse',
                                data: RESPONSE
                            });
                        }).show();
                    }                    

                    const BTN = jQuery('#vschc-send-request');
                    BTN.removeClass('disabled');

                    jQuery('html,body').animate({
                        scrollTop: jQuery('#vschc-response-card').offset().top
                    }, 'slow');
                }
                break;

            case 'setBodyContent':
                {
                    const CONTENT = MSG.data;

                    const BODY_TEXT = jQuery('#vschc-input-body-text');
                    BODY_TEXT.val( CONTENT.data );
                    
                    vschc_reset_body_file();                    
                    vschc_update_body_area();
                }
                break;

            case 'setBodyContentFromFile':
                {
                    const CONTENT = MSG.data;

                    const BODY_FILE = jQuery('#vschc-input-body-file');
                    const BODY_FILE_PATH = jQuery('#vschc-body-file-path');
                    if (CONTENT && CONTENT.data.length > 1) {
                        BODY_FILE.val( CONTENT.data );

                        BODY_FILE_PATH.find('.vschc-path').text( CONTENT.path );
                        BODY_FILE_PATH.find('.vschc-size').text( `(${ CONTENT.size })` );
                    } else {
                        vschc_reset_body_file();
                    }

                    vschc_update_body_area();
                    
                    vschc_auto_add_content_type_header( CONTENT.mime );
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
});

jQuery(() => {
    vschc_reset_body_file();
    vschc_update_body_area();
    vschc_reset_headers();
});

jQuery(() => {
    jQuery('#vschc-input-url').focus();
});

jQuery(() => {
    vscode.postMessage({
        command: 'onLoaded'            
    });
});
