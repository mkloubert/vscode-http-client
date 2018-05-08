
## Description

Provides the [OutputChannel](https://code.visualstudio.com/docs/extensionAPI/vscode-api#OutputChannel) object of the extension.

## Example

```javascript
// make the channel visible
output.show();

for (let i = 0; i < 10; i++) {
    output.append('i === ' + i);
    
    output.appendLine('');
}

// hide the channel
output.hide();
```

## See also

* [vscode namespace API](https://code.visualstudio.com/docs/extensionAPI/vscode-api)
