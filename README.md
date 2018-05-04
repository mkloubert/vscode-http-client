# vscode-http-client

[![Share via Facebook](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Facebook.png)](https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&quote=Git%20Notify) [![Share via Twitter](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Twitter.png)](https://twitter.com/intent/tweet?source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&text=Git%20Notify:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&via=mjkloubert) [![Share via Google+](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Google+.png)](https://plus.google.com/share?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client) [![Share via Pinterest](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Pinterest.png)](http://pinterest.com/pin/create/button/?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&description=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Reddit](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Reddit.png)](http://www.reddit.com/submit?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&title=Git%20Notify) [![Share via LinkedIn](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/LinkedIn.png)](http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&title=Git%20Notify&summary=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.&source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client) [![Share via Wordpress](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Wordpress.png)](http://wordpress.com/press-this.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&quote=Git%20Notify&s=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Email](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Email.png)](mailto:?subject=Git%20Notify&body=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client)


[![Latest Release](https://vsmarketplacebadge.apphb.com/version-short/mkloubert.vscode-http-client.svg)](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-http-client)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/mkloubert.vscode-http-client.svg)](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-http-client)
[![Rating](https://vsmarketplacebadge.apphb.com/rating-short/mkloubert.vscode-http-client.svg)](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-http-client#review-details)

Simple way to do [HTTP requests](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol) in [Visual Studio Code](https://code.visualstudio.com/).

![Demo 1](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo1.gif)

## Table of contents

1. [Install](#install-)
2. [How to use](#how-to-use-)
   * [Settings](#settings-)
   * [How to execute](#how-to-execute-)
     * [Execute scripts](#execute-scripts-)
       * [Constants](#constants-)
         * [cancel](#cancel-)
         * [output](#output-)
         * [progress](#progress-)
       * [Functions](#functions-)
         * [alert](#alert-)
         * [from](#from-)
         * [guid](#guid-)
         * [new_request](#new_request-)
         * [now](#now-)
         * [sleep](#sleep-)
         * [uuid](#uuid-)
         * [utc](#utc-)
       * [Modules](#modules-)
3. [Syntaxes](#syntaxes-)
4. [Support and contribute](#support-and-contribute-)
5. [Related projects](#related-projects-)
   * [node-enumerable](#node-enumerable-)
   * [vscode-helpers](#vscode-helpers-)

## Install [[&uarr;](#table-of-contents)]

Launch VS Code Quick Open (`Ctrl + P`), paste the following command, and press enter:

```bash
ext install vscode-http-client
```

Or search for things like `vscode-http-client` in your editor.

## How to use [[&uarr;](#table-of-contents)]

### Settings [[&uarr;](#how-to-use-)]

Open (or create) your `settings.json` in your `.vscode` subfolder of your workspace or edit the global settings (`File >> Preferences >> Settings`).

Add a `http.client` section:

```json
{
    "http.client": {
    }
}
```

| Name | Description |
| ---- | --------- |
| `open` | An array of one or more paths to `.http-request` files, which should be opened on startup. |
| `openNewOnStartup` | `(true)`, if a new tab with an empty request should be opened on startup. Default: `(false)` |

### How to execute [[&uarr;](#how-to-use-)]

Press `F1` and enter one of the following commands:

| Name | Description | command |
| ---- | --------- | --------- |
| `HTTP Client: Create new script ...` | Opens a new editor with an example script. | `extension.http.client.newRequestScript` |
| `HTTP Client: New HTTP request ...` | Opens a new HTTP request form. | `extension.http.client.newRequest` |
| `HTTP Client: New HTTP request (split view)...` | Opens a new HTTP request form by splitting the current view. | `extension.http.client.newRequestSplitView` |
| `HTTP Client: Send editor content as HTTP request ...` | Uses the content of a visible editor as body for a HTTP request. | `extension.http.client.newRequestForEditor` |
| `HTTP Client: Send file as HTTP request ...` | Uses a (local) file as body for a HTTP request. | `extension.http.client.newRequestFromFile` |

There are currently no predefined key bindings for these commands, but you can setup them [by your own](https://code.visualstudio.com/docs/getstarted/keybindings).

#### Execute scripts [[&uarr;](#how-to-execute-)]

For things, like batch operations, you can execute scripts, using the [Node.js API](https://nodejs.org/en/), which is provided by VS Code.

![Demo 2](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo2.gif)

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

    try {
        const U = USERS[i];

        const REQUEST = new_request();

        // do not show any result
        // in the GUI
        // this is good, if you do many requests
        REQUEST.noResult(true);

        REQUEST.param('user', U.id)  // set / overwrite an URL / query parameter           
               .header('X-User-Name', U.name)  // set / overwrite a request header
               .header('X-Date', CURRENT_TIME)  // automatically converts to ISO-8601
               .header('X-Session', SESSION_ID)
               .body( await $fs.readFile('/path/to/bodies/user_' + U.id + '.json') );  // set / overwrite body

        // you can also use one of the upper setters
        // as getters
        if ('MK' === REQUEST.header('X-User-Name')) {
            REQUEST.param('debug', 'true');
        }

        output.append(`Sending request for '${ U }' ... `);

        await REQUEST.send();

        output.appendLine(`[OK]`);
    } catch (e) {
        output.appendLine(`[ERROR: '${ $h.toStringSafe(e) }']`);
    }
}
```

##### Constants [[&uarr;](#execute-scripts-)]

###### cancel [[&uarr;](#constants-)]

Provides the underlying [CancellationToken](https://code.visualstudio.com/docs/extensionAPI/vscode-api#CancellationToken) object.

```javascript
const USER_IDS = [1, 2, 3];

for (let i = 0; i < USER_IDS.length; i++) {
    if (cancel.isCancellationRequested) {
        break;  // user wants to cancel
    }

    // TODO
}
```

###### output [[&uarr;](#constants-)]

Provides the [OutputChannel](https://code.visualstudio.com/docs/extensionAPI/vscode-api#OutputChannel) of the extension.

```javascript
output.show();

output.append('Hello');
output.appendLine(', TM!');

output.hide();
```

###### progress [[&uarr;](#constants-)]

Stores the underlying [Progress](https://code.visualstudio.com/docs/extensionAPI/vscode-api#_a-nameprogressaspan-classcodeitem-id1166progresslttgtspan) object, provided by [withProgress()](https://code.visualstudio.com/docs/extensionAPI/vscode-api) function.

```javascript
const USER_IDS = [1, 2, 3];

for (let i = 0; i < USER_IDS.length; i++) {
    const UID = USER_IDS[i];

    progress.report({
        message: `Executing code for user ${ i + 1 } (ID ${ USER_ID }) of ${ USERS.length } ...`,
        increment: 1.0 / USERS.length * 100.0
    });

    // TODO
}
```

##### Functions [[&uarr;](#execute-scripts-)]

###### alert [[&uarr;](#functions-)]

Shows a (wanring) popup.

```javascript
alert('Hello!');

// with custom buttons
switch (await alert('Sure?', 'NO!', 'Yes')) {
    case 'NO!':
        console.log('User is UN-SURE!');
        break;

    case 'Yes':
        console.log('User is sure.');
        break;
}
```

###### from [[&uarr;](#functions-)]

Creates a new [LINQ style](https://en.wikipedia.org/wiki/Language_Integrated_Query) iterator for any iterable object, like arrays, generators or strings. For more information, s. [node-enumerable](https://github.com/mkloubert/node-enumerable).

```javascript
const SEQUENCE     = from([1, '2', null, 3, 4, undefined, '5']);
const SUB_SEQUENCE = SEQUENCE.where(x => !_.isNil(x))  // 1, '2', 3, 4, '5'
                             .ofType('string');  // '2', '5'

for (const ITEM of SUB_SEQUENCE) {
    // TODO
}
```

###### guid [[&uarr;](#functions-)]

Generates a new unique ID, using [node-uuid](https://github.com/kelektiv/node-uuid).

```javascript
// v1
const GUID_v1_2 = guid('1');
const GUID_v1_2 = guid('v1');

// v4
const GUID_v4_1 = guid();
const GUID_v4_2 = guid('4');
const GUID_v4_2 = guid('v4');

// v5
const GUID_v5_2 = guid('5');
const GUID_v5_2 = guid('v5');
```

###### new_request [[&uarr;](#functions-)]

Creates a new instance of a [HTTP client](https://mkloubert.github.io/vscode-http-client/classes/_http_.httpclient.html), by using the data of the current request form. All important data, like URL, headers or body can be overwritten.

```javascript
const REQUEST = new new_request();

REQUEST.param('user', 5979)  // set / overwrite an URL / query parameter
       .header('X-My-Header', 'TM')  // set / overwrite a request header
       .body( await $fs.readFile('/path/to/body') );  // set / overwrite body

await REQUEST.send();
```

###### now [[&uarr;](#functions-)]

Returns a new instance of a [Moment.js](https://momentjs.com/) object, by using an optional parameter for the [timezone](https://momentjs.com/timezone/).

```javascript
const CURRENT_TIME = now();
console.log( CURRENT_TIME.format('YYYY-MM-DD HH:mm:ss') );

// with timezone
const CURRENT_TIME_WITH_TIMEZONE = now('Europe/Berlin');
console.log( CURRENT_TIME_WITH_TIMEZONE.format('DD.MM.YYYY HH:mm') );
```

###### sleep [[&uarr;](#functions-)]

Waits a number of seconds before continue.

```javascript
await sleep();  // 1 second

await sleep(2.5);  // 2.5 seconds
```

###### uuid [[&uarr;](#functions-)]

Alias for [guid()](#guid-).

###### utc [[&uarr;](#functions-)]

Returns a new instance of a [Moment.js](https://momentjs.com/) object in [UTC]().

```javascript
const UTC_NOW = utc();

console.log( UTC_NOW.format('YYYY-MM-DD HH:mm:ss') );
```

##### Modules [[&uarr;](#execute-scripts-)]

| Constant | Name | Description |
| ---- | --------- | --------- |
| `_` | [lodash](https://lodash.com/) | A modern JavaScript utility library delivering modularity, performance and extras. |
| `$fs` | [fs-extra](https://github.com/jprichardson/node-fs-extra) | Extensions for the [Node.js file system module](https://nodejs.org/api/fs.html), especially for use in [async Promise](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Promise) context. |
| `$h` | [vscode-helpers](https://github.com/mkloubert/vscode-helpers) | A lot of helpers classes and functions. |
| `$linq` | [node-enumerable](https://github.com/mkloubert/node-enumerable) | Provides [LINQ-style](https://en.wikipedia.org/wiki/Language_Integrated_Query) functions and classes. |
| `$moment` | [Moment.js](https://momentjs.com/) | Parse, validate, manipulate, and display dates and times in JavaScript. [moment-timezone](https://momentjs.com/timezone/) is already provided. |
| `$vs` | [Visual Studio Code](https://code.visualstudio.com/docs/extensionAPI/vscode-api) | VS Code API. |

You also can include any module, shipped with VS Code, [Node.js](https://nodejs.org/api/modules.html), [that extension](https://github.com/mkloubert/vscode-http-client/blob/master/package.json) or any external script, which is available on your current system, by using the `require()` function.

## Syntaxes [[&uarr;](#table-of-contents)]

[Syntax highlighting](https://highlightjs.org/) is supported for the following languages:

* CSS
* HTML
* HTTP
* JavaScript
* JSON
* Markdown
* XML
* YAML

## Support and contribute [[&uarr;](#table-of-contents)]

If you like the extension, you can support the project by sending a [donation via PayPal](https://paypal.me/MarcelKloubert) to [me](https://github.com/mkloubert).

To contribute, you can [open an issue](https://github.com/mkloubert/vscode-http-client/issues) and/or fork this repository.

To work with the code:

* clone [this repository](https://github.com/mkloubert/vscode-http-client)
* create and change to a new branch, like `git checkout -b my_new_feature`
* run `npm install` from your project folder
* open that project folder in Visual Studio Code
* now you can edit and debug there
* commit your changes to your new branch and sync it with your forked GitHub repo
* make a [pull request](https://github.com/mkloubert/vscode-http-client/pulls)

## Related projects [[&uarr;](#table-of-contents)]

### node-enumerable [[&uarr;](#related-projects-)]

[node-enumerable](https://github.com/mkloubert/node-enumerable) is a [LINQ](https://en.wikipedia.org/wiki/Language_Integrated_Query) implementation for JavaScript, which runs in [Node.js](https://nodejs.org/) and browsers.

### vscode-helpers [[&uarr;](#related-projects-)]

[vscode-helpers](https://github.com/mkloubert/vscode-helpers) is a NPM module, which you can use in your own [VSCode extension](https://code.visualstudio.com/docs/extensions/overview) and contains a lot of helpful classes and functions.
