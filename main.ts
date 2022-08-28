import {App, DataAdapter, normalizePath, Plugin, PluginSettingTab, Setting} from 'obsidian';
import * as path from "path";

import {RaindropCollection} from "./raindrop/GetCollectionsApiResponse";
import {RaindropItm} from "./raindrop/GetRaindropsApiResponse";
import * as ejs from "ejs";
import {EsJsTemplates} from "./note";
import {format, parseISO} from "date-fns";

const {
	createDirectory
} = require("raindrop/ObsFileSystem");

const {
	setAuthToken,
	collections,
	raindrops,
	moveRaindropsToCollection,
	createCollection
} = require("raindrop/RaindropIoApiClient");

const truncate = (str: string, len: number) => str.slice?.(0, len);

interface RaindropIntegrationPluginSettings {
	frequencyMinutes: string;
	obsidianArticleFolder: string;
	raindropAuthToken: string;
	raindropCollectionNameIn: string;
	raindropCollectionNameOut: string;
	isSyncing: boolean;
}

const DEFAULT_SETTINGS: RaindropIntegrationPluginSettings = {
	frequencyMinutes: "30",
	obsidianArticleFolder: "articles/YYYY/MM/DD",
	raindropAuthToken: "",
	raindropCollectionNameIn: "obsidian",
	raindropCollectionNameOut: "raindrop",
	isSyncing: false
}

const dateTimeFormat = 'dd.MM.yyyy HH:mm';

export default class RaindropIntegrationPlugin extends Plugin {
	settings: RaindropIntegrationPluginSettings;
	scheduleInterval: null | number = null;

	async onload() {
		await this.setupPlugin();

		// always run flow on startup
		await this.runFlow();

		// set scheduled run
		await this.scheduleFlowRuns()
	}

	private async setupPlugin() {
		this.addSettingTab(new RaindropIntegrationSettingTab(this.app, this));

		await this.initialLoadSettings();

		this.registerSyncCommand();

		await this.isSyncing(false);
	}

