# vscode-http-client

[![Share via Facebook](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Facebook.png)](https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&quote=Git%20Notify) [![Share via Twitter](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Twitter.png)](https://twitter.com/intent/tweet?source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&text=Git%20Notify:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&via=mjkloubert) [![Share via Google+](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Google+.png)](https://plus.google.com/share?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client) [![Share via Pinterest](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Pinterest.png)](http://pinterest.com/pin/create/button/?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&description=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Reddit](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Reddit.png)](http://www.reddit.com/submit?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&title=Git%20Notify) [![Share via LinkedIn](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/LinkedIn.png)](http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&title=Git%20Notify&summary=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.&source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client) [![Share via Wordpress](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Wordpress.png)](http://wordpress.com/press-this.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client&quote=Git%20Notify&s=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Email](https://raw.githubusercontent.com/mkloubert/vscode-http-client/master/img/share/Email.png)](mailto:?subject=Git%20Notify&body=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-http-client)


[![Latest Release](https://vsmarketplacebadge.apphb.com/version-short/mkloubert.vscode-http-client.svg)](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-http-client)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/mkloubert.vscode-http-client.svg)](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-http-client)
[![Rating](https://vsmarketplacebadge.apphb.com/rating-short/mkloubert.vscode-http-client.svg)](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-http-client#review-details)

Simple way to do [HTTP requests](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol) in [Visual Studio Code](https://code.visualstudio.com/).

## Table of contents

1. [Install](#install-)
2. [How to use](#how-to-use-)
   * [Settings](#settings-)
   * [How to execute](#how-to-execute-)
3. [Syntaxes](#syntaxes-)
4. [Support and contribute](#support-and-contribute-)
5. [Related projects](#related-projects-)
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
| `HTTP Client: Send editor content as HTTP request ...` | Uses the content of a visible editor as body for a HTTP request. | `extension.http.client.newRequestForEditor` |
| `HTTP Client: Send file as HTTP request ...` | Uses a (local) file as body for a HTTP request. | `extension.http.client.newRequestFromFile` |

There are currently no predefined key bindings for these commands, but you can setup them [by your own](https://code.visualstudio.com/docs/getstarted/keybindings).

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

### vscode-helpers [[&uarr;](#related-projects-)]

[vscode-helpers](https://github.com/mkloubert/vscode-helpers) is a NPM module, which you can use in your own [VSCode extension](https://code.visualstudio.com/docs/extensions/overview) and contains a lot of helpful classes and functions.
