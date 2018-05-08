
## Description

Opens a new [HTML tab](https://code.visualstudio.com/docs/extensionAPI/vscode-api#WebviewPanel).

## Parameters

| Name | Type | Description |
| ---- | --------- | --------- |
| htmlCode | string | The HTML code to setup for the tab. |
| [title] | string | The custom title to set. |

## Returns

The new [WebviewPanel](https://code.visualstudio.com/docs/extensionAPI/vscode-api#WebviewPanel) object.

## Example

```javascript
let htmlCode = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">

    <script>

    const vscode = acquireVsCodeApi();

    </script>
  </head>

  <body>
    <div>Hello, TM!</div>
  </body>
</html>`;

// the function returns the underlying webview
// s. https://code.visualstudio.com/docs/extensionAPI/vscode-api#WebviewPanel
html(htmlCode);

// with custom title
html(htmlCode, 'My HTML document');
```

## Remarks

SECURITY HINT: The new tab is opened with the following settings:

```json
{
    "enableCommandUris": true,
    "enableFindWidget": true,
    "enableScripts": true,
    "retainContextWhenHidden": true
}
```
