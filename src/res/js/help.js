
function vschc_request_constant(name) {
    const SELECT = jQuery('#vschc-constants-select');
    SELECT.prop('disabled', true);

    const CONTENT = jQuery('#vschc-constants .vschc-content');
    CONTENT.html('');

    const LOADER = jQuery('<img />');
    LOADER.addClass('vschc-ajax-loader');
    LOADER.attr('src', AJAX_LOADER_URL);

    LOADER.appendTo( CONTENT );

    vschc_post('requestConstant',
               name);
}

function vschc_request_function(name) {
    const SELECT = jQuery('#vschc-functions-select');
    SELECT.prop('disabled', true);

    const CONTENT = jQuery('#vschc-functions .vschc-content');
    CONTENT.html('');

    const LOADER = jQuery('<img />');
    LOADER.addClass('vschc-ajax-loader');
    LOADER.attr('src', AJAX_LOADER_URL);

    LOADER.appendTo( CONTENT );

    vschc_post('requestFunction',
               name);
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
            case 'requestConstantCompleted':
                {
                    const SELECT = jQuery('#vschc-constants-select');

                    const CONTENT = jQuery('#vschc-constants .vschc-content');
                    CONTENT.html('');

                    let newContent = false;
                    let contentPreparer;

                    try {
                        const RESULT = MSG.data;
                        if (RESULT) {
                            if (false !== RESULT.content) {
                                newContent = vschc_from_markdown( RESULT.content );

                                contentPreparer = () => {
                                    vschc_apply_highlight( CONTENT );
                                };
                            } else {
                                newContent = jQuery('<div class="alert alert-danger" role="alert" />');
                                newContent.text('Not found!');
                            }
                        }
                    } finally {
                        if (false !== newContent) {
                            CONTENT.append( newContent );
                        }

                        if (contentPreparer) {
                            contentPreparer();
                        }

                        SELECT.prop('disabled', false);                
                    }
                }
                break;

            case 'requestFunctionCompleted':
                {
                    const SELECT = jQuery('#vschc-functions-select');

                    const CONTENT = jQuery('#vschc-functions .vschc-content');
                    CONTENT.html('');

                    let newContent = false;
                    let contentPreparer;

                    try {
                        const RESULT = MSG.data;
                        if (RESULT) {
                            if (false !== RESULT.content) {
                                newContent = vschc_from_markdown( RESULT.content );

                                contentPreparer = () => {
                                    vschc_apply_highlight( CONTENT );
                                };
                            } else {
                                newContent = jQuery('<div class="alert alert-danger" role="alert" />');
                                newContent.text('Not found!');
                            }
                        }
                    } finally {
                        if (false !== newContent) {
                            CONTENT.append( newContent );
                        }

                        if (contentPreparer) {
                            contentPreparer();
                        }

                        SELECT.prop('disabled', false);                
                    }
                }
                break;

            case 'updateTOC':
                {
                    const TOC = MSG.data;

                    const SELECTS = [
                        'constants',
                        'functions'
                    ];

                    for (const ID of SELECTS) {
                        const ELEMENT_ID = `vschc-${ID}-select`;

                        while (jQuery(`#${ELEMENT_ID}`).length > 1) {
                            jQuery(`#${ELEMENT_ID}`)[1].remove();
                        }

                        if (TOC) {
                            const LIST = TOC[ID];
                            if (LIST) {
                                for (const ITEM of LIST) {
                                    const NEW_OPTION = jQuery('<option />');
                                    NEW_OPTION.attr('value', ITEM);
                                    NEW_OPTION.text(ITEM);

                                    jQuery(`#${ELEMENT_ID}`).append( NEW_OPTION );
                                }
                            }
                        }

                        jQuery(`#vschc-${ID} .vschc-content`).html('');
                    }

                    const CONTENTS = [
                        'getting-started',
                        'modules'
                    ];
                    for (const ID of CONTENTS) { 
                        const OTHER_CONTENT = jQuery(`#vschc-${ ID }`);
                        OTHER_CONTENT.html('');

                        const C = TOC[ ID ];
                        if (false !== C) {
                            OTHER_CONTENT.append(
                                vschc_from_markdown( C )
                            );

                            vschc_apply_highlight( OTHER_CONTENT );                            
                        }
                    }
                }
                break;
        }
    });
});

jQuery(() => {
    jQuery('#vschc-constants-select').on('change', function() {
        const SELECT = jQuery(this);

        const NAME = vschc_normalize_str( SELECT.val() );
        if ('' === NAME) {
            return;
        }

        vschc_request_constant( NAME );
    });

    jQuery('#vschc-functions-select').on('change', function() {
        const SELECT = jQuery(this);

        const NAME = vschc_normalize_str( SELECT.val() );
        if ('' === NAME) {
            return;
        }

        vschc_request_function( NAME );
    });
});

jQuery(() => {
    vschc_post('onLoaded');
});
