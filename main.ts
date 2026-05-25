import { App, Plugin, PluginSettingTab, Setting, normalizePath, FileSystemAdapter } from 'obsidian';
import { Howl } from "howler";

interface CheckboxSoundsSettings {
	soundSetting: string;
	enableAnimation: boolean;
	animationType: 'firework' | 'confetti' | 'hypno' | 'random';
	animationSize: number;
}

const DEFAULT_SETTINGS: CheckboxSoundsSettings = {
	soundSetting: '',
	enableAnimation: false,
	animationType: 'confetti',
	animationSize: 200,
}

export default class CheckboxSounds extends Plugin {
	settings!: CheckboxSoundsSettings;
	availableSounds: string[] = [];

	async onload() {
		await this.loadSettings();
		this.availableSounds = await this.loadAvailableSounds();

		if (this.availableSounds.length > 0 && !this.availableSounds.includes(this.settings.soundSetting)) {
			this.settings.soundSetting = this.availableSounds[0];
		}

		this.addSettingTab(new CheckboxSoundsSettingsTab(this.app, this));

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type !== 'attributes') continue;
				const el = mutation.target as HTMLElement;
				if (!el.classList.contains('task-list-item-checkbox')) continue;
				const checkbox = el as HTMLInputElement;
				// oldValue is empty/null when unchecked, 'x' when checked
				// only fire when transitioning to checked
				if (checkbox.checked && mutation.oldValue !== 'x') {
					this.playSound(this.settings.soundSetting);
					if (this.settings.enableAnimation) {
						this.showAnimation(checkbox);
					}
				}
			}
		});

		observer.observe(document.body, {
			subtree: true,
			attributes: true,
			attributeFilter: ['data-task'],
			attributeOldValue: true,
		});

		this.register(() => observer.disconnect());
		this.loadStyles();
	}

	onunload() {
	}

	async loadAvailableSounds(): Promise<string[]> {
		const assetsPath = normalizePath(`${this.manifest.dir}/assets`);
		try {
			const result = await this.app.vault.adapter.list(assetsPath);
			return result.files
				.filter(f => /\.(mp3|wav|ogg|webm)$/i.test(f))
				.map(f => f.split('/').pop()!);
		} catch {
			return [];
		}
	}

	playSound(filename: string) {
		if (!filename) return;
		const url = this.app.vault.adapter.getResourcePath(
			normalizePath(`${this.manifest.dir}/assets/${filename}`)
		);
		const sound = new Howl({ src: [url] });
		sound.volume(0.6);
		sound.play();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// New method to show animation
	showAnimation(el: HTMLElement) {
		let animationType = this.settings.animationType;
		if (animationType === 'random') {
			const types: ('firework' | 'confetti' | 'hypno')[] = ['firework', 'confetti', 'hypno'];
			animationType = types[Math.floor(Math.random() * types.length)];
		}

		const animationEl = document.createElement('div');
		animationEl.className = `checkbox-animation ${animationType}`;
		document.body.appendChild(animationEl);

		const rect = el.getBoundingClientRect();
		const x = rect.left + rect.width / 2;
		const y = rect.top + rect.height / 2;

		const scale = this.settings.animationSize / 100;
		animationEl.style.left = `${x}px`;
		animationEl.style.top = `${y}px`;
		animationEl.style.transform = `scale(${scale}) translate(-50%, -50%)`;

		if (animationType === 'hypno') {
			this.createHypnoAnimation(animationEl);
		} else {
			this.createParticles(animationEl, animationType === 'firework' ? 30 : 20);
		}

		// Remove the animation element after it's done
		setTimeout(() => animationEl.remove(), 3000);
	}

	createParticles(parent: HTMLElement, count: number) {
		const colors = ['#ff3300', '#00ff00', '#0066ff', '#ffff00'];
		const scale = this.settings.animationSize / 100;
		for (let i = 0; i < count; i++) {
			const particle = document.createElement('div');
			particle.className = 'particle';
			particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
			particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 200 * scale}px`);
			particle.style.setProperty('--ty', `${(Math.random() - 0.5) * 200 * scale}px`);
			parent.appendChild(particle);
		}
	}

	createHypnoAnimation(parent: HTMLElement) {
		const colors = ['#ff3300', '#00ff00', '#0066ff', '#ffff00', '#ff00ff'];
		for (let i = 0; i < 5; i++) {
			const ring = document.createElement('div');
			ring.className = 'hypno-ring';
			ring.style.borderColor = colors[i];
			ring.style.animationDelay = `${i * 0.1}s`;
			parent.appendChild(ring);
		}

		const message = document.createElement('div');
		message.className = 'hypno-message';
		message.textContent = 'Stay Focused!';
		parent.appendChild(message);
	}

	loadStyles() {
		const styleEl = document.createElement('style');
		styleEl.id = 'checkbox-sounds-styles';
		styleEl.textContent = `
			/* Paste the contents of your styles.css file here */
		`;
		document.head.appendChild(styleEl);
	}

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
			.setDesc('Drop .mp3 or .wav files into the plugin\'s assets folder to add more sounds.')
			.addDropdown((dropdown) => {
				for (const filename of this.plugin.availableSounds) {
					const label = filename.replace(/\.[^.]+$/, '');
					dropdown.addOption(filename, label);
				}
				dropdown.setValue(this.plugin.settings.soundSetting);
				dropdown.onChange(async (value) => {
					this.plugin.settings.soundSetting = value;
					await this.plugin.saveSettings();
					this.plugin.playSound(value);
				});
			})
			.addButton((btn) => {
				btn.setIcon('folder-open')
					.setTooltip('Open assets folder')
					.onClick(() => {
						const adapter = this.plugin.app.vault.adapter;
						if (adapter instanceof FileSystemAdapter) {
							const assetsPath = require('path').join(
								adapter.getBasePath(),
								this.plugin.manifest.dir,
								'assets'
							);
							require('electron').shell.openPath(assetsPath);
						}
					});
			})

		new Setting(containerEl)
			.setName('Enable animation')
			.setDesc('Show a celebratory animation when a task is completed')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableAnimation)
				.onChange(async (value) => {
					this.plugin.settings.enableAnimation = value;
					await this.plugin.saveSettings();
					this.display();
				})
			);

		if (this.plugin.settings.enableAnimation) {
			new Setting(containerEl)
			.setName('Animation Type')
			.setDesc('Choose the type of animation to display')
			.addDropdown(dropdown => dropdown
				.addOption('random', 'Random')
				.addOption('firework', 'Firework')
				.addOption('confetti', 'Confetti')
				.addOption('hypno', 'Hypno')
				.setValue(this.plugin.settings.animationType)
				.onChange(async (value) => {
					this.plugin.settings.animationType = value as 'firework' | 'confetti' | 'hypno' | 'random';
					await this.plugin.saveSettings();
				})
			);

			new Setting(containerEl)
				.setName('Animation Size')
				.setDesc('Adjust the size of the animation (percentage)')
				.addSlider(slider => slider
					.setLimits(70, 500, 10)
					.setValue(this.plugin.settings.animationSize)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.animationSize = value;
						await this.plugin.saveSettings();
					})
				);

		}
	}
}
