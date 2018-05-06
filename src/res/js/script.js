
function vschc_as_array(val) {
    if (!Array.isArray(val)) {
        val = [ val ];
    }

    return val;
}

function vschc_is_empty(val) {
    return !val || !val.length;
}

function vschc_is_empty_str(val) {
    return '' === vschc_normalize_str(val);
}

function vschc_is_nil(val) {
    return null === val ||
           'undefined' === typeof val;
}

function vschc_is_mime(mime, list) {
    mime = vschc_normalize_str(mime).split(';')[0].trim();
    list = vschc_as_array(list);

    for (const ITEM of list) {
        if (vschc_normalize_str(ITEM) === mime) {
            return true;
        }
    }

    return false;
}

function vschc_get_content_type(headers) {
    if (headers) {
        for (const H in headers) {
            if ('content-type' === vschc_normalize_str(H)) {
                return vschc_normalize_str( headers[H] ).split(';')[0].trim();
            }
        }
    }
}

function vschc_post(command, data) {
    vscode.postMessage({
        command: vschc_to_string(command),
        data: data
    });
}

function vschc_normalize_str(val) {
    return vschc_to_string(val).toLowerCase().trim();
}

function vschc_to_string(val) {
    if ('string' === typeof val) {
        return val;
    }

    if (vschc_is_nil(val)) {
        return '';
    }

    try {
        if (val instanceof Error) {
            let errName = '';
            try {
                if (val.constructor) {
                    errName = val.constructor.name;
                }

                if (errName) {
                    errName = ` ('${ errName }')`;
                }
            } catch (e) {
                errName = '';
            }
    
            return `ERROR${ errName }: ${ val.message }
    
${ val.stack }`;
        }
    } catch (e) { }

    try {
        if ('function' === typeof val['toString']) {
            return '' + val.toString();
        }
    } catch (e) { }

    try {
        if (Array.isArray(val) || ('object' === typeof val)) {
            return JSON.stringify(val);
        }
    } catch (e) { }

    try {
        return '' + val;
    } catch (e) { }

    return '';
}
