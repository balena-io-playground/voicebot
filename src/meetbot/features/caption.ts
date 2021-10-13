import { Bot } from '..';

export const attach = (bot: Bot) => {
	console.log('Running caption feature..');
	bot.on('caption', (data: any) => {
		console.log(`Caption: ${data.caption.text}`);
	});
};
