
## Description

Shows a (warning) popup.

## Parameters

| Name | Type | Description |
| ---- | --------- | --------- |
| message | string | The message to show. |
| [...buttons] | string | One or more buttons to show. |

## Returns

The pressed button.

## Examples

### Simple example

```javascript
alert('Hello!');
```

### With buttons

```javascript
const SELECTED_BUTTON = await alert('Sure?',
                                    'NO!', 'Yes');

if (SELECTED_BUTTON) {
    switch (SELECTED_BUTTON) {
        case 'NO!':
            output.appendLine('User is UN-SURE!');
            break;

        case 'Yes':
            output.appendLine('User is sure.');
            break;
    }
} else {
    // cancelled
}
```
