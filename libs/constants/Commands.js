const events = ['direct_message'];

/**
 * Base regexes
 */
const dateRegex = /\d{1,2}(-|\/|\s){1}(\d{1,2}|(\w)+)+(-|\/|\s)\d{4}/;
const commandRegexes = {
  review: /\b(review|rekap)/gi,
  mostlikes: /\b((jumlah )*likes terbanyak)/gi,
  countlikes: /\b((hitung )?jumlah (post )?likes)/gi,
  admins: /\b((daftar|list){1} (admin(s)?){1})/gi,
  channels: /\b(daftar (channel(s)?){1}|list (channel(s)?){1})/gi,
  promote: /\b(promosi(kan)?){1}/gi,
  demote: /\b(demosi(kan)?){1}/gi,
  activate: /\b(aktif(kan)?){1}/gi,
  deactivate: /\b(nonaktif(kan)?){1}/gi,
  help: /^(help|(daftar perintah)|bantuan){1}$/gi,
  addkeywords: /\b(tambah(kan)?){1}/gi,
  removekeywords: /\b(hapus){1}/gi,
  listkeywords: /\b((daftar|list){1} (keyword(s)?)){1}/gi,
  notify: /\b(notifikasi(kan)?){1}/gi,
  denotify: /\b(denotifikasi(kan)?){1}/gi,
};

/**
 * Base params
 */
const mediaParams = {
  startDate: new RegExp((/(dari|dr){1} /).source + dateRegex.source, 'gi'),
  endDate: new RegExp((/(sampai|sampe|smp|hingga){1} /).source + dateRegex.source, 'gi'),
};
const userParams = { user: /(user|pengguna){1} .+/gi };
const channelParams = { channel: /(channel|kanal){1} .+/gi };
const keywordsParams = { keywords:  /(keyword(s)?){1} .+/gi }

/**
 * Base commands list
 */
const mediaCommandsList = ['review', 'mostlikes', 'countlikes'];
const adminCommandsList =
  ['help', 'admins', 'channels', 'promote', 'demote', 'activate', 'deactivate',
   'notify', 'denotify'];
const twitterCommandsList = ['addkeywords', 'removekeywords', 'listkeywords'];

/**
 * Complete commands list with regex and params
 */
const commands = [
  {
    key: 'review',
    regex: commandRegexes.review,
    params: {
      startDate: mediaParams.startDate,
      endDate: mediaParams.endDate,
      sort: /(urutkan|urutin){1} (likes|comments|time|tags){1} (mengecil|membesar){1}/gi,
    },
  },
  {
    key: 'mostlikes',
    regex: commandRegexes.mostlikes,
    params: mediaParams,
  },
  {
    key: 'countlikes',
    regex: commandRegexes.countlikes,
    params: mediaParams,
  },
  {
    key: 'help',
    regex: commandRegexes.help,
    params: {},
  },
  {
    key: 'admins',
    regex: commandRegexes.admins,
    params: {},
  },
  {
    key: 'channels',
    regex: commandRegexes.channels,
    params: {},
  },
  {
    key: 'promote',
    regex: commandRegexes.promote,
    params: userParams,
  },
  {
    key: 'demote',
    regex: commandRegexes.demote,
    params: userParams,
  },
  {
    key: 'activate',
    regex: commandRegexes.activate,
    params: channelParams,
  },
  {
    key: 'deactivate',
    regex: commandRegexes.deactivate,
    params: channelParams,
  },
  {
    key: 'addkeywords',
    regex: commandRegexes.addkeywords,
    params: keywordsParams,
  },
  {
    key: 'removekeywords',
    regex: commandRegexes.removekeywords,
    params: keywordsParams,
  },
  {
    key: 'listkeywords',
    regex: commandRegexes.listkeywords,
    params: {}
  },
  {
    key: 'notify',
    regex: commandRegexes.notify,
    params: userParams
  },
  {
    key: 'denotify',
    regex: commandRegexes.denotify,
    params: userParams
  },
];

module.exports = {
  mediaCommandsList,
  adminCommandsList,
  twitterCommandsList,
  events,
  commands,
  commandRegexes,
};