	async initialLoadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		setAuthToken(this.settings.raindropAuthToken);
	}

	private registerSyncCommand() {
		this.addCommand({
			id: 'raindrop-integration-sync',
			name: 'Sync highlights',
			callback: () => {
				this.runFlow();
			}
		});
	}

	async scheduleFlowRuns() {
		if (this.scheduleInterval != null) {
			window.clearInterval(this.scheduleInterval);
		}
		this.scheduleInterval = null;

		const minutes = parseInt(this.settings.frequencyMinutes);
		let milliseconds = minutes * 60 * 1000;
		if (!milliseconds) {
			// manual sync option
			return;
		}

		this.scheduleInterval = window.setInterval(() => this.runFlow(), milliseconds);
		this.registerInterval(this.scheduleInterval);
		console.log(`Import scheduled every ${milliseconds}ms (${minutes} minutes)`)

	}

	public async runFlow() {
		if (this.settings.isSyncing) {
			console.error("Raindrop.io sync is already in progress");
			return Promise.resolve();
		}

		const fs = this.app.vault.adapter;

		try {
			await this.isSyncing(true);
			console.log(`${format(new Date(), dateTimeFormat)} Start importing from raindrop.io`)

			const outputDirNormalizedPath = this.noteOutputDirPath(this.settings.obsidianArticleFolder)
			await this.createIfNotExists(fs, outputDirNormalizedPath);

			// fetch all existing collections
			let existingCollections: RaindropCollection[] = await collections();

			// make sure relevant obsidian folders exist
			let updateCollections = false;
			const relevantObsidianFolders = [this.settings.raindropCollectionNameIn, this.settings.raindropCollectionNameOut];
			for (const reqCollName of relevantObsidianFolders) {
				const found = existingCollections.find(existing => existing.title.toLowerCase().trim() == reqCollName.toLowerCase().trim()) ? true : false
				if (!found) {
					await createCollection(reqCollName)
					updateCollections = true;
				}
			}
			if (updateCollections) {
				existingCollections = await collections();
			}

			let inputCollection = this.findCollection(this.settings.raindropCollectionNameIn, existingCollections);
			if (!inputCollection) {
				console.error(`No input collection with title \"${this.settings.raindropCollectionNameIn}\" found! Abort.`);
				return Promise.resolve();
			}

			let defaultOutputCollection = this.findCollection(this.settings.raindropCollectionNameOut, existingCollections);
			if (!defaultOutputCollection) {
				console.error(`No output collection with title \"${this.settings.raindropCollectionNameOut}\" found! Abort.`);
				return Promise.resolve();
			}

			// fetch actual bookmarks
			let raindropItms: RaindropItm[] = await raindrops(inputCollection._id)
			if (!raindropItms) {
				console.error("No raindrop items to be processed found!");
				return Promise.resolve();
			}

			await this.handleRaindrops(fs, outputDirNormalizedPath, raindropItms);

			await moveRaindropsToCollection(inputCollection, defaultOutputCollection);
			console.log(`${raindropItms.length} Raindrops moved from ${inputCollection.title} to ${defaultOutputCollection.title}`);
		} catch (e) {
			console.error(e)
		} finally {
			this.isSyncing(false)
			this.saveSettings();
		}
	}

	private async handleRaindrops(fs: DataAdapter, outputDirNormalizedPath: string, raindropItms: RaindropItm[]) {
		for (const itm of raindropItms) {
			itm.title = this.cleanupTitle(itm.title);

			const noteFilename = truncate(itm.domain, 20) + "_" + itm._id + ".md";
			const noteOutputFileNormalizedPath = normalizePath(outputDirNormalizedPath + path.sep + noteFilename);

			await fs.write(noteOutputFileNormalizedPath, this.generateObsidianNoteContent(itm, EsJsTemplates.OBS_NOTE_TEMPLATE, undefined))
		}
	}

	private cleanupTitle(title: string): string {
		if (title.startsWith("Ask HN:")) {
			title = title.substring("Ask HN:".length);
		}
		if (title.startsWith("Show HN:")) {
			title = title.substring("Show HN:".length);
		}
		if (title.endsWith("| Hacker News")) {
			title = title.substring(0, title.indexOf("| Hacker News"));
		}

		return title.trim();
	}

	private findCollection(collectionName: string, existingCollections: RaindropCollection[]) {
		return existingCollections.find(e => e.title.toLowerCase().trim() == collectionName.toLowerCase().trim());
	}

	private async createIfNotExists(fs: DataAdapter, outputDirNormalizedPath: string) {
		let outputDirPathExists = await fs.exists(outputDirNormalizedPath);
		if (!outputDirPathExists) {
			await createDirectory(this.app.vault, outputDirNormalizedPath);
		}
	}

	private async isSyncing(isSyncing: boolean) {
		this.settings.isSyncing = isSyncing;
		return this.saveSettings();
	}

	private generateObsidianNoteContent(itm: RaindropItm, template: string, screenshot?: string) {
		let html = ejs.render(template, {
			raindrop: itm,
			screenshot: screenshot,
			imported: format(new Date(), dateTimeFormat),
			created: format(parseISO(itm.created), dateTimeFormat),
			lastUpdate: format(parseISO(itm.lastUpdate), dateTimeFormat)
		});
		return `${html}`;
	}

	onunload() {

	}


	async saveSettings() {
		return this.saveData(this.settings);
	}

	noteOutputDirPath(articleFolderStructure: string) {
		const now = new Date();
		let str = String(articleFolderStructure);

		const yyyy = "" + now.getUTCFullYear()
		str = str.replace(/yyyy/gi, yyyy);

		const mm = ("" + (now.getUTCMonth() + 1)).padStart(2, "0");
		str = str.replace(/MM/g, mm);

		const dd = ("" + now.getUTCDate()).padStart(2, "0");
		str = str.replace(/DD/g, dd);

		return normalizePath(str);
	}

}


class RaindropIntegrationSettingTab extends PluginSettingTab {
	plugin: RaindropIntegrationPlugin;

