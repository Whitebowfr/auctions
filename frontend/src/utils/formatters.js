export const formatCurrency = (value) => {
  return Number(value || 0).toFixed(2) + " €";
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

export const formatProfit = (startingPrice, finalPrice) => {
  const profit = finalPrice - startingPrice;
  return profit >= 0 ? 
    `+${formatCurrency(profit)}` : 
    `${formatCurrency(profit)}`;
};

export const formatAsPhoneNumber = (text) => {
  text = text.replaceAll(' ', '')
  if (text.length < 4) return text
  let output = ""
  if (text[0] == "+") {
    output = "+" + text[1] + text[2] + ' ' + text[3] + ' '
    text = text.substring(4)
  }
  output += text.replace(/.{2}/g, '$& ')
  output = output.trim()
  return output
}

export const validatePhoneNumber = (text) => {
  if (text.match(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/gmi)) {
    return ""
  }
  return "Numéro invalide"
}