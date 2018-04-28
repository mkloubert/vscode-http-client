
function vschc_reset_body_file() {
    const BODY_FILE = jQuery('#vschc-input-body-file');
    BODY_FILE.val( '' );
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
        if (!e) {
            return;
        }

        const MSG = e.data;
        if (!MSG) {
            return;
        }

        switch (MSG.command) {
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
                            const CONTENT_TYPE = RESPONSE.headers[ 'content-type' ];
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
                                        http += "\r\n";                                        
                                        http += atob( RESPONSE.body );

                                        REFRESH_HTTP();
                                    };
                                }
                            }

                            for (const H in RESPONSE.headers) {
                                http += `${H}: ${ RESPONSE.headers[H] }\r\n`;
                            }                            
                        }
                        
                        REFRESH_HTTP();

                        if (RESPONSE.body && RESPONSE.body.length > 0) {
                            if (contentDisplayer) {
                                contentDisplayer();
                            }

                            const SAVE_BTN = jQuery('<a class="btn btn-primary">Save</a>');
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
        const BTN = jQuery(this);

        const URL_FIELD = jQuery('#vschc-input-url');

        if (!URL_FIELD.val() || URL_FIELD.val().trim().length < 1) {
            URL_FIELD.focus();
        } else {
            BTN.addClass('disabled');

            const CARD = jQuery('#vschc-response-card');
            const CARD_BODY = CARD.find('.card-body');

            CARD_BODY.html('');
            {
                const AJAX_LOADER = jQuery('<img />');
                AJAX_LOADER.addClass('vschc-ajax-loader');
                AJAX_LOADER.attr('src', AJAX_LOADER_URL);

                AJAX_LOADER.appendTo( CARD_BODY );
            }

            const METHOD_FIELD = jQuery('#vschc-input-method');

            vscode.postMessage({
                command: 'sendRequest',
                data: {
                    method: METHOD_FIELD.val(),
                    url: URL_FIELD.val().trim()
                }
            });
        }
    });

    vschc_reset_body_file();
    vschc_update_body_area();
});

jQuery(() => {
    jQuery('#vschc-input-url').focus();
});
