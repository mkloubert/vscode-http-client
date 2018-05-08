
## Description

Creates a new instance of a [HTTP client](https://mkloubert.github.io/vscode-http-client/classes/_http_.httpclient.html), by using the data of the current request form. All important data, like URL, headers or body can be overwritten.

## Example

```javascript
const REQUEST = new new_request();

REQUEST.param('user', 5979)  // set / overwrite an URL / query parameter
       .header('X-My-Header', 'TM')  // set / overwrite a request header
       .body( await $fs.readFile('/path/to/body') );  // set / overwrite body

await REQUEST.send();
```
