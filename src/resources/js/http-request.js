
let vschcNextHeaderRowId = -1;

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
            const NAME = NAME_FIELD.val();

            if (!NAME || '' === NAME.trim()) {
                if (!controlToFocus) {
                    controlToFocus = NAME_FIELD;
                }
            }            
        });
    }

    if (!controlToFocus) {
        const TABLE_BODY = TABLE.find('tbody');

        const ID = ++vschcNextHeaderRowId;

        const NEW_ROW = jQuery('<tr class="vschc-header-row">' + 
                            '<td class="vschc-name" />' + 
                            '<td class="vschc-value" />' + 
                            '<td class="vschc-actions" />' + 
                            '</tr>');
        NEW_ROW.attr('id', 'vschc-header-row-' + ID);

        const NAME_FIELD = jQuery('<input type="text" class="form-control" />');
        const VALUE_FIELD = jQuery('<input type="text" class="form-control" />');

        NAME_FIELD.on('keyup', function(e) {
            if (13 != e.which) {
                return;
            }
            
            e.preventDefault();

            let controlToFocus = false;

            const NAME = NAME_FIELD.val();
            if (NAME && '' !== NAME.trim()) {
                const VALUE = VALUE_FIELD.val();
                if (!VALUE || '' === VALUE.trim()) {
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

            const VALUE = VALUE_FIELD.val();
            if (VALUE && '' !== VALUE.trim()) {
                const NAME = NAME_FIELD.val();
                if (!NAME || '' === NAME.trim()) {
                    controlToFocus = NAME_FIELD;
                }
            }

            if (controlToFocus) {
                controlToFocus.focus();
            } else {
                vschc_add_header_row();
            }
        });
        VALUE_FIELD.appendTo( NEW_ROW.find('.vschc-value') );

        const REMOVE_BTN = jQuery('<a class="btn btn-sm btn-warning align-middle vschc-remove-btn" title="Remove Header">' + 
                                '<i class="fa fa-trash" aria-hidden="true"></i>' + 
                                '</a>');
        REMOVE_BTN.on('click', function() {
            NEW_ROW.remove();

            vschc_update_header_area();
        });
        REMOVE_BTN.appendTo( NEW_ROW.find('.vschc-actions') );

        if (arguments.length > 0) {
            NAME_FIELD.val( name );
            VALUE_FIELD.val( value );
        }

        NEW_ROW.appendTo( TABLE_BODY );

        controlToFocus = NAME_FIELD;
    }

    if (controlToFocus) {
        controlToFocus.focus();
    }
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
    const TITLE_FIELD = jQuery('#vschc-input-title');

    let url = URL_FIELD.val();
    if (url) {
        url = url.trim();
    }

    const IS_FILE = jQuery('#vschc-input-body-file-col').is(':visible');

    return {
        body: {
            content: vschc_body_content(),
            file: IS_FILE ? jQuery('#vschc-body-file-path .vschc-path').text() : false,
            fileSize: IS_FILE ? parseInt(jQuery('#vschc-input-body-file-col .vschc-size').text()) : false
        },
        headers: vschc_get_headers(),
        method: METHOD_FIELD.val(),
        title: TITLE_FIELD.val(),
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

    const BODY_FILE_CONTENT_TO_DISPLAY = jQuery('#vschc-body-file-content-to-display');
    BODY_FILE_CONTENT_TO_DISPLAY.hide();
    BODY_FILE_CONTENT_TO_DISPLAY.html('');    
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

function vschc_reset_response() {
    jQuery('#vschc-save-raw-response-btn').hide();
    jQuery('#vschc-reset-response-btn').hide();

    jQuery('#vschc-response-card .card-body').text( 'No request started yet.' );
}

function vschc_send_request() {
    const BTN = jQuery('#vschc-send-request');

    const URL_FIELD = jQuery('#vschc-input-url');

    if (!URL_FIELD.val() || URL_FIELD.val().trim().length < 1) {
        URL_FIELD.focus();
    } else {
        BTN.addClass('disabled');

        jQuery('#vschc-save-raw-response-btn').hide();
        jQuery('#vschc-reset-response-btn').hide();

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

function vschc_set_body_content(content) {
    const BODY_TEXT = jQuery('#vschc-input-body-text');
    BODY_TEXT.val( content.data );
    
    vschc_reset_body_file();                    
    vschc_update_body_area();
}

function vschc_set_body_content_from_file(content) {
    let contentDisplayer;

    const BODY_FILE = jQuery('#vschc-input-body-file');
    const BODY_FILE_PATH = jQuery('#vschc-body-file-path');
    
    const BODY_FILE_CONTENT_TO_DISPLAY = jQuery('#vschc-body-file-content-to-display');
    BODY_FILE_CONTENT_TO_DISPLAY.hide();
    BODY_FILE_CONTENT_TO_DISPLAY.html('');

    if (content && content.data.length > 1) {
        BODY_FILE.val( content.data );

        BODY_FILE_PATH.find('.vschc-path').text( content.path );
        BODY_FILE_PATH.find('.vschc-size').text( `${ content.size }` );

        if (content.mime) {
            const MIME = ('' + content.mime).toLowerCase().trim();
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

function vschc_update_header_area() {
    const HEADERS_CARD = jQuery('#vschc-headers-card');
    const HEADERS_CARD_BODY = HEADERS_CARD.find('.card-body');

    if (HEADERS_CARD_BODY.find('table tbody tr.vschc-header-row').length < 1) {
        vschc_reset_headers();
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
            case 'findInitialControlToFocus':
                {
                    const URL_FIELD = jQuery('#vschc-input-url');

                    let controlToFocus = false;

                    if (!URL_FIELD.val() || '' === URL_FIELD.val().trim()) {
                        controlToFocus = URL_FIELD;
                    }

                    if (!controlToFocus) {
                        const HEADERS_CARD = jQuery('#vschc-headers-card');
                        const HEADERS_CARD_BODY = HEADERS_CARD.find('.card-body');

                        HEADERS_CARD_BODY.find('table tbody tr.vschc-header-row').each(function() {
                            const ROW = jQuery(this);

                            const NAME_FIELD = ROW.find('.vschc-name input');
                            const NAME = NAME_FIELD.val();

                            if (!NAME || '' === NAME.trim()) {
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

                    let body = REQUEST.body;
                    let headers = REQUEST.headers;
                    let method = REQUEST.method;
                    let title = REQUEST.title;
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
                                data: body.content
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

                    TITLE_FIELD.val( '' + MSG.data );
                    TITLE_FIELD.on('change', () => {
                        const NEW_VALUE = TITLE_FIELD.val();

                        vscode.postMessage({
                            command: 'titleUpdated',
                            data: TITLE_FIELD.val(),
                        });
                    });
                }                
                break;

            case 'resetAllHeadersCompleted':
                vschc_reset_headers();
                break;

            case 'resetResponseCompleted':
                vschc_reset_response();
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

                            const SAVE_BTN = jQuery('<a class="btn btn-primary" id="vschc-save-response-btn">' + 
                                                    '<i class="fa fa-floppy-o" aria-hidden="true"></i>' + 
                                                    '<span>Save Content</span>' + 
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

                            SAVE_BTN.appendTo( CARD_BODY );                                                           
                        }

                        jQuery('#vschc-save-raw-response-btn').off('click').on('click', function() {
                            vscode.postMessage({
                                command: 'saveRawResponse',
                                data: RESPONSE
                            });
                        }).show();                        
                    }

                    jQuery('#vschc-reset-response-btn').show();

                    const BTN = jQuery('#vschc-send-request');
                    BTN.removeClass('disabled');

                    jQuery('html,body').animate({
                        scrollTop: jQuery('#vschc-response-card').offset().top
                    }, 'slow');
                }
                break;

            case 'setBodyContent':
                vschc_set_body_content(MSG.data);
                break;

            case 'setBodyContentFromFile':
                vschc_set_body_content_from_file(MSG.data);
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

    jQuery('#vschc-reset-response-btn').on('click', function() {
        vscode.postMessage({
            command: 'resetResponse'
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
