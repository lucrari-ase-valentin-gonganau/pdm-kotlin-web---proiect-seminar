import qrcode from "qrcode-generator";
/**
 * Generam un WS pentru a putea comunica cu clientul
 */
const generateQRCodeUrlForWS = (onlyUrl = false) => {
  const URL = process.env.WS_QR_CODE;

  if (!URL) {
    throw new Error("URL_QR_CODE is not defined in the environment variables");
  }

  if (onlyUrl) {
    return URL;
  }

  const qr = qrcode(0, "L");

  qr.addData(URL);
  qr.make();
  return qr.createDataURL(8);
};

export { generateQRCodeUrlForWS };
