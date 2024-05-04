import { App, Plugin, PluginSettingTab, Setting, PluginManifest } from 'obsidian';
import { Howl } from "howler";
import { sound1, sound2, sound3 } from "./defaultSounds";

interface CheckboxSoundsSettings {
	soundSetting: string;
}

const DEFAULT_SETTINGS: CheckboxSoundsSettings = {
	soundSetting: 'sound1'
}

export default class CheckboxSounds extends Plugin {
	settings: CheckboxSoundsSettings;
	manifest: PluginManifest;


	async onload() {
		await this.loadSettings();
		this.addSettingTab(new CheckboxSoundsSettingsTab(this.app, this))
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			let nodeAttributes: any = evt.targetNode?.attributes; // find all attributes of said class
			if (nodeAttributes.class.value == "task-list-item-checkbox") {
				// clicked on a checkbox	
				if (nodeAttributes['data-task'].value == " ") {
					// task completed, play sound
					playSound(this.settings.soundSetting);
				}
			}

		});

	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


function playSound(chosen_sound) {
	// play completion sound
	let file = sound1
	switch (chosen_sound) {
		case "sound1":
			file = sound1
			break
		case "sound2":
			file = sound2
			break
		case "sound3":
			file = sound3
			break
		default:
			file = sound1
			break
	}
	let sound = new Howl({ src: file , preload: true })
	sound.volume(0.6)
	sound.play()
}

class CheckboxSoundsSettingsTab extends PluginSettingTab {
	plugin: CheckboxSounds;

	constructor(app: App, plugin: CheckboxSounds) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Choose checkbox sound')
			.setDesc('Choose a sound to play when checkbox is ticked (more sounds coming soon!)')
			.addDropdown((text) => {
				text.addOption("sound1", "completed_1")
				text.addOption("sound2", "pop")
				text.addOption("sound3", "ting")
				.onChange(async (value) => {
					this.plugin.settings.soundSetting = value;
					await this.plugin.saveSettings();
				  })
				text.setValue(this.plugin.settings.soundSetting)
			})
	}
}