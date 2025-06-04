/**
 * `/foo/bar`にアクセスした際に、`/index.html`にforwardするための設定。
 * redirectではなくforwardの設定であるため、ブラウザ上のURLは`/foo/bar`のままである。
 * `.`を含む`/foo/bar.png`のようなリクエストはforwardせず、そのままのリクエストとして扱う。
 */
function handler(event) {
	const request = event.request;
	if (request.uri.includes(".")) {
		return request;
	}
	request.uri = "/index.html";
	return request;
}
