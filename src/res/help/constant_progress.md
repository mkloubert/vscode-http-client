
## Description

Stores the underlying [Progress](https://code.visualstudio.com/docs/extensionAPI/vscode-api#_a-nameprogressaspan-classcodeitem-id1166progresslttgtspan) object, provided by [withProgress()](https://code.visualstudio.com/docs/extensionAPI/vscode-api) function.

## Example

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

## See also

* [vscode namespace API](https://code.visualstudio.com/docs/extensionAPI/vscode-api)
