
## Description

Waits a number seconds.

## Parameters

| Name | Type | Description |
| ---- | --------- | --------- |
| [secs] | number | The number of seconds to wait. Default: `1` |

## Example

```javascript
output.append('Waiting... ');

// waits 2500 milliseconds
await sleep( 2.5 );

output.appendLine('DONE!');
```
