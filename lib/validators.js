function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

function isValidIdCard(id) {
  if (!/^\d{17}[\dX]$/i.test(id)) {
    return false;
  }
  const birth = id.slice(6, 14);
  const year = Number(birth.slice(0, 4));
  const month = Number(birth.slice(4, 6));
  const day = Number(birth.slice(6, 8));
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const parity = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
  const digits = id.toUpperCase().split("");
  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    sum += Number(digits[i]) * factors[i];
  }
  const check = parity[sum % 11];
  return check === digits[17];
}

module.exports = {
  isValidPhone,
  isValidIdCard,
};
