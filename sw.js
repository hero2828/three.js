const addResourcesToCache = async (resources) => {
	// 打开缓存
	const cache = await caches.open("v1");
	// 将资源添加到缓存中
	await cache.addAll(resources);
};

const putInCache = async (request, response) => {
	// 打开缓存
	const cache = await caches.open("v1");
	// 将请求和响应放入缓存
	await cache.put(request, response);
};

const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
	// 首先尝试从缓存中获取资源
	const responseFromCache = await caches.match(request);
	if (responseFromCache) {
		return responseFromCache;
	}

	// 接下来尝试使用预加载的响应（如果有的话）
	const preloadResponse = await preloadResponsePromise;
	if (preloadResponse) {
		console.info("使用预加载响应", preloadResponse);
		putInCache(request, preloadResponse.clone());
		return preloadResponse;
	}

	// 接下来尝试从网络获取资源
	try {
		const responseFromNetwork = await fetch(request);
		// 响应只能使用一次
		// 我们需要保存副本以将一个副本放入缓存
		// 并提供第二个副本
		putInCache(request, responseFromNetwork.clone());
		return responseFromNetwork;
	} catch (error) {
		const fallbackResponse = await caches.match(fallbackUrl);
		if (fallbackResponse) {
			return fallbackResponse;
		}
		// 即使连备用响应也不可用，
		// 我们必须始终返回一个 Response 对象
		return new Response("网络错误发生", {
			status: 408,
			headers: { "Content-Type": "text/plain" },
		});
	}
};

const enableNavigationPreload = async () => {
	if (self.registration.navigationPreload) {
		// 启用导航预加载
		await self.registration.navigationPreload.enable();
	}
};

// 当服务工作者被激活时执行
self.addEventListener("activate", (event) => {
	event.waitUntil(enableNavigationPreload());
});

// 当服务工作者被安装时执行
self.addEventListener("install", (event) => {
	event.waitUntil(
		addResourcesToCache([
			"/",
			"/index.html",
			"/docs",
			"/examples",
			"/files",
			"/manual",
			"/src",
			"/playground",
			"/utils",
		])
	);
});

