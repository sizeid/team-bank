import GoogleSpreadsheet from 'google-spreadsheet';
import credentials from './credentials.json';
import { promisify } from 'util';
import { IncomingWebhook } from '@slack/client';

const emojis = [
  ':first_place_medal:', ':second_place_medal:',
  ':third_place_medal:', ':four:', ':five:', ':six:',
  ':seven:', ':eight:', ':nine:'
];
const getEmoji = (number) => {
  if (number < 9) {
    return emojis[number];
  } else {
    return number;
  }
};

async function accessSpreadsheet() {
  const doc = new GoogleSpreadsheet(credentials.spreadsheet_id);
  await promisify(doc.useServiceAccountAuth)(credentials);
  const info = await promisify(doc.getInfo)();
  const sheet = info.worksheets[1];
  const cells = await promisify(sheet.getCells)({
    'min-row': 1,
    'max-row': 1000,
    'min-col': 1,
    'max-col': 2,
  });
  let debt = [];
  for (let i = 2; i < cells.length; i += 2) {
    const money = cells[i + 1].numericValue;
    if (money < 0) {
      debt.push({ name: cells[i].value, money: money });
    }
  }
  debt.sort((a, b) => {
    return (a.money > b.money) ? 1 : ((b.money > a.money) ? -1 : 0);
  });
  let message = '';
  debt.forEach((val, i) => {
    message += getEmoji(i) + ' *' + val.name + '* `' + val.money + '`\n';
  });
  message += 'https://media.giphy.com/media/MbIYMkQhIGMc8/giphy.gif';

  if(debt.length !== 0) {
    const webhook = new IncomingWebhook(credentials.slack_webhook_url, {
      "mrkdwn": true,
      "icon_emoji": ":dollar:",
      "username": "Dlužníček",
      "text": message,
    });

    await webhook.send();
  }
}

accessSpreadsheet();