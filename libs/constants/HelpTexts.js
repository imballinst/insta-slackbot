/**
 * General commands help
 */
const generalHelpTextArray = [
  'Ada dua tipe perintah, yaitu perintah administratif dan perintah query Instagram.',
  '\t1. *Perintah administratif*',
  '\t\t• `!help`: Memberikan daftar perintah-perintah yang dapat diinput oleh admin',
  '\t\t• `!admins`: Menampilkan daftar admin yang berhak memberikan perintah',
  '\t\t• `!promote`: Memberikan akses admin kepada seorang user',
  '\t\t• `!demote`: Mencabut akses admin dari seorang user',
  '\t\t• `!channels`: Menampilkan daftar channel tempat output dari post-post Instagram',
  '\t\t• `!setbroadcast`: Menentukan channel tempat output dari post-post Instagram',
  '\t2. *Perintah query Instagram*',
  '\t\t• `!review`: Melakukan rekapitulasi post-post dari kurun waktu tertentu',
  '\t\t• `!mostlikes`: Mencari post-post dengan jumlah likes terbanyak dari kurun waktu tertentu',
  '\t\t• `!countlikes`: Menghitung jumlah post likes  dari kurun waktu tertentu',
  'Untuk mengetahui detil perintah, ketik perintah tersebut diikuti dengan *--help*. Contoh: `!promote --help`',
];
const generalHelpText = generalHelpTextArray.join('\n');

/**
 * Specific commands help
 */
function helpTemplate(command, help, example) {
  const header = `Panduan perintah *${command}*: \`!${command} [argumen]\`\n`;
  const body = `Daftar argumen yang dapat digunakan:\n ${help}`;
  const exampleText = example !== '' ? `Contoh penggunaan: ${example}\n` : '';

  return header + body + exampleText;
}

const mediaArgs =
  '\t• `--from`, `-f`: waktu awal dalam format *DD-MM-YYYY*. Contoh: `25-05-2015`. Default: awal minggu ini.\n' +
  '\t• `--to`, `-t`: waktu akhir dalam format *DD-MM-YYYY*. Contoh: `25-05-2016`. Default: akhir minggu ini.\n';
const sortParams = '\t• `--sort`, `-s`: urutan dalam format *field:order*. Contoh: `likes:asc`. Default: `time:asc`\n' +
  '\t\t- *field*: atribut untuk diurutkan, diantaranya `likes`, `comments`, `time`, `tags`.\n' +
  '\t\t- *order*: urutan hasil query, yaitu `asc` (kecil-besar) atau `desc` (besar-kecil).\n';

const moteArgs = '\t• `--user`, `-u`: nama username. Contoh: `try.aji`\n';
const setBroadcastArgs = '\t• `--channel`, `-c` (*wajib*): nama channel atau `~here`. Contoh: `general`. Default: `-`\n' +
  '\t• `--broadcast`, `-b`: status broadcast untuk channel, `on` atau `off`. Contoh: `on`. Default: `on`\n';

// Examples
const cmdExamples = {
  review: '`!review -f 25-05-2015 -t 25-05-2016 -s likes:asc` atau `!review --from 25-05-2015 --to 25-05-2016 --sort likes:asc`\n',
  mostlikes: '`!mostlikes -f 25-05-2015 -t 25-05-2016` atau `!mostlikes --from 25-05-2015 --to 25-05-2016`\n',
  countlikes: '`!countlikes -f 25-05-2015 -t 25-05-2016` atau `!countlikes --from 25-05-2015 --to 25-05-2016`\n',
  help: '',
  admins: '',
  promote: '`!promote -u try.aji` atau `!promote --user try.aji`\n',
  demote: '`!demote -u try.aji` atau `!demote --user try.aji`\n',
  channels: '',
  setbroadcast: '`!setbroadcast -c general -b on` atau `!setbroadcast --channel general --broadcast on`',
};

const specificHelpTexts = {
  review: helpTemplate('review', mediaArgs + sortParams, cmdExamples.review),
  mostlikes: helpTemplate('mostlikes', mediaArgs, cmdExamples.mostlikes),
  countlikes: helpTemplate('countlikes', mediaArgs, cmdExamples.countlikes),
  help: 'Tidak diperlukan bantuan untuk perintah ini.\n',
  admins: 'Tidak diperlukan bantuan untuk perintah ini.\n',
  promote: helpTemplate('promote', moteArgs, cmdExamples.promote),
  demote: helpTemplate('demote', moteArgs, cmdExamples.demote),
  channels: 'Tidak diperlukan bantuan untuk perintah ini.\n',
  setbroadcast: helpTemplate('setbroadcast', setBroadcastArgs, cmdExamples.setbroadcast),
};

module.exports = {
  generalHelpText,
  specificHelpTexts,
};
