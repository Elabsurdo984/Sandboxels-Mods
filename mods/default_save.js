// default_save.js

let ds_settingsTab;
let ds_defaultSaveSetting;

function loadDefaultSave() {
	if (ds_defaultSaveSetting.value === 0)
		return

	if (ds_defaultSaveSetting.value === -1) {
		promptText("It looks like you haven't set a default save to open when the game starts\n\nDo so in settings > Default save\n\nTo not automatically open a save, set it to slot 0 (or remove this mod)", null, "From default_save.js");
		return;
	}

	if (localStorage.getItem("SandboxelsSaves/" + ds_defaultSaveSetting.value) === null) {
		promptText("It looks like the save you configured to automatically open does not exist\n\nChange the save slot in settings > Default save", null, "From default_save.js");
		return;
	}

	loadSlot(ds_defaultSaveSetting.value);
}

dependOn("betterSettings.js", () => {
	ds_settingsTab = new SettingsTab("Default save");
	ds_defaultSaveSetting = new Setting(
		"Save slot to open:",
		"saveToOpen",
		settingType.NUMBER,
		false,
		-1,
	);

	ds_settingsTab.registerSettings("On startup", ds_defaultSaveSetting);
	settingsManager.registerTab(ds_settingsTab);
}, true);

// Load save on startup
runAfterLoad(() => {
	setTimeout(() => {
		loadDefaultSave();
	}, 0);
});
