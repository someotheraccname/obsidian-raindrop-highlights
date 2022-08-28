import {normalizePath, Vault,} from 'obsidian';
import {path} from './utils';

class ObsFileSystem {

	static async createDirectory(vault: Vault, dir: string): Promise<void> {
		const { adapter } = vault;
		const root = vault.getRoot().path;
		const directoryPath = path.join(root, dir);

		const subPaths: string[] = normalizePath(directoryPath)
			.split('/')
			.filter((part) => part.trim() !== '')
			.map((_, index, arr) => arr.slice(0, index + 1).join('/'));

		for (const subPath of subPaths) {
			const directoryExists = await adapter.exists(path.join(root, subPath));
			if (!directoryExists) {
				await adapter.mkdir(path.join(root, subPath));
			}
		}
	}
}

module.exports = ObsFileSystem;
