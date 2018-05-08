
## Description

Encodes a string to HTML entities.

## Parameters

| Name | Type | Description |
| ---- | --------- | --------- |
| str | any | The value (as string) to encode. |
| [entities] | string | The type of entities to handle. Default: `all` |

### entities

Possible values are:

| Values | Description |
| ---- | --------- |
| `4`, `html4`, `v4` | HTML 4 |
| `5`, `html5`, `v5` | HTML 5 |
| `all` | All entities |
| `x`, `xml` | XML |

## Returns

The encoded string.

## Example

```javascript
let strToEncode = '<strong>This is a test!</strong>';

// all entities
encode_html(strToEncode);  // '&lt;strong&gt;This is a test!&lt;/strong&gt;'

// HTML 4
encode_html(strToEncode, '4');
// HTML 5
encode_html(strToEncode, '5');
// XML
encode_html(strToEncode, 'xml');
```

## See also

* [node-html-entities](https://github.com/mdevils/node-html-entities)
