import * as fs from 'fs/promises';
import parse from 'csv-parse/lib/sync';
import ProgressBar from 'progress';

type DataHash = {
	'都道府県': string
	'変更前': string
	'変更後': string
	'変更日': string
	'典拠': string
}

/**
 * ./data/にあるCSVの一覧を返す
 * @returns ファイルの一覧
 */
const listupFiles = async () => {
	const files = await fs.readdir("./data").catch(error => {
		throw Error(error);
	});
	return files.map(file => "./data/" + file);
}

/**
 * JSONを作成
 * @param fileDir CSVファイルのパス
 * @returns JSON
 */
const parseCSV = async (fileDir: string) => {
	const file = await fs.readFile(fileDir);
	const parsedCSV: DataHash[] = parse(file, {
		columns: true, // 一行目を見てハッシュに変換
		skipEmptyLines: true // 空行がある場合はスキップ
	});
	return parsedCSV;
}

/**
 * JSONファイルを書き出す
 * @param parsedCSV CSV表をパースしてできた配列
 */
const generateJSON = async (parsedCSV: DataHash[]) => {
	const progressBar = new ProgressBar('[:bar] :percent :total 件', {
		total: parsedCSV.length
	});
	parsedCSV.forEach(async data => {
		await fs.mkdir(`./publish/${data['都道府県']}`).then(() => {
			console.log(`./publish/${data['都道府県']}`);
		}).catch(() => {
			return true; // すでにディレクトリが存在するならエラーを無視
		});
		fs.writeFile(`./publish/${data['都道府県']}/${data['変更前']}.json`, JSON.stringify(data)).then(() => {
			progressBar.tick();
		}).catch(error => {
			throw error;
		});
	})
}

(async () => {
	await fs.mkdir("./publish").catch(() => {
		return true;
	});
	const fileList = await listupFiles();
	for (let fileDir of fileList) {
		const parsedCSV = await parseCSV(fileDir);
		generateJSON(parsedCSV);
	}
})();