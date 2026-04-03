const numberToWords = (num) => {
  if (num === 0) return "Zero";
  
  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];
  
  const scales = ["", "Thousand", "Million", "Billion"];
  
  const convertLessThanThousand = (n) => {
    let result = "";
    
    if (n >= 100) {
      result += units[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    
    if (n > 0) {
      result += units[n] + " ";
    }
    
    return result;
  };
  
  // Split the number into integer and decimal parts
  const numStr = num.toString();
  const parts = numStr.split('.');
  const integerPart = parseInt(parts[0]);
  const decimalPart = parts[1];
  
  let result = "";
  let tempNum = integerPart;
  let scaleIndex = 0;
  
  // Convert the integer part
  if (integerPart === 0) {
    result = "Zero";
  } else {
    while (tempNum > 0) {
      const chunk = tempNum % 1000;
      if (chunk !== 0) {
        const chunkWords = convertLessThanThousand(chunk);
        result = chunkWords + scales[scaleIndex] + " " + result;
      }
      tempNum = Math.floor(tempNum / 1000);
      scaleIndex++;
    }
  }
  
  // Add "Only" for whole numbers, or handle decimal part
  if (decimalPart && parseInt(decimalPart) > 0) {
    // Convert decimal part to cents (take only first 2 digits)
    const cents = parseInt(decimalPart.padEnd(2, '0').substring(0, 2));
    if (cents > 0) {
      const centsInWords = convertLessThanThousand(cents).trim();
      result = result.trim() + " and " + centsInWords + (cents === 1 ? " Cent" : " Cents");
    }
  }
  
  return result.trim() + " Only";
};

export default numberToWords;