	constructor(app: App, plugin: RaindropIntegrationPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings'});

		new Setting(containerEl)
			.setName("Sync your Raindrop.io highlights with Obsidian")
			.setDesc("On first sync, the Raindrop.io highlights plugin will create a new folder containing all your highlights")
			.setClass('rw-setting-sync')
			.addButton((button) => {
				button.setCta().setTooltip("Once the sync begins, you can close this plugin page")
					.setButtonText('Initiate Sync')
					.onClick(async () => {
						button.setButtonText("Syncing...");
						await this.plugin.runFlow()
						button.setButtonText("Initiate Sync");
					});
			});
		let el = containerEl.createEl("div", {cls: "rw-info-container"});
		containerEl.find(".rw-setting-sync > .setting-item-control ").prepend(el);

		new Setting(containerEl)
			.setName('Configure sync frequency')
			.setDesc("Plugin will automatically sync with raindrop.io when the app is opened and at the specified interval")
			.addDropdown(dropdown => {
				dropdown.addOption("0", "Manual");
				dropdown.addOption("5", "Every 5 minutes");
				dropdown.addOption("15", "Every 15 minutes");
				dropdown.addOption("30", "Every 30 minutes");
				dropdown.addOption("60", "Every 1 hour");

				// select the currently-saved option
				dropdown.setValue(this.plugin.settings.frequencyMinutes);

				dropdown.onChange((newValue) => {
					// update the plugin settings
					this.plugin.settings.frequencyMinutes = newValue;
					this.plugin.saveSettings();

					// destroy & re-create the scheduled task
					this.plugin.scheduleFlowRuns();
				});
			});

		new Setting(containerEl)
			.setName('Customize base folder')
			.setDesc(`By default, the plugin will save all your highlights into a folder named ${DEFAULT_SETTINGS.obsidianArticleFolder}`)
			.addText(text => text
				.setPlaceholder(`Defaults to: ${DEFAULT_SETTINGS.obsidianArticleFolder}`)
				.setValue(this.plugin.settings.obsidianArticleFolder)
				.onChange(async (value) => {
					this.plugin.settings.obsidianArticleFolder = normalizePath(value || DEFAULT_SETTINGS.obsidianArticleFolder);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('raindrop.io auth token')
			.setDesc(`Required token to perform raindrop.io sync with this plugin`)
			.addText(text => text
				.setPlaceholder(`${DEFAULT_SETTINGS.raindropAuthToken}`)
				.setValue(this.plugin.settings.raindropAuthToken)
				.onChange(async (value) => {
					this.plugin.settings.raindropAuthToken = value || DEFAULT_SETTINGS.raindropAuthToken;
					await this.plugin.saveSettings();
					setAuthToken(this.plugin.settings.raindropAuthToken);
				}));

		new Setting(containerEl)
			.setName('raindrop.io collection name to import highlights from')
			.setDesc(`By default, the plugin import raindrop.io highlights from a collection named ${DEFAULT_SETTINGS.raindropCollectionNameIn}`)
			.addText(text => text
				.setPlaceholder(`Defaults to: ${DEFAULT_SETTINGS.raindropCollectionNameIn}`)
				.setValue(this.plugin.settings.raindropCollectionNameIn)
				.onChange(async (value) => {
					this.plugin.settings.raindropCollectionNameIn = value || DEFAULT_SETTINGS.raindropCollectionNameIn;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('raindrop.io collection name to move processed raindrops to')
			.setDesc(`By default, the plugin will move processed raindrops to a collection named ${DEFAULT_SETTINGS.raindropCollectionNameOut}`)
			.addText(text => text
				.setPlaceholder(`Defaults to: ${DEFAULT_SETTINGS.raindropCollectionNameOut}`)
				.setValue(this.plugin.settings.raindropCollectionNameOut)
				.onChange(async (value) => {
					this.plugin.settings.raindropCollectionNameOut = value || DEFAULT_SETTINGS.raindropCollectionNameOut;
					await this.plugin.saveSettings();
				}));
	}
}
