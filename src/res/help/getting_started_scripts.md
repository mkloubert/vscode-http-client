
# Getting Started

For things, like batch operations, you can execute scripts, using the [Node.js API](https://nodejs.org/en/), which is provided by VS Code.

```javascript
const USERS = [{
    id: 5979,
    name: 'TM'
}, {
    id: 23979,
    name: 'MK'
}];

const SESSION_ID = uuid();
const CURRENT_TIME = utc();

// show output channel
output.show();

for (let i = 0; i < USERS.length; i++) {
    if (cancel.isCancellationRequested) {
        break;  // user wants to cancel
    }
    
    const U = USERS[i];

    try {        
        output.append(`Sending request for '${ U }' ... `);

        const REQUEST = new_request();

        // do not show any result
        // in the GUI
        // this is good, if you do many requests
        REQUEST.noResult(true);

        REQUEST.param('user', U.id)  // set / overwrite an URL / query parameter           
               .header('X-User-Name', U.name)  // set / overwrite a request header
               .header('X-Date', CURRENT_TIME)  // automatically converts to ISO-8601
               .body( await $fs.readFile('/path/to/bodies/user_' + U.id + '.json') );  // set / overwrite body

        // simple alternative to submit
        // "basic auth" header
        // 
        // username and password MUST be separated by ':'
        REQUEST.header('Authorization',
                       'Basic mkloubert:P@ssword123!');

        // you can also use one of the upper setters
        // as getters
        if ('MK' === REQUEST.header('X-User-Name')) {
            REQUEST.param('debug', 'true');
        }

        await REQUEST.send();

        output.appendLine(`[OK]`);
    } catch (e) {
        output.appendLine(`[ERROR: '${ $h.toStringSafe(e) }']`);
    }
}
```
