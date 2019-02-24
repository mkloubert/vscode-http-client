# Change Log (vscode-http-client)

[![Share via Facebook](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Facebook.png)](https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&quote=HTTP%20Client) [![Share via Twitter](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Twitter.png)](https://twitter.com/intent/tweet?source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&text=HTTP%20Client:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&via=mjkloubert) [![Share via Google+](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Google+.png)](https://plus.google.com/share?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client) [![Share via Pinterest](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Pinterest.png)](http://pinterest.com/pin/create/button/?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&description=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Reddit](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Reddit.png)](http://www.reddit.com/submit?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&title=HTTP%20Client) [![Share via LinkedIn](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/LinkedIn.png)](http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&title=HTTP%20Client&summary=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.&source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client) [![Share via Wordpress](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Wordpress.png)](http://wordpress.com/press-this.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&quote=HTTP%20Client&s=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Email](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Email.png)](mailto:?subject=HTTP%20Client&body=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client)

## 0.34.0 (February 24th, 2019; Visual Studio Code 1.31)

* extension requires at least [Visual Studio Code 1.31](https://code.visualstudio.com/updates/v1_31) now
* updated the following [npm](https://www.npmjs.com/) modules:
  * [fs-extra](https://www.npmjs.com/package/fs-extra) `^7.0.1`
  * [lodash](https://www.npmjs.com/package/lodash) `^4.17.11`
  * [marked](https://www.npmjs.com/package/marked) `^0.6.1`
  * [merge-deep](https://www.npmjs.com/package/merge-deep) `^3.0.2`
  * [mime-types](https://www.npmjs.com/package/mime-types) `^2.1.22`
  * [moment](https://www.npmjs.com/package/moment) `^2.24.0`
  * [moment-timezone](https://www.npmjs.com/package/moment-timezone) `^0.5.23`
  * [node-enumerable](https://www.npmjs.com/package/node-enumerable) `^4.0.2`
  * [vscode-helpers](https://www.npmjs.com/package/vscode-helpers) `^4.0.1`

## 0.33.0 (June 8th, 2018; npm updates)

* updated the following [npm](https://www.npmjs.com/) modules:
  * [moment](https://www.npmjs.com/package/moment) `^2.22.2`
  * [moment-timezone](https://www.npmjs.com/package/moment-timezone) `^0.5.21`
  * [uuid](https://www.npmjs.com/package/uuid) `^3.3.2`
  * [vscode-helpers](https://www.npmjs.com/package/vscode-helpers) `^2.10.3`
* bugfixes and typo fixes
* code cleanups and improvements

## 0.32.1 (May 17th, 2018; fixes)

* fixed clicking on links inside a webview (s. upper-right buttons)

## 0.31.1 (May 14th, 2018; npm updates)

* updated the following [npm](https://www.npmjs.com/) modules:
  * [moment-timezone](https://www.npmjs.com/package/moment-timezone) `^0.5.17`

## 0.30.0 (May 11th, 2018; auto request headers)

* can generate `Content-MD5` and `Content-Length` from current body now:

![Demo 10](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo10.gif)

* `Content-Length` header is automatically added now, when setting up request body from file
* added `Open 'custom.css' ...` (`extension.http.client.openCustomCSS`) command, which opens `custom.css` in a new editor
* bugfixes
* updated [npm](https://www.npmjs.com/) modules:
  * [vscode-helpers](https://www.npmjs.com/package/vscode-helpers) `^2.2.0`

## 0.29.0 (May 10th, 2018; import HTTP files)

* can import HTTP files into request form now

![Demo 9](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo9.png)

* now setting `rejectUnauthorized` option for secure HTTP requests to `(false)` by default (you can use the new extension setting `rejectUnauthorized` to control this), s. [issue #1](https://github.com/mkloubert/vscode-http-client/issues/1)
* updated script examples
* updated [npm](https://www.npmjs.com/) modules:
  * [vscode-helpers](https://www.npmjs.com/package/vscode-helpers) `^2.1.1`

## 0.28.0 (May 9th, 2018; import header list)

* implemeted simple way to import a list of request headers:

![Demo 8](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo8.gif)

* GUI improvements

## 0.27.1 (May 8th, 2018; edit URL parameters)

* can simply edit URL parameters now

![Demo 7](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo7.gif)

## 0.26.0 (May 8th, 2018; help)

* can open help tab via `HTTP Client: Show help ...` command now

![Demo 6](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo6.gif)

* documentation fixes

## 0.25.0 (May 6th, 2018; redo specific requests)

* can redo specific requests now:

![Demo 5](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo5.png)

* bugfixes and improvements

## 0.24.0 (May 6th, 2018; scripts and styles)

* can clone settings to a new tab now:

![Demo 4](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo4.png)

* added 20 styles by [Bootswatch](https://bootswatch.com/), which can be selected by using `HTTP Client: Change style ...` command
* can define custom CSS file (`custom.css`) inside `.vscode-http-client` sub folder of user's home directory
* updated [highlight.js](https://highlightjs.org/) to `9.12.0` with all available languages

### Scripts

#### new functions

| Name | Description |
| ---- | --------- |
| `decode_html()` | Decodes the entities in a HTML string. |
| `encode_html()` | Encodes the entities in a HTML string. |
| `open_html()` | Opens a new HTML tab. |
| `open_markdown()` | Opens a new tab with parsed [Markdown](https://en.wikipedia.org/wiki/Markdown) content. |

#### new modules

| Constant | Name | Description |
| ---- | --------- | --------- |
| `$html` | [node-html-entities](https://github.com/mdevils/node-html-entities) | HTML / XML parser. |
| `$md` | [Marked](https://github.com/markedjs/marked) | [Markdown](https://en.wikipedia.org/wiki/Markdown) parser. |

## 0.23.0 (May 5th, 2018; open response content in app)

* can open response content in an app now

![Demo 3](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo3.gif)

* design fixes

## 0.22.3 (May 4th, 2018; initial release)

For more information about the extension, that a look at the [project page](https://github.com/mkloubert/vscode-http-client).
