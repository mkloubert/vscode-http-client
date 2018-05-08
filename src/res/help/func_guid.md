
## Description

Generates a new unique ID.

## Parameters

| Name | Type | Description |
| ---- | --------- | --------- |
| [version] | string | The version. Default: `4` |

### version

Possible values are:

| Values | Description |
| ---- | --------- |
| `1`, `v1` | Version 1 |
| `4`, `v4` | Version 4 |
| `5`, `v5` | Version 5 |

## Example

```javascript
// v1
guid('1');

// v4
guid();
guid('4');

// v5
guid('5');
```

## See also

* [node-uuid](https://github.com/kelektiv/node-uuid)
