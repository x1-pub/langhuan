self.MonacoEnvironment = {
	getWorker(_: any, label: string) {
		if (label === 'json') {
			return new Worker('https://static-1251319111.cos.ap-beijing.myqcloud.com/monaco/vs/language/json/jsonWorker.js');
		}
		if (label === 'css' || label === 'scss' || label === 'less') {
			return new Worker('https://static-1251319111.cos.ap-beijing.myqcloud.com/monaco/vs/language/css/cssWorker.js');
		}
		if (label === 'html' || label === 'handlebars' || label === 'razor') {
			return new Worker('https://static-1251319111.cos.ap-beijing.myqcloud.com/monaco/vs/language/html/htmlWorker.js');
		}
		if (label === 'typescript' || label === 'javascript') {
			return new Worker('https://static-1251319111.cos.ap-beijing.myqcloud.com/monaco/vs/language/typescript/tsWorker.js');
		}
		return new Worker('https://static-1251319111.cos.ap-beijing.myqcloud.com/monaco/vs/base/worker/workerMain.js');
	}
};

window.monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);