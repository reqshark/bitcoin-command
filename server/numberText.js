var convert_hundreds, convert_millions, convert_tens, convert_thousands, ones, teens, tens;

exports.numberToText = function(num) {
  if (num === 0) {
    return "zero";
  } else {
    return convert_millions(num);
  }
};

convert_millions = function(num) {
  if (num >= 1000000) {
    return convert_millions(Math.floor(num / 1000000)) + " million " + convert_thousands(num % 1000000);
  } else {
    return convert_thousands(num);
  }
};

convert_thousands = function(num) {
  if (num >= 1000) {
    return convert_hundreds(Math.floor(num / 1000)) + " thousand " + convert_hundreds(num % 1000);
  } else {
    return convert_hundreds(num);
  }
};

convert_hundreds = function(num) {
  if (num > 99) {
    return ones[Math.floor(num / 100)] + " hundred " + convert_tens(num % 100);
  } else {
    return convert_tens(num);
  }
};

convert_tens = function(num) {
  if (num < 10) {
    return ones[num];
  } else {
    if (!(num >= 10 && num < 20)) {
      return tens[Math.floor(num / 10)] + " " + ones[num % 10];
    }
  }
};

ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
