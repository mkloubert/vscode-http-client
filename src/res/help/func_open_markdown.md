
## Description

Opens a new [HTML tab](https://code.visualstudio.com/docs/extensionAPI/vscode-api#WebviewPanel) with parsed [Markdown](https://en.wikipedia.org/wiki/Markdown) content.

## Parameters

| Name | Type | Description |
| ---- | --------- | --------- |
| markdown | string | The Markdown code to setup for the tab. |
| [titleOrOptions] | string, object | The title or an object with settings. |

### titleOrOptions

```typescript
interface OpenMarkdownOptions {
    /**
     * The custom CSS style.
     */
    css?: string;
    /**
     * The custom title
     */
    title?: string;
}
```

## Returns

The new [WebviewPanel](https://code.visualstudio.com/docs/extensionAPI/vscode-api#WebviewPanel) object.

## Example

```javascript
let markdownCode = `# Header 1

## Header 2

Lorem ipsum dolor sit amet.
`;

// the function returns the underlying webview
// s. https://code.visualstudio.com/docs/extensionAPI/vscode-api#WebviewPanel
md(markdownCode);

// with custom title
md(markdownCode, 'My Markdown document');

// with custom, optional title and CSS
md(markdownCode, {
    css: `
body {
  background-color: red;
}
`,
    title: 'My Markdown document'
});
```

## Remarks

The parser uses the following [settings](https://marked.js.org/):

```json
{
    "breaks": true,
    "gfm": true,
    "mangle": true,
    "silent": true,
    "tables": true,
    "sanitize": true
}
```

## See also

* [Marked](https://github.com/markedjs/marked)
