
## Description

Provides the underlying [CancellationToken](https://code.visualstudio.com/docs/extensionAPI/vscode-api#CancellationToken) object.

## Example

```javascript
const USER_IDS = [1, 2, 3];

for (let i = 0; i < USER_IDS.length; i++) {
    if (cancel.isCancellationRequested) {
        break;  // user wants to cancel
    }

    // TODO
}
```

## See also

* [vscode namespace API](https://code.visualstudio.com/docs/extensionAPI/vscode-api)
