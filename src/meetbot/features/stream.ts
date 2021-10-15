import { Bot } from '..';
import * as fs from 'fs';
import * as moment from 'moment';
import { postToChatJob } from '../pptr-helpers';
import { Credentials, GoogleDoc } from '../google-doc';

export const attach = async (bot: Bot) => {
	let credentials: Credentials | null = null;
	try {
		const credentialsFile = fs.readFileSync('credentials.json').toString();
		credentials = JSON.parse(credentialsFile).installed;
	} catch (err) {
		console.log(
			'Cannot read credentials.json - required to use Google Docs writer',
			err,
		);
	}
	if (!credentials) {
		console.log('deactivating google docs feature due to missing credentials');
		return;
	}
	const doc = new GoogleDoc(credentials);
	let docId: string;
	console.log('Attached Transcript Streamer');

	bot.on('joined', async ({ meetURL }) => {
		const meetId = meetURL.split('/').pop();
		const docName = `Meeting ${meetId} (${new Date().toISOString()}) Voice Transcript`;
		docId = await doc.create(docName);
		doc.addTitle('Transcript\n\n');
		const documentUrl = `https://docs.google.com/document/d/${docId}`;

		bot.emit('transcript_doc_ready', {
			transcriptUrl: documentUrl,
			meetURL,
		});

		bot.addJob(postToChatJob(`Transcript is available at: ${documentUrl}`));
	});
	bot.on('caption', (data: CaptionEvent) => {
		if (
			!data.caption ||
			!data.caption.text.trim() ||
			!data.caption.startedAt ||
			!data.caption.person ||
			data.caption.person.trim().toLowerCase() === 'Meeting host'.toLowerCase()
		) {
			return;
		}

		bot.addJob(async () => {
			const { startedAt, person, image, text } = data.caption;
			const heading = `${moment(startedAt).format(
				'h:mm:ss a UTC',
			)} - ${person}:\n`;
			const message = `${text}\n\n`;
			doc.addHeading(heading);
			doc.addImage(image);
			doc.addText(message);
		});
	});
};
