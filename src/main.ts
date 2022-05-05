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
 * @returns ファイルのパスの配列
 */
const listFiles = async (): Promise<string[]> => {
	const filenames = await fs.readdir("./data").catch(error => {
		throw Error(error);
	});
	return filenames.map(filename => `./data/${filename}`);
}

/**
 * CSVファイルをJSONに変換
 * @param filePath CSVファイルのパス
 * @returns JSON
 */
const parseCSV = async (filePath: string): Promise<DataHash[]> => {
	const file = await fs.readFile(filePath);
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
	});
}

(async () => {
	await fs.mkdir("./publish").catch(() => {
		return true;
	});
	const filePaths = await listFiles();
	for (let filePath of filePaths) {
		const parsedCSV = await parseCSV(filePath);
		generateJSON(parsedCSV);
	}
})();