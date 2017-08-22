const dateRegex = /\d{1,2}(-|\/|\s){1}(\d{1,2}|(\w)+)+(-|\/|\s)\d{4}/;
const mediaParams = {
  startDate: new RegExp((/(dari|dr){1} /).source + dateRegex.source, 'gi'),
  endDate: new RegExp((/(sampai|sampe|smp|hingga){1} /).source + dateRegex.source, 'gi'),
};
const userParams = { user: /.+/gi };
const channelParams = { channel: /.+/gi };

const mediaCommandsList = ['review', 'mostlikes', 'countlikes'];
const adminCommandsList =
  ['help', 'admins', 'channels', 'promote', 'demote', 'activate', 'deactivate'];

const commands = [
  {
    key: 'review',
    regex: /(review|rekap)+/gi,
    params: {
      startDate: mediaParams.startDate,
      endDate: mediaParams.endDate,
      sort: /urutkan (likes|comments|time|tags){1} (mengecil|membesar){1}/gi,
    },
  },
  {
    key: 'mostlikes',
    regex: /(jumlah )*likes terbanyak/gi,
    params: mediaParams,
  },
  {
    key: 'countlikes',
    regex: /(hitung ){0,1}jumlah (post ){0,1}likes/gi,
    params: mediaParams,
  },
  {
    key: 'help',
    regex: /^(help|daftar perintah|bantuan){1}$/gi,
    params: {},
  },
  {
    key: 'admins',
    regex: /^(daftar (admin|admins){1}|list (admin|admins){1})$/gi,
    params: {},
  },
  {
    key: 'channels',
    regex: /^(daftar (channel|channels){1}|list (channel|channels){1})$/gi,
    params: {},
  },
  {
    key: 'promote',
    regex: /(promosi(kan){0,1}){1}/gi,
    params: userParams,
  },
  {
    key: 'demote',
    regex: /(demosi(kan){0,1}){1}/gi,
    params: userParams,
  },
  {
    key: 'activate',
    regex: /(aktif(kan){0,1}){1}/gi,
    params: channelParams,
  },
  {
    key: 'deactivate',
    regex: /(nonaktif(kan){0,1}){1}/gi,
    params: channelParams,
  },
];

module.exports = {
  mediaCommandsList,
  adminCommandsList,
  commands,
};
