export const getChatId = (uid1, uid2) => {
  return uid1 < uid2
    ? `${uid1}_${uid2}`
    : `${uid2}_${uid1}`;
};