import {App} from '@slack/bolt';
import AdmZip from 'adm-zip';
import {execSync} from 'node:child_process';
import {SLACK_SIGNING_SECRET, SLACK_TOKEN, TARGETS_REPO_URL} from '../auth';


export const app = new App({
    token: SLACK_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET
});

app.message(async ({message}) => {
    console.log('[SLACK]', message);

    if (message.type !== 'message') return;
    if (message.subtype !== 'file_share') return;

    if (!message.files) return;

    for (const file of message.files.filter((f) => f.filetype === 'zip')) {
        const buf = await (await fetch(file.url_private_download!)).arrayBuffer();
        const zip = new AdmZip(Buffer.from(buf));

        zip.extractAllTo(`/temp/${file.name!.slice(0, -4)}`);
        execSync('cd temp && git status');
    }
});

export async function initGitRepo() {
    console.log('[GIT] Initializing git repository');
    execSync(`git clone ${TARGETS_REPO_URL} temp || cd temp && git reset origin --hard`);
    console.log('[GIT] Finished initializing git repository');
}
