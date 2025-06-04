/**
 * `index.html`を返す際に、no-cacheを設定する関数。
 * no-cacheを設定することで、ブラウザはキャッシュの状況に依らず毎回サーバに問い合わせる。
 * サーバーは必要があれば200とともにコンテンツを返し、必要がなければ304 Not Modifiedを返すことでキャッシュが再利用される。
 */
function handler(event) {
	const request = event.request;
	const response = event.response;
	if (!request.uri.endsWith("index.html")) {
		return response;
	}

	response.headers["cache-control"] = { value: "no-cache" };
	return response;
}
