# Change Log (vscode-http-client)

[![Share via Facebook](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Facebook.png)](https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&quote=Git%20Notify) [![Share via Twitter](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Twitter.png)](https://twitter.com/intent/tweet?source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&text=Git%20Notify:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&via=mjkloubert) [![Share via Google+](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Google+.png)](https://plus.google.com/share?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client) [![Share via Pinterest](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Pinterest.png)](http://pinterest.com/pin/create/button/?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&description=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Reddit](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Reddit.png)](http://www.reddit.com/submit?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&title=Git%20Notify) [![Share via LinkedIn](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/LinkedIn.png)](http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&title=Git%20Notify&summary=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.&source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client) [![Share via Wordpress](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Wordpress.png)](http://wordpress.com/press-this.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&quote=Git%20Notify&s=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Email](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Email.png)](mailto:?subject=Git%20Notify&body=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client)

## 0.27.0 (March 8th, 2018; edit URL parameters)

* can simply edit URL parameters now

![Demo 7](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo7.gif)

## 0.26.0 (March 8th, 2018; help)

* can open help tab via `HTTP Client: Show help ...` command now

![Demo 6](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo6.gif)

* documentation fixes

## 0.25.0 (March 6th, 2018; redo specific requests)

* can redo specific requests now:

![Demo 5](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo5.png)

* bugfixes and improvements

## 0.24.0 (March 6th, 2018; scripts and styles)

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

## 0.23.0 (March 5th, 2018; open response content in app)

* can open response content in an app now

![Demo 3](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/demo3.gif)

* design fixes

## 0.22.3 (March 4th, 2018; initial release)

For more information about the extension, that a look at the [project page](https://github.com/mkloubert/vscode-http-client).
