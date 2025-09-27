import { App, Plugin, PluginSettingTab, Setting, PluginManifest } from 'obsidian';
import { Howl } from "howler";
import * as allSounds from "./defaultSounds";

interface CheckboxSoundsSettings {
	soundSetting: string;
	enableAnimation: boolean;
	animationType: 'firework' | 'confetti' | 'hypno' | 'random';
	animationSize: number; // New setting for animation size
	animationPosition: 'center' | 'custom';
	customX: number;
	customY: number;
	randomizePosition: boolean;
	randomAreaPadding: number;
}

const DEFAULT_SETTINGS: CheckboxSoundsSettings = {
	soundSetting: 'sound1',
	enableAnimation: false,
	animationType: 'firework',
	animationSize: 200, // Default size (100%)
	animationPosition: 'center',
	customX: 50,
	customY: 50,
	randomizePosition: true,
	randomAreaPadding: 0,
}

export default class CheckboxSounds extends Plugin {
	settings: CheckboxSoundsSettings;
	manifest: PluginManifest;


	async onload() {
		await this.loadSettings();
		this.addSettingTab(new CheckboxSoundsSettingsTab(this.app, this))
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			let nodeAttributes: any = evt.targetNode?.attributes; // find all attributes of said class
			// Prevents an error when clicking on nodes in Canvas
			if(nodeAttributes.class === undefined) return;
			let nodeClasses = nodeAttributes.class.value.split(" ")
			if (nodeClasses.includes("task-list-item-checkbox")) {
				// clicked on a checkbox	
				try {
					if (nodeAttributes['data-task'].ownerElement.checked == true) {
						// task completed, play sound
						playSound(this.settings.soundSetting);
						// Add animation if enabled
						if (this.settings.enableAnimation) {
							this.showAnimation(evt.target as HTMLElement);
						}
					}	
				}
				catch(err) {
					if (err instanceof TypeError) {
						// can be improved soon, but this will have to do for now
						let checkbox_ticked = nodeAttributes.class.ownerElement.checked
						if (checkbox_ticked) {
							playSound(this.settings.soundSetting);
							// Add animation if enabled
							if (this.settings.enableAnimation) {
								this.showAnimation(evt.target as HTMLElement);
							}
						}
					}
				}
			}

		});

		this.loadStyles();
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// New method to show animation
	showAnimation(target: HTMLElement) {
		let animationType = this.settings.animationType;
		if (animationType === 'random') {
			const types: ('firework' | 'confetti' | 'hypno')[] = ['firework', 'confetti', 'hypno'];
			animationType = types[Math.floor(Math.random() * types.length)];
		}

		const animationEl = document.createElement('div');
		animationEl.className = `checkbox-animation ${animationType}`;
		document.body.appendChild(animationEl);

		const scale = this.settings.animationSize / 100;
		let transform = `scale(${scale})`;

		if (this.settings.animationPosition === 'center') {
			if (this.settings.randomizePosition) {
				const padding = this.settings.randomAreaPadding;
				const randomX = 50 + (Math.random() - 0.5) * (60 - padding * 2);
				const randomY = 50 + (Math.random() - 0.5) * (60 - padding * 2);
				animationEl.style.left = `${randomX}%`;
				animationEl.style.top = `${randomY}%`;
				transform += ` translate(-50%, -50%)`;
			} else {
				animationEl.style.left = '50%';
				animationEl.style.top = '50%';
				transform += ' translate(-50%, -50%)';
			}
		} else {
			animationEl.style.left = `${this.settings.customX}%`;
			animationEl.style.top = `${this.settings.customY}%`;
			transform += ` translate(${this.settings.customX}%, ${this.settings.customY}%)`;
		}

		animationEl.style.transform = transform;

		if (animationType === 'hypno') {
			this.createHypnoAnimation(animationEl);
		} else {
			this.createParticles(animationEl, animationType === 'firework' ? 30 : 20);
		}

		// Remove the animation element after it's done
		setTimeout(() => animationEl.remove(), 5000);
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

function playSound(chosen_sound) {
	// play completion sound
	let file = allSounds.sound1
	switch (chosen_sound) {
		case "sound1":
			file = allSounds.sound1
			break
		case "sound2":
			file = allSounds.sound2
			break
		case "sound3":
			file = allSounds.sound3
			break
		case "sound4":
			file = allSounds.sound4
			break
		default:
			file = allSounds.sound1
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
				text.addOption("sound4", "kaching!")
				.onChange(async (value) => {
					this.plugin.settings.soundSetting = value;
					await this.plugin.saveSettings();
				  })
				text.setValue(this.plugin.settings.soundSetting)
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

			new Setting(containerEl)
				.setName('Animation Position')
				.setDesc('Choose where the animation appears')
				.addDropdown(dropdown => dropdown
					.addOption('center', 'Center')
					.addOption('custom', 'Custom')
					.setValue(this.plugin.settings.animationPosition)
					.onChange(async (value) => {
						this.plugin.settings.animationPosition = value as 'center' | 'custom';
						await this.plugin.saveSettings();
						this.display(); // Refresh to show/hide custom position settings
					})
				);

			if (this.plugin.settings.animationPosition === 'center') {
				new Setting(containerEl)
					.setName('Randomize Center Position')
					.setDesc('Slightly randomize the animation position within the center area')
					.addToggle(toggle => toggle
						.setValue(this.plugin.settings.randomizePosition)
						.onChange(async (value) => {
							this.plugin.settings.randomizePosition = value;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show/hide random area size slider
						})
					);

				if (this.plugin.settings.randomizePosition) {
					new Setting(containerEl)
						.setName('Random Area Size')
						.setDesc('Adjust the size of the area where animations can appear (smaller value = more centered)')
						.addSlider(slider => slider
							.setLimits(0, 30, 1)
							.setValue(this.plugin.settings.randomAreaPadding)
							.setDynamicTooltip()
							.onChange(async (value) => {
								this.plugin.settings.randomAreaPadding = value;
								await this.plugin.saveSettings();
							})
						);
				}
			} else if (this.plugin.settings.animationPosition === 'custom') {
				new Setting(containerEl)
					.setName('Custom X Position')
					.setDesc('Percentage from left (0-100)')
					.addSlider(slider => slider
						.setLimits(0, 100, 1)
						.setValue(this.plugin.settings.customX)
						.setDynamicTooltip()
						.onChange(async (value) => {
							this.plugin.settings.customX = value;
							await this.plugin.saveSettings();
						})
					);

				new Setting(containerEl)
					.setName('Custom Y Position')
					.setDesc('Percentage from top (0-100)')
					.addSlider(slider => slider
						.setLimits(0, 100, 1)
						.setValue(this.plugin.settings.customY)
						.setDynamicTooltip()
						.onChange(async (value) => {
							this.plugin.settings.customY = value;
							await this.plugin.saveSettings();
						})
					);
			}
		}
	}
}
