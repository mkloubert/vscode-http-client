
## Description

Decodes the entities in a HTML string.

## Parameters

| Name | Type | Description |
| ---- | --------- | --------- |
| str | any | The value (as string) to decode. |
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

The decoded string.

## Example

```javascript
let encodedStr = '&lt;strong&gt;This is a test!&lt;/strong&gt;';

// all entities
decode_html(encodedStr);  // '<strong>This is a test!</strong>'

// HTML 4
decode_html(encodedStr, '4');
// HTML 5
decode_html(encodedStr, '5');
// XML
decode_html(encodedStr, 'xml');
```

## See also

* [node-html-entities](https://github.com/mdevils/node-html-entities)
