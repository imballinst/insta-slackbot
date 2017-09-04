/**
 * General commands help
 */
const generalHelpTextArray = [
  'Ada dua tipe perintah, yaitu perintah administratif dan perintah query Instagram.',
  '\t1. *Perintah administratif*',
  '\t\t• `bantuan`: Memberikan daftar perintah-perintah yang dapat diinput oleh admin',
  '\t\t• `list admin`: Menampilkan daftar admin yang berhak memberikan perintah',
  '\t\t• `promosi`: Memberikan akses admin kepada seorang user',
  '\t\t• `demosi`: Mencabut akses admin dari seorang user',
  '\t\t• `list channel`: Menampilkan daftar channel broadcast dari post-post Instagram',
  '\t\t• `aktifkan`: Menyalakan salah satu channel broadcast dari post-post Instagram',
  '\t\t• `nonaktifkan`: Mematikan salah satu channel broadcast dari post-post Instagram',
  '\t2. *Perintah query Instagram*',
  '\t\t• `review`: Melakukan rekapitulasi post-post dari kurun waktu tertentu',
  '\t\t• `likes terbanyak`: Mencari post-post dengan jumlah likes terbanyak dari kurun waktu tertentu',
  '\t\t• `jumlah likes`: Menghitung jumlah post likes  dari kurun waktu tertentu',
  'Untuk mengetahui detil perintah, ketik perintah tersebut diikuti dengan *bantuan*. Contoh: `bantuan promosi`',
];
const generalHelpText = generalHelpTextArray.join('\n');

/**
 * Specific commands help
 */
function helpTemplate(command, help, example) {
  const header = `Panduan perintah *${command}*: \`${command} [argumen]\`\n`;
  const body = `Daftar argumen yang dapat digunakan:\n ${help}`;
  const exampleText = example !== '' ? `Contoh penggunaan: ${example}\n` : '';

  return header + body + exampleText;
}

const mediaArgs =
  '\t• `dari`, `dr` (*wajib*): waktu awal dalam format *DD-MM-YYYY*. Contoh: `dari 25-05-2015`. Default: awal minggu ini.\n' +
  '\t• `sampai`, `sampe`, `smp`, `hingga` (*wajib*): waktu akhir dalam format *DD-MM-YYYY*. Contoh: `sampai 25-05-2016`. Default: akhir minggu ini.\n';
const sortParams =
  '\t• `urutkan`, `urutin`: urutan hasil dalam format `[field] [urutan]`. Contoh: `urutkan likes membesar`. Default: `urutkan time membesar`\n' +
  '\t\t- *field*: atribut untuk diurutkan, diantaranya `likes`, `comments`, `time`, `tags`.\n' +
  '\t\t- *order*: urutan hasil query, yaitu `mengecil` atau `membesar`.\n';

const moteArgs = '\t• `user`, `pengguna` (*wajib*): nama username. Contoh: `user try.aji`\n';
const activateArgs =
  '\t• `channel`, `kanal` (*wajib*): nama channel atau `~here`. Contoh: `channel general`. Default: `-`\n';

// Examples
const cmdExamples = {
  review: '`review dari 25-05-2015 sampai 25-05-2016 urutkan likes membesar` atau `review dr 25-05-2015 smp 25-05-2016 urutkan likes membesar`',
  mostlikes: '`likes terbanyak dari 25-05-2015 sampai 25-05-2016` atau `post terbanyak dr 25-05-2015 smp 25-05-2016`',
  countlikes: '`jumlah likes dari 25-05-2015 sampai 25-05-2016` atau `jumlah likes dr 25-05-2015 smp 25-05-2016`',
  help: '',
  admins: '',
  promote: '`promosi user try.aji` atau `promosikan pengguna try.aji`\n',
  demote: '`demosi user try.aji` atau `demosikan user try.aji`\n',
  channels: '',
  activate: '`aktifkan channel general` atau `aktifkan kanal general`',
  deactivate: '`nonaktifkan channel general` atau `nonaktifkan kanal general`',
};

const specificHelpTexts = {
  review: helpTemplate('review', mediaArgs + sortParams, cmdExamples.review),
  mostlikes: helpTemplate('likes terbanyak', mediaArgs, cmdExamples.mostlikes),
  countlikes: helpTemplate('jumlah likes', mediaArgs, cmdExamples.countlikes),
  help: 'Tidak diperlukan bantuan untuk perintah ini.\n',
  admins: 'Tidak diperlukan bantuan untuk perintah ini.\n',
  promote: helpTemplate('promosi', moteArgs, cmdExamples.promote),
  demote: helpTemplate('demosi', moteArgs, cmdExamples.demote),
  channels: 'Tidak diperlukan bantuan untuk perintah ini.\n',
  activate: helpTemplate('aktifkan', activateArgs, cmdExamples.activate),
  deactivate: helpTemplate('nonaktifkan', activateArgs, cmdExamples.deactivate),
};

module.exports = {
  generalHelpText,
  specificHelpTexts,
};
